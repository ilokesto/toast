# @ilokesto/toast

React notifications with a familiar `toast.*` API, a default UI, and custom rendering.

[![npm version](https://img.shields.io/npm/v/%40ilokesto%2Ftoast?style=flat&color=555)](https://www.npmjs.com/package/@ilokesto/toast)

[한국어](./README.ko.md)

- Notification flows with `toast.success`, `toast.error`, `toast.loading`, and `toast.promise`.
- Separate runtimes by unique `toasterId`, with configurable defaults and auto-dismiss.
- Composable `ToastBar`, headless hooks, and optional top-layer transport.

## Installation

Contributors: follow the English API contract in [JSDOC.md](./JSDOC.md) and run `pnpm lint:jsdoc` or the complete `pnpm test` gate before submitting changes.

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

The `position` prop sets the default for new toasts. Per-toast and per-type
`position` options render in their own viewport regions within the same Toaster.
`limit` applies across all regions; `reverseOrder` and `gutter` apply within each
region. Changing the default position keeps existing toasts at their resolved positions.

[Migrate from react-hot-toast](./MIGRATION_FROM_REACT_HOT_TOAST.md)

<details>
<summary>Development</summary>

Use Node 24.22.1 and pnpm 10.17.1 from this repository root.

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
```

`typecheck` checks library code. `test` builds once and runs `test:unit` and `test:tooling`. Runtime tests live in `tests/unit`, fixtures/setup in `tests/fixtures`, and Node tooling tests in `tests/tooling`.

`dismiss()` starts closing and removes after `removeDelay`; `remove()` removes immediately. Loading duration is infinite: update the same id or dismiss explicitly.

Pause stops dismissal, not removal of closing items. Resume accounts for paused time; reusing an id cancels its old removal.

Queued toasts start their duration when they enter the displayed `limit`.
Reducing the limit suspends hidden items with their remaining duration intact;
expanding it resumes them. Hidden and paused time never consume duration,
including when both overlap. Closing rows keep their slot until removal.
Updating an id resets its duration, starting immediately if displayed or on
promotion if queued. The queue and limit are shared across position regions.

Follow `toast.ts` → `createToastRuntime`. The runtime owns overlay presence, toast state, and subscription snapshot identity. Option merging is pure; timers only invoke runtime commands.

`transport="top-layer"` uses manual popover and falls back to inline on unsupported browsers.

`@ilokesto/overlay` and `@ilokesto/store` are registry dependencies. Keep the runtime and any directly imported overlay on the same physical Overlay/Store instance.

License: MIT.

</details>
