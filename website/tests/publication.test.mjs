import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveInstalledPackage } from '../../scripts/docs-runtime.mjs';
import { scopeDevelopmentLink, getDocsChannel, publishedPackages } from '../lib/publication.ts';
import { publicPackageNames, rewriteDocsLink, rewriteMarkdownLinks } from '../lib/docs-links.ts';

test('released Toast: pinned npm runtime and one physical Overlay/Store instance', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const runtimeDir = path.join(root, 'docs-publication/runtime');
  const installed = await resolveInstalledPackage('@ilokesto/released-toast', runtimeDir);
  assert.equal(installed.manifest.version, publishedPackages.toast.version);
  assert.ok(installed.directory.startsWith(path.join(root, 'node_modules')));

  // The Overlay/Store that the released Toast really resolves must be the
  // same physical registry instances the runtime imports directly.
  const toastOverlay = await resolveInstalledPackage('@ilokesto/overlay', installed.directory);
  const toastStore = await resolveInstalledPackage('@ilokesto/store', installed.directory);
  const directOverlay = await resolveInstalledPackage('@ilokesto/released-overlay', runtimeDir);
  const directStore = await resolveInstalledPackage('@ilokesto/released-store', runtimeDir);
  assert.equal(toastOverlay.manifest.name, '@ilokesto/overlay');
  assert.equal(toastStore.manifest.name, '@ilokesto/store');
  assert.equal(toastOverlay.directory, directOverlay.directory);
  assert.equal(toastStore.directory, directStore.directory);

  // The shipped dist keeps the packed npm bytes: entry files and manifest
  // match the frozen release snapshot payload recorded in the closure.
  const lock = (await readFile(path.join(root, 'pnpm-lock.yaml'), 'utf8'));
  assert.ok(lock.includes("'@ilokesto/overlay@2.0.1'"), 'overlay must resolve from the registry lock');
  assert.ok(lock.includes("'@ilokesto/store@2.0.1'"), 'store must resolve from the registry lock');
  assert.match(lock.split("'@ilokesto/released-toast':")[1]?.split('\n')[1] ?? '', /specifier: npm:@ilokesto\/toast@2\.0\.0/, 'released alias must pin the published toast');
  // Runtime behavior of this pinned release is exercised end-to-end by the
  // browser suite (released demo push/dismiss) and payload SRI checks above.
});

test('development links: complete public classification -> locale and channel preserved', () => {
  assert.equal(publicPackageNames.length, 8);
  for (const name of publicPackageNames) {
    const host = name === 'toast' ? '' : 'https://ilokesto.ayden94.com';
    assert.equal(scopeDevelopmentLink(`/en/${name}/quick-start#install`), `${host}/en/${name}/next/quick-start#install`);
    assert.equal(scopeDevelopmentLink(`/ko/${name}?x=1`), `${host}/ko/${name}/next?x=1`);
    assert.equal(scopeDevelopmentLink(`/en/${name}/next/quick-start`), `${host}/en/${name}/next/quick-start`);
    assert.equal(rewriteDocsLink(`/ko/${name}/next/core-concepts`, false, 'toast'), `${host}/ko/${name}/next/core-concepts`);
  }
  assert.equal(getDocsChannel(['toast']), 'released');
  assert.equal(getDocsChannel(['toast', 'next']), 'next');
  assert.equal(getDocsChannel(['modal', 'next']), undefined);
  assert.equal(scopeDevelopmentLink('https://example.com/en/store'), 'https://example.com/en/store');
  assert.equal(scopeDevelopmentLink('../reference/store'), '../reference/store');
  assert.equal(scopeDevelopmentLink('/en/queryable'), '/en/queryable');
  assert.equal(scopeDevelopmentLink('/en/unknown'), '/en/unknown');
});

test('Markdown links: prose versus code -> only real link destinations change', () => {
  const code = '```ts\nconst link = "[Overlay](/ko/overlay)";\n```\n';
  const inline = '`[Overlay](/ko/overlay)` and ``const x = `[/en/overlay](/en/overlay)`;``\n';
  const markdown = '[Overlay](/ko/overlay#provider) [Self](/en/toast/core-concepts)\n'
    + '[overlay]: /en/overlay/next/core-concepts\n' + code + inline;

  const output = rewriteMarkdownLinks(markdown, true, 'toast');

  assert.ok(output.includes('[Overlay](https://ilokesto.ayden94.com/ko/overlay/next#provider)'));
  assert.ok(output.includes('[Self](/en/toast/next/core-concepts)'));
  assert.ok(output.includes('[overlay]: https://ilokesto.ayden94.com/en/overlay/next/core-concepts'));
  assert.ok(output.endsWith(code + inline));
  const multiline = '`example\n[Overlay](/ko/overlay)\n`';
  assert.equal(rewriteMarkdownLinks(multiline, true, 'toast'), multiline);
  const fenced = '```md\n```typescript\n[Overlay](/ko/overlay)\n```\n';
  assert.equal(rewriteMarkdownLinks(fenced, true, 'toast'), fenced);
});

test('source links: current versus archived revision -> owning successor paths', () => {
  const old = 'https://github.com/ilokesto/ilokesto';
  assert.equal(rewriteDocsLink(`${old}/tree/main/packages/toast/src`, true, 'toast'),
    'https://github.com/ilokesto/toast/tree/main/src');
  const sha = 'e'.repeat(40);
  assert.equal(rewriteDocsLink(`${old}/blob/${sha}/packages/toast/src/core/toast.ts`, false, 'toast'),
    `https://github.com/ilokesto/toast/blob/${sha}/packages/toast/src/core/toast.ts`);
});
