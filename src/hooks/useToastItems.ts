import { useSyncExternalStore } from "react";
import type { ToastItem, ToastRuntimeApi } from "../types/toast";

/**
 * @description Subscribes to the runtime view using React external-store snapshots, including the server snapshot.
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
 * @returns {readonly ToastItem[]} Immutable visible toast snapshot.
 * @example
 * ```tsx
 * function Rows({ runtime }: { runtime: ToastRuntimeApi }) {
 *   const items = useToastItems(runtime);
 *   return <>{items.map(item => <ToastBar key={item.id} toast={item} />)}</>;
 * }
 * ```
 */
export function useToastItems(runtime: ToastRuntimeApi): ReadonlyArray<ToastItem> {
  return useSyncExternalStore(
    runtime.subscribe,
    runtime.getSnapshot,
    runtime.getInitialSnapshot,
  );
}
