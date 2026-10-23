import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { verifyCheckpoint, verifyStandalone } from '../../scripts/verify-migration.mjs';

const repository = path.resolve(import.meta.dirname, '../..');
const manifestSource = await readFile(path.join(repository, '.migration/source-manifest.json'), 'utf8');
const manifest = JSON.parse(manifestSource);
const git = (root, args) => execFileSync('git', ['--no-pager', '-C', root, ...args], {
  env: { ...process.env, GIT_MASTER: '1', GIT_PAGER: 'cat', PAGER: 'cat',
    GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.test',
    GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.test' },
  stdio: 'pipe',
});
const put = async (root, file, value) => {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), JSON.stringify(value));
};

async function pathFixture(t) {
  const temporary = path.join(repository, '.qa-tmp');
  await mkdir(temporary, { recursive: true });
  const parent = await mkdtemp(path.join(temporary, 'toast-path-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, 'repo');
  const sibling = path.join(parent, 'sibling');
  await mkdir(root);
  await put(sibling, 'package.json', { name: 'probe', version: '1.0.0', private: true });
  git(root, ['init', '--quiet']);
  await put(root, 'package.json', { name: '@ilokesto/toast', version: '2.0.1' });
  await writeFile(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - .\n  - website\n  - docs-publication/runtime\n');
  return { root, sibling };
}

function standaloneCli(t, root) {
  const command = [process.execPath, path.join(repository, 'scripts/verify-migration.mjs'),
    'standalone', '--repo', root, '--manifest-stdin', '-'];
  const result = spawnSync(command[0], command.slice(1), {
    cwd: root, input: manifestSource, encoding: 'utf8', timeout: 10_000,
  });
  t.diagnostic(JSON.stringify({ command, cwd: root, exitCode: result.status, stdout: result.stdout, stderr: result.stderr }));
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  return result;
}

for (const protocol of ['file', 'link']) {
  for (const spelling of ['./../sibling', './nested/../../sibling', '.\\nested\\..\\..\\sibling', './escape']) {
    test(`standalone CLI path: ${protocol}:${spelling} -> external target rejected`, async t => {
      const { root, sibling } = await pathFixture(t);
      await symlink(sibling, path.join(root, 'escape'), 'dir');
      await writeFile(path.join(root, '.gitignore'), 'escape\n');
      await put(root, 'package.json', {
        name: '@ilokesto/toast', dependencies: { probe: `${protocol}:${spelling}` },
      });
      git(root, ['add', 'package.json', 'pnpm-workspace.yaml']);

      const result = standaloneCli(t, root);

      assert.equal(result.status, 1);
      assert.equal(JSON.parse(result.stderr).code, 'EXTERNAL_DEPENDENCY_PATH');
    });
  }
}

test('standalone CLI path: internal pnpm aliases, relative paths and literal percent -> accepted', async t => {
  const { root } = await pathFixture(t);
  await put(root, 'docs-publication/runtime/package.json', {
    name: '@ilokesto/toast-docs-runtime', version: '0.0.0', private: true,
  });
  await put(root, '%2e%2e/payload/package.json', { name: 'toast-local-data', version: '1.0.0', private: true });
  await symlink(path.join(root, 'docs-publication/runtime'), path.join(root, 'internal-runtime'), 'dir');
  await put(root, 'website/package.json', {
    name: '@ilokesto/toast-website', private: true,
    dependencies: {
      'own-toast': 'workspace:@ilokesto/toast@*',
      runtime: 'workspace:@ilokesto/toast-docs-runtime@*',
      'relative-runtime': 'workspace:../docs-publication/runtime',
      'relative-root': 'workspace:..',
      'linked-runtime': 'link://../docs-publication/runtime',
      'internal-symlink': 'link:../internal-runtime',
      'local-data': 'file:../%2e%2e/payload',
      'linked-percent': 'link:../%2e%2e/payload',
    },
  });
  const installed = spawnSync('pnpm', ['install', '--lockfile-only', '--offline', '--ignore-scripts'], {
    cwd: root, encoding: 'utf8', timeout: 30_000,
  });
  t.diagnostic(JSON.stringify({ command: ['pnpm', 'install', '--lockfile-only', '--offline', '--ignore-scripts'],
    cwd: root, exitCode: installed.status, stdout: installed.stdout, stderr: installed.stderr }));
  assert.equal(installed.error, undefined);
  assert.equal(installed.status, 0, installed.stderr);

  const result = standaloneCli(t, root);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).results[0].manifests, 4);
});

for (const range of ['workspace:../../sibling', 'workspace:@ilokesto/store@*']) {
  test(`standalone CLI path: own-name dependency redirects to ${range} -> rejected`, async t => {
    const { root } = await pathFixture(t);
    await put(root, 'website/package.json', {
      name: '@ilokesto/toast-website', private: true, dependencies: { '@ilokesto/toast': range },
    });

    const result = standaloneCli(t, root);

    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stderr).code, 'SIBLING_DEPENDENCY');
  });
}

