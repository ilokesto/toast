# Toast documentation

This is the package-owned renderer for `@ilokesto/toast`. It renders the frozen
released inputs from `docs-publication` and the current `docs/` tree under `/next`.

- Keep both locales, next/released separation, the current appearance and the Toast API.
- Same-package navigation stays local; foreign package links go to
  `https://ilokesto.ayden94.com/<locale>/<package>` with the `/next` channel preserved.
- The released demo runs on pinned registry aliases in `docs-publication/runtime`.
- Run `pnpm docs:typecheck`, `pnpm docs:build` and `pnpm docs:test` from the root.
