# @ilokesto/toast

This repository owns one public library.
Use Node 24.22.1 and pnpm 10.17.1. Run commands from this root.

- Keep the toast notification API, timers, queue and lifecycle behavior intact.
- Library source and tests are in `src/` and `test/`.
- `@ilokesto/overlay` and `@ilokesto/store` are registry dependencies. Only this
  library and private workspaces inside this repository may use workspace links.
- Preserve the physical Overlay/Store identity across the runtime and direct overlay imports.
- Run `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm test:tooling`.
- Consumer-facing changes need a root Changeset.
- `release:verify --sha <full-SHA>` is read-only. Main merges maintain the Changesets release PR; merging
  it publishes only the exact successful Verify artifact through GitHub Actions with the
  latest dist-tag. Never publish locally.
- Before rollout, enable `Allow GitHub Actions to create and approve pull requests`
  and configure `NPM_TOKEN` in the `Production` environment.
