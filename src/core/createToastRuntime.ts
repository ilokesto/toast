import type { OverlayStoreApi } from "@ilokesto/overlay";
import { createOverlayStore } from "@ilokesto/overlay";
import type { ReactNode } from "react";
import type {
  DefaultToastOptions,
  PromiseToastMessages,
  ToastId,
  ToastItem,
  ToastOptions,
  ToastPosition,
  ToastRuntimeApi,
  ToastType,
  ToasterId,
} from "../types/toast";
import { createToastStore } from "./createToastStore";
import { createToastTimers } from "./createToastTimers";
import { resolveToastOptions } from "./resolveToastOptions";
import {
  DEFAULT_ARIA_PROPS,
  DEFAULT_DURATION,
  DEFAULT_POSITION,
  DEFAULT_REMOVE_DELAY,
  generateToastId,
  resolveValue,
} from "./utils";

/**
 * @description Creates an isolated toast runtime coordinating state, overlay presence, timers and rows across viewport positions.
 * @param {string} toasterId - Identifier of the mounted toaster that owns the notification.
 * @returns {ToastRuntimeApi} Runtime owning this toaster and its lifecycle controls.
 * - toasterId `string` - Identifier of the mounted toaster that owns the notification.
 * - addToast `(type: ToastType, message: ReactNode, options?: ToastOptions | undefined) => string` - Creates or updates a toast and schedules its lifecycle timers.
 * - configureView `(config: { limit: number; position: ToastPosition; toastOptions?: DefaultToastOptions | undefined; }) => void` - Sets the default position, runtime-wide row limit and default options.
 * - promiseToast `<TData>(promise: Promise<TData> | (() => Promise<TData>), messages: PromiseToastMessages<TData>, options?: ToastOptions | undefined) => Promise<TData>` - Updates a loading toast on promise settlement and preserves the result or rejection.
 * - dismiss `(id?: string | undefined) => void` - Marks the selected toast closing while retaining its exit animation.
 * - closeAll `() => void` - Dismisses every toast using the normal exit lifecycle.
 * - remove `(id?: string | undefined) => void` - Immediately removes the selected toast and clears its timers.
 * - clear `() => void` - Immediately clears all items and timing state.
 * - updateHeight `(id: string, height: number) => void` - Records the measured row height in pixels.
 * - getRawSnapshot `() => readonly ToastItem[]` - Reads all runtime items, including items beyond the row limit.
 * - startPause `() => void` - Pauses automatic dismissal for visible notifications.
 * - endPause `() => void` - Resumes dismissal after accounting for time spent paused.
 * - subscribe `(listener: () => void) => () => void` - Subscribes to changes and returns an unsubscribe function.
 * - getSnapshot `() => readonly ToastItem[]` - Reads the current immutable snapshot.
 * - getInitialSnapshot `() => readonly ToastItem[]` - Reads the initial snapshot used for server rendering.
 * @example
 * ```ts
 * const runtime = createToastRuntime("sidebar");
 * runtime.addToast("success", "Saved");
 * runtime.clear();
 * ```
 */
