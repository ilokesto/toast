import { createContext, useEffect, useMemo } from "react";
import { createToastRuntime } from "../core/createToastRuntime";
import { registerRuntime } from "../core/registry";
import { DEFAULT_TOASTER_ID } from "../core/utils";
import type { ToasterId, ToastRuntimeApi } from "../types/toast";

export const ToasterContext = createContext<ToastRuntimeApi | null>(null);

/**
 * @description Creates and registers a runtime for this toaster and clears it on unmount or identifier change.
 * @param {string} [toasterId] - Identifier of the mounted toaster that owns the notification.
 * @returns {ToastRuntimeApi} Runtime owning this toaster and its lifecycle controls.
 * - toasterId `string` - Identifier of the mounted toaster that owns the notification.
 * - addToast `(type: ToastType, message: ReactNode, options?: ToastOptions | undefined) => string` - Creates or updates a toast and schedules its lifecycle timers.
 * - configureView `(config: { limit: number; position: ToastPosition; toastOptions?: DefaultToastOptions | undefined; }) => void` - Sets the active region, row limit and default options.
 * - promiseToast `<TData>(promise: Promise<TData> | (() => Promise<TData>), messages: PromiseToastMessages<TData>, options?: ToastOptions | undefined) => Promise<TData>` - Updates a loading toast on promise settlement and preserves the result or rejection.
 * - dismiss `(id?: string | undefined) => void` - Marks the selected toast closing while retaining its exit animation.
 * - closeAll `() => void` - Dismisses every toast using the normal exit lifecycle.
 * - remove `(id?: string | undefined) => void` - Immediately removes the selected toast and clears its timers.
 * - clear `() => void` - Immediately clears all items and timing state.
 * - updateHeight `(id: string, height: number) => void` - Records the measured row height in pixels.
 * - getRawSnapshot `() => readonly ToastItem[]` - Reads all runtime items, including items outside the active view.
 * - startPause `() => void` - Pauses automatic dismissal for visible notifications.
 * - endPause `() => void` - Resumes dismissal after accounting for time spent paused.
 * - subscribe `(listener: () => void) => () => void` - Subscribes to changes and returns an unsubscribe function.
 * - getSnapshot `() => readonly ToastItem[]` - Reads the current immutable snapshot.
 * - getInitialSnapshot `() => readonly ToastItem[]` - Reads the initial snapshot used for server rendering.
 * @example
 * ```tsx
 * function Host() {
 *   const runtime = useToasterRuntime("sidebar");
 *   const items = useToastItems(runtime);
 *   return <>{items.map(item => item.message)}</>;
 * }
 * ```
 */
export function useToasterRuntime(toasterId: ToasterId = DEFAULT_TOASTER_ID): ToastRuntimeApi {
  const runtime = useMemo(() => createToastRuntime(toasterId), [toasterId]);

  useEffect(() => {
    const unregister = registerRuntime(runtime);

    return () => {
      runtime.clear();
      unregister();
    };
  }, [runtime]);

  return runtime;
}