test('standalone workspace: own library and private runtime -> permitted without sibling links', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'toast-workspace-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  git(root, ['init', '--quiet']);
  await put(root, 'package.json', { name: '@ilokesto/toast', version: '9.0.0' });
  await put(root, 'website/package.json', { name: '@ilokesto/toast-website', private: true, dependencies: {
    '@ilokesto/toast': 'workspace:*', '@ilokesto/toast-docs-runtime': 'workspace:*',
  } });
  await put(root, 'docs-publication/runtime/package.json', { name: '@ilokesto/toast-docs-runtime', private: true,
    dependencies: { '@ilokesto/released-toast': 'npm:@ilokesto/toast@2.0.0' } });
  git(root, ['add', '.']);

  assert.equal((await verifyStandalone(root, manifest)).manifests, 3);

  await put(root, 'website/package.json', { name: '@ilokesto/toast-website', private: true,
    dependencies: { '@ilokesto/store': 'workspace:*' } });
  await assert.rejects(verifyStandalone(root, manifest), /SIBLING_DEPENDENCY/);
  await put(root, 'website/package.json', { name: '@ilokesto/toast-website', private: true,
    dependencies: { '@ilokesto/store': 'file:../../store' } });
  await assert.rejects(verifyStandalone(root, manifest), /EXTERNAL_DEPENDENCY_PATH/);
  await put(root, 'website/package.json', { name: '@ilokesto/toast-website', private: false,
    dependencies: { '@ilokesto/toast': 'workspace:*' } });
  await assert.rejects(verifyStandalone(root, manifest), /SIBLING_DEPENDENCY/);
  await put(root, 'website/package.json', { name: '@ilokesto/toast-website', private: true,
    dependencies: { '@ilokesto/queryable': '0.0.1' } });
  await assert.rejects(verifyStandalone(root, manifest), /PRIVATE_PACKAGE_DEPENDENCY/);
});

test('checkpoint: future development commit and new version -> immutable history remains valid', async t => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'toast-future-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, 'clone');
  git(repository, ['clone', '--no-local', '--quiet', repository, root]);
  // The working copy carries the uncommitted standalone state; a bare clone
  // would resurrect the pre-migration workspace manifest. Start the future
  // fixture from the actual current tree instead.
  await cp(path.join(repository, 'package.json'), path.join(root, 'package.json'));
  const current = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  current.version = '9.0.0';
  await put(root, 'package.json', current);
  await writeFile(path.join(root, 'future-development.txt'), 'future development\n');
  git(root, ['add', 'package.json', 'future-development.txt']);
  git(root, ['commit', '--quiet', '-m', 'Future development fixture']);

  const result = await verifyCheckpoint(root, manifest);

  assert.equal(result.checkpoint, manifest.checkpoint.commit);
  assert.notEqual(git(root, ['rev-parse', 'HEAD']).toString().trim(), manifest.checkpoint.commit);
  await verifyStandalone(root, manifest);
});
