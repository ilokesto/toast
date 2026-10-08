import type { ToasterId, ToastRuntimeApi } from "../types/toast";

const runtimeMap = new Map<ToasterId, ToastRuntimeApi>();

export function registerRuntime(runtime: ToastRuntimeApi): () => void {
  runtimeMap.set(runtime.toasterId, runtime);

  return () => {
    if (runtimeMap.get(runtime.toasterId) === runtime) {
      runtimeMap.delete(runtime.toasterId);
    }
  };
}

export function getRuntime(toasterId: ToasterId): ToastRuntimeApi | undefined {
  return runtimeMap.get(toasterId);
}

export function requireRuntime(toasterId: ToasterId): ToastRuntimeApi {
  const runtime = runtimeMap.get(toasterId);
  if (runtime === undefined) {
    throw new Error(
      `No toaster runtime registered for toasterId "${toasterId}". ` +
        "Make sure a <Toaster> with this toasterId is mounted.",
    );
  }
  return runtime;
}