export function createToastRuntime(toasterId: ToasterId): ToastRuntimeApi {
  const store = createToastStore();
  const overlayStore: OverlayStoreApi = createOverlayStore();
  const timers = createToastTimers(dismiss, remove);
  const lifetimes = new Map<ToastId, { remaining: number; startedAt: number | null }>();
  const pendingPromises = new Map<ToastId, symbol>();
  const listeners = new Set<() => void>();
  let isPaused = false;
  const view: { limit: number; position: ToastPosition; toastOptions?: DefaultToastOptions } = {
    limit: Number.POSITIVE_INFINITY,
    position: DEFAULT_POSITION as ToastPosition,
  };
  const visibleSnapshotCache: {
    items: ReadonlyArray<ToastItem> | null;
    limit: number;
    visibleItems: ReadonlyArray<ToastItem>;
  } = {
    items: null,
    limit: Number.POSITIVE_INFINITY,
    visibleItems: [],
  };

  store.subscribe(() => {
    for (const listener of listeners) {
      listener();
    }
  });

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function getVisibleItems(items: ReadonlyArray<ToastItem>): ReadonlyArray<ToastItem> {
    if (
      visibleSnapshotCache.items === items
      && visibleSnapshotCache.limit === view.limit
    ) {
      return visibleSnapshotCache.visibleItems;
    }

    const visibleItems = items.slice(0, view.limit);

    visibleSnapshotCache.items = items;
    visibleSnapshotCache.limit = view.limit;
    visibleSnapshotCache.visibleItems = visibleItems;

    return visibleItems;
  }

  function getItem(id: ToastId): ToastItem | undefined {
    return store.getSnapshot().find((item) => item.id === id);
  }

  function syncDismissTimers(): void {
    const items = store.getSnapshot();
    const displayedIds = new Set(getVisibleItems(items).map((item) => item.id));
    const now = Date.now();

    for (const item of items) {
      const lifetime = lifetimes.get(item.id);
      if (lifetime === undefined) {
        continue;
      }

      const shouldRun = displayedIds.has(item.id)
        && item.status === "visible"
        && !isPaused
        && item.pausedAt === null;

      if (!shouldRun && lifetime.startedAt !== null) {
        lifetime.remaining -= now - lifetime.startedAt;
        lifetime.startedAt = null;
        timers.clearDismiss(item.id);
      } else if (shouldRun && lifetime.startedAt === null) {
        lifetime.startedAt = now;
        timers.scheduleDismiss({
          ...item,
          createdAt: now,
          duration: lifetime.remaining,
          pauseDuration: 0,
        });
      }
    }
  }

  function ensurePresence(id: ToastId): void {
    overlayStore.open({
      id,
      type: "toast",
      props: {},
    });
  }

  function addToast(type: ToastType, message: ReactNode, options?: ToastOptions): ToastId {
    const id = options?.id ?? generateToastId();
    pendingPromises.delete(id);
    return writeToast(id, type, message, options);
  }

  function writeToast(id: ToastId, type: ToastType, message: ReactNode, options?: ToastOptions): ToastId {
    const current = getItem(id);
    const now = Date.now();
    const pausedAt = isPaused ? now : null;

    const mergedOptions = resolveToastOptions(type, view.toastOptions, options);

    const item: ToastItem = {
      id,
      type,
      message,
      status: "visible",
      createdAt: now,
      toasterId,
      duration: mergedOptions.duration ?? DEFAULT_DURATION[type],
      position: mergedOptions.position ?? current?.position ?? view.position,
      height: current?.height ?? null,
      pauseDuration: 0,
      pausedAt,
      ariaProps: mergedOptions.ariaProps ?? current?.ariaProps ?? DEFAULT_ARIA_PROPS[type],
      style: mergedOptions.style,
      className: mergedOptions.className,
      icon: mergedOptions.icon,
      iconTheme: mergedOptions.iconTheme,
      removeDelay: mergedOptions.removeDelay ?? DEFAULT_REMOVE_DELAY,
    };

    ensurePresence(id);
    timers.clearDismiss(id);
    timers.clearRemove(id);
    lifetimes.set(id, { remaining: item.duration, startedAt: null });
    store.add(item);
    syncDismissTimers();

    return id;
  }

  function configureView(config: { limit: number; position: ToastPosition; toastOptions?: DefaultToastOptions }): void {
    const nextLimit = Math.max(0, config.limit);
    const hasChanged = nextLimit !== view.limit || config.position !== view.position || config.toastOptions !== view.toastOptions;

    if (!hasChanged) {
      return;
    }

    view.limit = nextLimit;
    view.position = config.position;
    view.toastOptions = config.toastOptions;
    syncDismissTimers();
    notify();
  }

  async function promiseToast<TData>(
    promise: Promise<TData> | (() => Promise<TData>),
    messages: PromiseToastMessages<TData>,
    options?: ToastOptions,
  ): Promise<TData> {
    const id = options?.id ?? generateToastId();
    const request = Symbol();
    const isCurrent = () => pendingPromises.get(id) === request;
    pendingPromises.set(id, request);
    let task: Promise<TData>;
    try {
      task = typeof promise === "function" ? promise() : promise;
    } catch (error) {
      if (isCurrent()) {
        pendingPromises.delete(id);
      }
      throw error;
    }
    if (isCurrent()) {
      writeToast(id, "loading", messages.loading, {
        ...options,
        duration: Number.POSITIVE_INFINITY,
      });
    }

    try {
      const data = await task;
      if (isCurrent()) {
        const successMessage = resolveValue(messages.success, data);
        if (isCurrent()) {
          addToast("success", successMessage, { ...options, id });
        }
      }

      return data;
    } catch (error) {
      if (isCurrent()) {
        const errorMessage = resolveValue(messages.error, error);
        if (isCurrent()) {
          addToast("error", errorMessage, { ...options, id });
        }
      }

      throw error;
    } finally {
      if (isCurrent()) {
        pendingPromises.delete(id);
      }
    }
  }

  function dismiss(id?: ToastId): void {
    const targets = id === undefined ? store.getSnapshot().map((item) => item.id) : [id];

    for (const targetId of targets) {
      const current = getItem(targetId);

      if (current === undefined || current.status === "closing") {
        continue;
      }

      timers.clearDismiss(targetId);
      overlayStore.close(targetId);
      store.dismiss(targetId);
      timers.scheduleRemove(current);
    }
    syncDismissTimers();
  }

  function closeAll(): void {
    dismiss();
  }

  function remove(id?: ToastId): void {
    const targets = id === undefined ? store.getSnapshot().map((item) => item.id) : [id];

    for (const targetId of targets) {
      timers.clearDismiss(targetId);
      timers.clearRemove(targetId);
      lifetimes.delete(targetId);
      pendingPromises.delete(targetId);
      overlayStore.remove(targetId);
      store.remove(targetId);
    }
    syncDismissTimers();
  }

  function clear(): void {
    timers.clear();
    lifetimes.clear();
    pendingPromises.clear();
    overlayStore.clear();
    store.clear();
  }

  function updateHeight(id: ToastId, height: number): void {
    store.updateHeight(id, height);
  }

  function getRawSnapshot(): ReadonlyArray<ToastItem> {
    return store.getSnapshot();
  }

  function startPause(): void {
    isPaused = true;
    store.startPause();

    syncDismissTimers();
  }

  function endPause(): void {
    isPaused = false;
    store.endPause();

    syncDismissTimers();
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  function getSnapshot(): ReadonlyArray<ToastItem> {
    return getVisibleItems(store.getSnapshot());
  }

  function getInitialSnapshot(): ReadonlyArray<ToastItem> {
    return getVisibleItems(store.getInitialSnapshot());
  }

  return {
    toasterId,
    addToast,
    configureView,
    promiseToast,
    dismiss,
    closeAll,
    remove,
    clear,
    updateHeight,
    getRawSnapshot,
    startPause,
    endPause,
    subscribe,
    getSnapshot,
    getInitialSnapshot,
  };
}
