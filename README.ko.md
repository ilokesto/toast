# @ilokesto/toast

익숙한 `toast.*` API, 기본 UI와 커스텀 렌더링을 제공하는 React 알림 패키지입니다.

[![npm version](https://img.shields.io/npm/v/%40ilokesto%2Ftoast?style=flat&color=555)](https://www.npmjs.com/package/@ilokesto/toast)

[문서](https://ilokesto.ayden94.com/ko/toast) | [API](./docs/api-reference.ko.mdx) | [English](./README.md)

- `toast.success`, `toast.error`, `toast.loading`, `toast.promise`로 알림 흐름을 만듭니다.
- 고유한 `toasterId`로 runtime을 분리하고 옵션과 자동 닫기를 설정합니다.
- `ToastBar`, headless hook과 선택적 top-layer transport를 제공합니다.

## 설치

```bash
pnpm add @ilokesto/toast react react-dom
```

## 빠른 시작

`toast.*`를 호출하기 전에 해당 `Toaster`가 마운트되어 있어야 합니다. 이벤트 핸들러에서 호출하세요.

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

여러 stack에는 서로 다른 `toasterId`를 사용하세요. `useToaster()`는 `Toaster`의 하위 커스텀 렌더러에서만 사용합니다. 기본 행은 status/alert live region을 제공하지만, 행 전체를 교체하면 `role`과 live-region 접근성은 직접 책임져야 합니다.

## 더 알아보기

- [Runtime, timer와 표시 모델](./docs/core-concepts.ko.mdx)
- [기본 옵션, 커스텀 행과 transport](./docs/practical-guide.ko.mdx)
- [Facade, 컴포넌트와 headless API](./docs/api-reference.ko.mdx)
- [등록, 위치와 접근성 문제 해결](./docs/troubleshooting.ko.mdx)
- [react-hot-toast에서 마이그레이션](./MIGRATION_FROM_REACT_HOT_TOAST.ko.md)

<details>
<summary>개발</summary>

이 저장소 루트에서 Node 22와 pnpm 10.17.1을 사용하세요.

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

`dismiss()`는 닫기를 시작하고 `removeDelay` 후 제거하며 `remove()`는 즉시 제거합니다. Loading은 duration이 무한대이므로 같은 ID를 갱신하거나 명시적으로 닫으세요.

Pause는 dismiss만 멈추고 closing 항목의 제거는 멈추지 않습니다. Resume은 일시정지 시간을 반영하며 ID 재사용은 이전 제거 예약을 취소합니다.

명령은 `toast.ts` → `createToastRuntime` 순서로 읽으세요. Runtime은 overlay presence, toast 상태와 구독 snapshot identity를 소유합니다. 옵션 병합은 순수 계산이고 timer는 runtime 명령만 호출합니다.

`transport="top-layer"`는 manual popover를 사용하고 미지원 브라우저에서는 inline으로 전환합니다.

문서: `pnpm docs:start`. `docs/`는 한영 원본, `website/`는 렌더러입니다.

`@ilokesto/overlay`와 `@ilokesto/store`는 레지스트리 의존성입니다. Runtime과 직접 import한 overlay가 같은 물리적 Overlay/Store 인스턴스를 사용하도록 유지하세요.

라이선스: MIT.

</details>
