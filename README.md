# @ilokesto/toast

React notifications with a familiar `toast.*` API, a default UI, and custom rendering.

[![npm version](https://img.shields.io/npm/v/%40ilokesto%2Ftoast?style=flat&color=555)](https://www.npmjs.com/package/@ilokesto/toast)

[Docs](https://ilokesto.ayden94.com/en/toast) | [API](./docs/api-reference.mdx) | [한국어](./README.ko.md)

- Notification flows with `toast.success`, `toast.error`, `toast.loading`, and `toast.promise`.
- Separate runtimes by unique `toasterId`, with configurable defaults and auto-dismiss.
- Composable `ToastBar`, headless hooks, and optional top-layer transport.

## Installation

```bash
pnpm add @ilokesto/toast react react-dom
```

## Quick start

Mount the matching `Toaster` before calling `toast.*`; trigger calls from an event handler.

```tsx
import { Toaster, toast } from '@ilokesto/toast';

function NotifyButton() {
  function notify() {
    toast.success('Saved successfully', {
      toasterId: 'app',
      duration: 3000,
    });
  }

  return <button onClick={notify}>Show toast</button>;
}

export function App() {
  return (
    <>
      <NotifyButton />
      <Toaster
        toasterId="app"
        position="top-right"
        toastOptions={{ duration: 4000 }}
      />
    </>
  );
}
```

Use a unique `toasterId` for each stack. `useToaster()` belongs in a descendant custom renderer under `Toaster`. Default rows provide status/alert live regions; replacing the whole row makes you responsible for its `role` and live-region accessibility.

## Further reading

- [Runtime, timers, and visibility](./docs/core-concepts.mdx)
- [Defaults, custom rows, and transports](./docs/practical-guide.mdx)
- [Facade, components, and headless API](./docs/api-reference.mdx)
- [Registration, position, and accessibility troubleshooting](./docs/troubleshooting.mdx)
- [Migrate from react-hot-toast](./MIGRATION_FROM_REACT_HOT_TOAST.md)

<details>
<summary>Development</summary>

Use Node 24.22.1 and pnpm 10.17.1 from this repository root.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm test:tooling
pnpm migrate:verify
pnpm docs:publication:verify
pnpm docs:typecheck
pnpm docs:build
pnpm docs:test
```

`dismiss()` starts closing and removes after `removeDelay`; `remove()` removes immediately. Loading duration is infinite: update the same id or dismiss explicitly.

Pause stops dismissal, not removal of closing items. Resume accounts for paused time; reusing an id cancels its old removal.

Follow `toast.ts` → `createToastRuntime`. The runtime owns overlay presence, toast state, and subscription snapshot identity. Option merging is pure; timers only invoke runtime commands.

`transport="top-layer"` uses manual popover and falls back to inline on unsupported browsers.

Docs: `pnpm docs:start`. `docs/` holds bilingual originals; `website/` renders them.

`@ilokesto/overlay` and `@ilokesto/store` are registry dependencies. Keep the runtime and any directly imported overlay on the same physical Overlay/Store instance.

License: MIT.

</details>
