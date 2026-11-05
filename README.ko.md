# @ilokesto/toast

`position` prop은 새 토스트의 기본 위치를 정합니다. 개별 토스트와 타입별 기본
옵션에 지정한 `position`은 같은 Toaster 안에서 각각의 화면 영역에 표시됩니다.
`limit`은 모든 영역을 합친 표시 한도이며 `reverseOrder`와 `gutter`는 영역별로
적용됩니다. 기본 위치를 바꿔도 기존 토스트는 생성할 때 결정된 위치에 남습니다.

익숙한 `toast.*` API, 기본 UI와 커스텀 렌더링을 제공하는 React 알림 패키지입니다.

[![npm version](https://img.shields.io/npm/v/%40ilokesto%2Ftoast?style=flat&color=555)](https://www.npmjs.com/package/@ilokesto/toast)

[English](./README.md)

- `toast.success`, `toast.error`, `toast.loading`, `toast.promise`로 알림 흐름을 만듭니다.
- 고유한 `toasterId`로 runtime을 분리하고 옵션과 자동 닫기를 설정합니다.
- `ToastBar`, headless hook과 선택적 top-layer transport를 제공합니다.

## 설치

기여자는 [JSDOC.md](./JSDOC.md)의 영어 API 문서 계약을 따르고 변경 제출 전에 `pnpm lint:jsdoc` 또는 전체 `pnpm test` 검증을 실행하세요.

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

[react-hot-toast에서 마이그레이션](./MIGRATION_FROM_REACT_HOT_TOAST.ko.md)

<details>
<summary>개발</summary>

이 저장소 루트에서 Node 24.22.1과 pnpm 10.17.1을 사용하세요.

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
```

`typecheck`는 라이브러리 코드를 검사합니다. `test`는 한 번 빌드한 뒤 `test:unit`, `test:tooling`를 실행합니다. 런타임 테스트는 `tests/unit`, fixture·setup은 `tests/fixtures`, Node 도구 테스트는 `tests/tooling`에 있습니다.

`dismiss()`는 닫기를 시작하고 `removeDelay` 후 제거하며 `remove()`는 즉시 제거합니다. Loading은 duration이 무한대이므로 같은 ID를 갱신하거나 명시적으로 닫으세요.

Pause는 dismiss만 멈추고 closing 항목의 제거는 멈추지 않습니다. Resume은 일시정지 시간을 반영하며 ID 재사용은 이전 제거 예약을 취소합니다.
`clear()`는 pause 소유권도 초기화하므로 이후 토스트는 resume 호출 없이 정상적으로
만료됩니다. 이후 pause는 새 일시정지 주기로 시작합니다.

대기 토스트의 duration은 표시 한도 `limit` 안에 들어올 때 시작합니다. 한도를
줄여 숨겨진 항목은 남은 수명을 보존하고, 다시 표시될 때 이어서 사용합니다.
숨겨진 시간과 pause 시간은 겹쳐도 수명에서 제외됩니다. Closing 항목은 제거될
때까지 자리를 차지합니다. 같은 ID 갱신은 수명을 초기화하며 대기 중이면 표시될
때 새 수명을 시작합니다. 큐와 한도는 모든 위치 영역이 공유합니다.

`clear()`와 Toaster unmount, `remove()`, 같은 ID의 새 갱신은 이전 promise
토스트의 UI 갱신 권한을 해제합니다. 오래된 완료는 행을 다시 만들거나 최신
알림을 덮지 않고 메시지 resolver도 호출하지 않습니다. 반환된 Promise는 원래
작업의 성공 값과 rejection을 그대로 전달하며 작업 자체를 취소하지 않습니다.

명령은 `toast.ts` → `createToastRuntime` 순서로 읽으세요. Runtime은 overlay presence, toast 상태와 구독 snapshot identity를 소유합니다. 옵션 병합은 순수 계산이고 timer는 runtime 명령만 호출합니다.

`transport="top-layer"`는 manual popover를 사용하고 미지원 브라우저에서는 inline으로 전환합니다.

`@ilokesto/overlay`와 `@ilokesto/store`는 레지스트리 의존성입니다. Runtime과 직접 import한 overlay가 같은 물리적 Overlay/Store 인스턴스를 사용하도록 유지하세요.

라이선스: MIT.

</details>
