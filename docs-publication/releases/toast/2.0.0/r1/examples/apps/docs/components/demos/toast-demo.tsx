'use client';

import { useId, useState } from 'react';
import { ToastBar, Toaster, toast } from '@ilokesto/toast';
import {
  DemoFrame,
  demoButtonClass,
  demoSecondaryButtonClass,
  type DemoProps,
} from './demo-frame';

const copy = {
  en: {
    title: 'Send isolated toast notifications',
    description: 'Create success and error notifications with the toast facade. This demo owns a unique runtime and clears its timers when it unmounts.',
    success: 'Show success',
    error: 'Show error',
    clear: 'Clear notifications',
    successMessage: 'Changes saved successfully.',
    errorMessage: 'Could not save the changes.',
    idle: 'No notification sent yet.',
    successResult: 'Success notification sent.',
    errorResult: 'Error notification sent.',
    clearResult: 'Notifications cleared.',
  },
  ko: {
    title: '서로 영향을 주지 않는 토스트 알림',
    description: '토스트 API로 성공 및 오류 알림을 만듭니다. 이 데모는 독립된 실행 환경을 사용하며, 화면에서 사라질 때 예약된 작업도 함께 정리합니다.',
    success: '성공 알림',
    error: '오류 알림',
    clear: '알림 모두 지우기',
    successMessage: '변경 사항을 저장했습니다.',
    errorMessage: '변경 사항을 저장하지 못했습니다.',
    idle: '아직 알림을 보내지 않았습니다.',
    successResult: '성공 알림을 보냈습니다.',
    errorResult: '오류 알림을 보냈습니다.',
    clearResult: '알림을 모두 지웠습니다.',
  },
} as const;

const demoToastOptions = { duration: 6000, removeDelay: 200 } as const;

export function ToastDemo({ lang }: DemoProps) {
  const text = copy[lang];
  const reactId = useId().replace(/:/g, '');
  const toasterId = `docs-toast-${reactId}`;
  const [result, setResult] = useState<string>(text.idle);
  const code = lang === 'ko'
    ? `<Toaster toasterId="docs-demo" position="bottom-center" />\n\ntoast.success('변경 사항을 저장했습니다.', {\n  toasterId: 'docs-demo',\n});\ntoast.error('변경 사항을 저장하지 못했습니다.', {\n  toasterId: 'docs-demo',\n});\ntoast.remove(undefined, 'docs-demo');`
    : `<Toaster toasterId="docs-demo" position="bottom-center" />\n\ntoast.success('Changes saved successfully.', {\n  toasterId: 'docs-demo',\n});\ntoast.error('Could not save the changes.', {\n  toasterId: 'docs-demo',\n});\ntoast.remove(undefined, 'docs-demo');`;

  const showSuccess = () => {
    toast.success(text.successMessage, { toasterId });
    setResult(text.successResult);
  };

  const showError = () => {
    toast.error(text.errorMessage, { toasterId });
    setResult(text.errorResult);
  };

  const clearNotifications = () => {
    toast.remove(undefined, toasterId);
    setResult(text.clearResult);
  };

  return (
    <DemoFrame lang={lang} name="toast" title={text.title} description={text.description} code={code}>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          data-demo-action="toast-success"
          className={`${demoButtonClass} w-full sm:w-auto`}
          onClick={showSuccess}
        >
          {text.success}
        </button>
        <button
          type="button"
          data-demo-action="toast-error"
          className={`${demoSecondaryButtonClass} w-full sm:w-auto`}
          onClick={showError}
        >
          {text.error}
        </button>
        <button
          type="button"
          data-demo-action="toast-clear"
          className={`${demoSecondaryButtonClass} w-full sm:w-auto`}
          onClick={clearNotifications}
        >
          {text.clear}
        </button>
      </div>
          <p data-demo-result="toast" aria-live="polite" className="text-sm text-fd-muted-foreground">
            {result}
          </p>
          <Toaster
            toasterId={toasterId}
            position="bottom-center"
            limit={3}
            toastOptions={demoToastOptions}
          >
            {(item) => (
              <div data-demo-toast={item.type}>
                <ToastBar toast={item} position="bottom-center" />
              </div>
            )}
          </Toaster>
        </div>
    </DemoFrame>
  );
}
