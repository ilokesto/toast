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

export function createToastRuntime(toasterId: ToasterId): ToastRuntimeApi {
  const store = createToastStore();
  const overlayStore: OverlayStoreApi = createOverlayStore();
  const timers = createToastTimers(dismiss, remove);
  const listeners = new Set<() => void>();
  let isPaused = false;
  const view: { limit: number; position: ToastPosition; toastOptions?: DefaultToastOptions } = {
    limit: Number.POSITIVE_INFINITY,
    position: DEFAULT_POSITION as ToastPosition,
  };
  const visibleSnapshotCache: {
    items: ReadonlyArray<ToastItem> | null;
    limit: number;
    position: ToastPosition;
    visibleItems: ReadonlyArray<ToastItem>;
  } = {
    items: null,
    limit: Number.POSITIVE_INFINITY,
    position: DEFAULT_POSITION as ToastPosition,
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
      && visibleSnapshotCache.position === view.position
      && visibleSnapshotCache.limit === view.limit
    ) {
      return visibleSnapshotCache.visibleItems;
    }

    const visibleItems = items
      .filter((item) => item.position === view.position)
      .slice(0, view.limit);

    visibleSnapshotCache.items = items;
    visibleSnapshotCache.position = view.position;
    visibleSnapshotCache.limit = view.limit;
    visibleSnapshotCache.visibleItems = visibleItems;

    return visibleItems;
  }

  function getItem(id: ToastId): ToastItem | undefined {
    return store.getSnapshot().find((item) => item.id === id);
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
    const current = getItem(id);
    const now = Date.now();
    const isUpdate = current !== undefined;
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
    store.add(item);
    timers.clearRemove(id);

    if (isUpdate) {
      timers.clearDismiss(id);
    }

    timers.scheduleDismiss(item);

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
    notify();
  }

  async function promiseToast<TData>(
    promise: Promise<TData> | (() => Promise<TData>),
    messages: PromiseToastMessages<TData>,
    options?: ToastOptions,
  ): Promise<TData> {
    const task = typeof promise === "function" ? promise() : promise;
    const id = addToast("loading", messages.loading, {
      ...options,
      duration: Number.POSITIVE_INFINITY,
    });

    try {
      const data = await task;
      const successMessage = resolveValue(messages.success, data);

      addToast("success", successMessage, {
        ...options,
        id,
      });

      return data;
    } catch (error) {
      const errorMessage = resolveValue(messages.error, error);

      addToast("error", errorMessage, {
        ...options,
        id,
      });

      throw error;
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
  }

  function closeAll(): void {
    dismiss();
  }

  function remove(id?: ToastId): void {
    const targets = id === undefined ? store.getSnapshot().map((item) => item.id) : [id];

    for (const targetId of targets) {
      timers.clearDismiss(targetId);
      timers.clearRemove(targetId);
      overlayStore.remove(targetId);
      store.remove(targetId);
    }
  }

  function clear(): void {
    timers.clear();
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

    for (const item of store.getSnapshot()) {
      timers.clearDismiss(item.id);
    }
  }

  function endPause(): void {
    isPaused = false;
    store.endPause();

    for (const item of store.getSnapshot()) {
      if (item.status === "visible") {
        timers.scheduleDismiss(item);
      }
    }
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
