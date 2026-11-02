import type { ToastId, ToastItem } from "../types/toast";
import { DEFAULT_REMOVE_DELAY } from "./utils";

type ToastTimer = ReturnType<typeof setTimeout>;

/**
 * @description Owns dismissal and removal timeout handles while callers retain ownership of toast and overlay state.
 * @param {(id: string) => void} dismiss - Marks the selected toast closing while retaining its exit animation.
 * @param {(id: string) => void} remove - Immediately removes the selected toast and clears its timers.
 * @returns {{ scheduleDismiss: (item: ToastItem) => void; scheduleRemove: (item: ToastItem) => void; clearDismiss: (id: string) => void; clearRemove: (id: string) => void; clear: () => void; }} Runtime value and controls described below.
 * - scheduleDismiss `(item: ToastItem) => void` - Schedules dismissal using remaining visible time; skips infinite or paused items.
 * - scheduleRemove `(item: ToastItem) => void` - Schedules physical removal after the configured exit delay.
 * - clearDismiss `(id: string) => void` - Cancels a pending dismissal timer for the identifier.
 * - clearRemove `(id: string) => void` - Cancels a pending removal timer for the identifier.
 * - clear `() => void` - Cancels all pending dismissal and removal handles.
 * @example
 * ```ts
 * const timers = createToastTimers(runtime.dismiss, runtime.remove);
 * timers.scheduleDismiss(item);
 * timers.clear();
 * ```
 */
export function createToastTimers(
  dismiss: (id: ToastId) => void,
  remove: (id: ToastId) => void,
) {
  const dismissTimers = new Map<ToastId, ToastTimer>();
  const removeTimers = new Map<ToastId, ToastTimer>();

  function clearTimer(timers: Map<ToastId, ToastTimer>, id: ToastId): void {
    const timer = timers.get(id);
    if (timer === undefined) return;
    clearTimeout(timer);
    timers.delete(id);
  }

  function scheduleDismiss(item: ToastItem): void {
    clearTimer(dismissTimers, item.id);
    if (!Number.isFinite(item.duration) || item.pausedAt !== null) return;

    const remaining = item.duration + item.pauseDuration - (Date.now() - item.createdAt);
    if (remaining <= 0) {
      dismiss(item.id);
      return;
    }

    const timer = setTimeout(() => {
      dismissTimers.delete(item.id);
      dismiss(item.id);
    }, remaining);
    dismissTimers.set(item.id, timer);
  }

  function scheduleRemove(item: ToastItem): void {
    clearTimer(removeTimers, item.id);
    const timer = setTimeout(() => {
      removeTimers.delete(item.id);
      remove(item.id);
    }, item.removeDelay ?? DEFAULT_REMOVE_DELAY);
    removeTimers.set(item.id, timer);
  }

  function clear(): void {
    for (const timer of dismissTimers.values()) clearTimeout(timer);
    for (const timer of removeTimers.values()) clearTimeout(timer);
    dismissTimers.clear();
    removeTimers.clear();
  }

  return {
    scheduleDismiss,
    scheduleRemove,
    clearDismiss: (id: ToastId) => clearTimer(dismissTimers, id),
    clearRemove: (id: ToastId) => clearTimer(removeTimers, id),
    clear,
  };
}
