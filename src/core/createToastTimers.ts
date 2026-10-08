import type { ToastId, ToastItem } from "../types/toast";
import { DEFAULT_REMOVE_DELAY } from "./utils";

type ToastTimer = ReturnType<typeof setTimeout>;

/** Owns timeout handles; runtime commands retain ownership of toast/overlay state. */
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
