import type { ToasterId, ToastRuntimeApi } from "../types/toast";

const runtimeMap = new Map<ToasterId, ToastRuntimeApi>();

/**
 * @description Registers a runtime by toaster identifier; cleanup removes only that same registration.
 * @param {ToastRuntimeApi} runtime - Toast runtime owning subscriptions, view state and lifecycle commands.
 * @param {string} runtime.toasterId - Identifier of the mounted toaster that owns the notification.
 * @param {(type: ToastType, message: ReactNode, options?: ToastOptions | undefined) => string} runtime.addToast - Creates or updates a toast and schedules its lifecycle timers.
 * @param {(config: { limit: number; position: ToastPosition; toastOptions?: DefaultToastOptions | undefined; }) => void} runtime.configureView - Sets the active region, row limit and default options.
 * @param {<TData>(promise: Promise<TData> | (() => Promise<TData>), messages: PromiseToastMessages<TData>, options?: ToastOptions | undefined) => Promise<TData>} runtime.promiseToast - Updates a loading toast on promise settlement and preserves the result or rejection.
 * @param {(id?: string | undefined) => void} runtime.dismiss - Marks the selected toast closing while retaining its exit animation.
 * @param {() => void} runtime.closeAll - Dismisses every toast using the normal exit lifecycle.
 * @param {(id?: string | undefined) => void} runtime.remove - Immediately removes the selected toast and clears its timers.
 * @param {() => void} runtime.clear - Immediately clears all items and timing state.
 * @param {(id: string, height: number) => void} runtime.updateHeight - Records the measured row height in pixels.
 * @param {() => readonly ToastItem[]} runtime.getRawSnapshot - Reads all runtime items, including items outside the active view.
 * @param {() => void} runtime.startPause - Pauses automatic dismissal for visible notifications.
 * @param {() => void} runtime.endPause - Resumes dismissal after accounting for time spent paused.
 * @param {(listener: () => void) => () => void} runtime.subscribe - Subscribes to changes and returns an unsubscribe function.
 * @param {() => readonly ToastItem[]} runtime.getSnapshot - Reads the current immutable snapshot.
 * @param {() => readonly ToastItem[]} runtime.getInitialSnapshot - Reads the initial snapshot used for server rendering.
 * @returns {() => void} Cleanup function for this registration.
 * @example
 * ```ts
 * const unregister = registerRuntime(createToastRuntime("sidebar"));
 * unregister();
 * ```
 */
export function registerRuntime(runtime: ToastRuntimeApi): () => void {
  runtimeMap.set(runtime.toasterId, runtime);

  return () => {
    if (runtimeMap.get(runtime.toasterId) === runtime) {
      runtimeMap.delete(runtime.toasterId);
    }
  };
}

/**
 * @description Looks up a registered runtime without throwing when the toaster is absent.
 * @param {string} toasterId - Identifier of the mounted toaster that owns the notification.
 * @returns {ToastRuntimeApi | undefined} Registered runtime, or undefined if this toaster is not mounted.
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
 * ```ts
 * const runtime = getRuntime("sidebar");
 * runtime?.dismiss();
 * ```
 */
export function getRuntime(toasterId: ToasterId): ToastRuntimeApi | undefined {
  return runtimeMap.get(toasterId);
}

/**
 * @description Looks up a mounted toaster runtime and throws when it is not registered.
 * @param {string} toasterId - Identifier of the mounted toaster that owns the notification.
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
 * ```ts
 * requireRuntime("default").dismiss();
 * ```
 */
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
