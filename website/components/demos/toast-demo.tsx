'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ToastBar, Toaster, toast } from '@ilokesto/toast';
import styles from '../landings/store-landing.module.css';
import {
  DemoFrame,
  demoButtonClass,
  demoSecondaryButtonClass,
  type DemoProps,
} from './demo-frame';

const copy = {
  en: {
    title: 'Save a demo draft',
    description: 'Demo data only. A real request simulates saving with either outcome. Nothing is stored.',
    success: 'Save',
    error: 'Fail',
    clear: 'Clear',
    loadingMessage: 'Saving demo...',
    successMessage: 'Demo saved',
    errorMessage: 'Demo failed',
    idle: 'Choose a save outcome.',
    loadingResult: 'Waiting for the demo response.',
    successResult: 'Demo save succeeded.',
    errorResult: 'Demo save failed. Try again.',
    clearResult: 'Notifications cleared.',
  },
  ko: {
    title: '데모 초안 저장',
    description: '데모 데이터입니다. 실제 요청으로 저장 성공과 실패를 재현하며, 데이터는 저장하지 않습니다.',
    success: '저장',
    error: '실패',
    clear: '지우기',
    loadingMessage: '데모 저장 중...',
    successMessage: '데모 저장 완료',
    errorMessage: '데모 저장 실패',
    idle: '저장 결과를 선택하세요.',
    loadingResult: '데모 응답을 기다리고 있습니다.',
    successResult: '데모 저장이 성공했습니다.',
    errorResult: '데모 저장 실패. 다시 시도하세요.',
    clearResult: '알림을 모두 지웠습니다.',
  },
} as const;

const demoToastOptions = { duration: 6000, removeDelay: 200 } as const;

async function saveDemo(outcome: 'success' | 'error', signal: AbortSignal) {
  const response = await fetch(`/api/demo/fetcher?outcome=${outcome}`, {
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
  });
  if (!response.ok) {
    throw new Error(`Demo save failed: ${response.status}`);
  }
}

export function ToastDemo({ lang }: DemoProps) {
  const text = copy[lang];
  const reactId = useId().replace(/:/g, '');
  const toasterId = `docs-toast-${reactId}`;
  const request = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'loadingResult' | 'successResult' | 'errorResult' | 'clearResult'
  >('idle');
  const pending = status === 'loadingResult';
  const code = `const id = toast.loading(
  '${text.loadingMessage}', { toasterId });
try {
  await saveDemo(outcome, signal);
  if (signal.aborted) return;
  toast.success('${text.successMessage}', {
    id, toasterId });
} catch {
  if (signal.aborted) return;
  toast.error('${text.errorMessage}', {
    id, toasterId });
}`;

  useEffect(() => () => request.current?.abort(), []);

  const save = async (outcome: 'success' | 'error') => {
    if (request.current !== null) {
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;
    request.current = controller;
    setStatus('loadingResult');
    const id = toast.loading(text.loadingMessage, { toasterId });
    try {
      await saveDemo(outcome, signal);
      if (signal.aborted) {
        return;
      }
      toast.success(text.successMessage, { id, toasterId });
      setStatus('successResult');
    } catch {
      if (signal.aborted) {
        return;
      }
      toast.error(text.errorMessage, { id, toasterId });
      setStatus('errorResult');
    } finally {
      if (request.current === controller) {
        request.current = null;
      }
    }
  };

  const clearNotifications = () => {
    request.current?.abort();
    request.current = null;
    toast.remove(undefined, toasterId);
    setStatus('clearResult');
  };

  return (
    <DemoFrame lang={lang} name="toast" title={text.title} description={text.description} code={code}>
      <div className="space-y-3">
        <div className={styles.demoToolbar}>
          <button
            type="button"
            data-demo-action="toast-success"
            className={demoButtonClass}
            aria-disabled={pending}
            onClick={() => void save('success')}
          >
            {text.success}
          </button>
          <button
            type="button"
            data-demo-action="toast-error"
            className={demoSecondaryButtonClass}
            aria-disabled={pending}
            onClick={() => void save('error')}
          >
            {text.error}
          </button>
          <button
            type="button"
            data-demo-action="toast-clear"
            className={demoSecondaryButtonClass}
            onClick={clearNotifications}
          >
            {text.clear}
          </button>
        </div>
        <p data-demo-result="toast" className={styles.demoStatus}>
          {text[status]}
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
