import { createStore } from "@ilokesto/store";
import type { ToastId, ToastItem, ToastState, ToastStoreApi } from "../types/toast";

/**
 * @description Creates isolated immutable toast state with insertion, update, pause and subscription controls.
 * @returns {ToastStoreApi} Isolated toast state and mutation controls.
 * - add `(item: ToastItem) => void` - Inserts a toast or replaces the matching identifier without changing its owner.
 * - update `(id: string, patch: Partial<Omit<ToastItem, "id" | "toasterId" | "createdAt">>) => void` - Merges mutable fields into the toast with the selected identifier.
 * - dismiss `(id?: string | undefined) => void` - Marks the selected toast closing while retaining its exit animation.
 * - remove `(id?: string | undefined) => void` - Immediately removes one item, or all items when no identifier is provided.
 * - clear `() => void` - Clears all items and resets the stored pause timestamp.
 * - updateHeight `(id: string, height: number) => void` - Records the measured row height in pixels.
 * - startPause `() => void` - Pauses automatic dismissal for visible notifications.
 * - endPause `() => void` - Resumes dismissal after accounting for time spent paused.
 * - subscribe `(listener: () => void) => () => void` - Subscribes to changes and returns an unsubscribe function.
 * - getSnapshot `() => readonly ToastItem[]` - Reads the current immutable snapshot.
 * - getInitialSnapshot `() => readonly ToastItem[]` - Reads the initial snapshot used for server rendering.
 * @example
 * ```ts
 * const store = createToastStore();
 * const unsubscribe = store.subscribe(() => render(store.getSnapshot()));
 * unsubscribe();
 * ```
 */
export function createToastStore(): ToastStoreApi {
  const store = createStore<ToastState>({ items: [], pausedAt: null });

  function add(item: ToastItem): void {
    store.update((prev) => {
      const existingIndex = prev.items.findIndex((current) => current.id === item.id);

      if (existingIndex === -1) {
        return {
          ...prev,
          items: [...prev.items, item],
        };
      }

      return {
        ...prev,
        items: prev.items.map((current) =>
          current.id === item.id
            ? {
                ...current,
                ...item,
                toasterId: current.toasterId,
              }
            : current,
        ),
      };
    });
  }

  function update(
    id: ToastId,
    patch: Partial<Omit<ToastItem, "id" | "toasterId" | "createdAt">>,
  ): void {
    store.setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    }));
  }

  function dismiss(id?: ToastId): void {
    store.setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (id !== undefined && item.id !== id) {
          return item;
        }

        if (item.status === "closing") {
          return item;
        }

        return {
          ...item,
          status: "closing",
        };
      }),
    }));
  }

  function remove(id?: ToastId): void {
    store.setState((prev) => ({
      ...prev,
      items: id === undefined
        ? []
        : prev.items.filter((item) => item.id !== id),
    }));
  }

  function clear(): void {
    store.setState({ items: [], pausedAt: null });
  }

  function updateHeight(id: ToastId, height: number): void {
    update(id, { height });
  }

  function startPause(): void {
    const startedAt = Date.now();

    store.setState((prev) => {
      if (prev.pausedAt !== null) {
        return prev;
      }

      return {
        ...prev,
        pausedAt: startedAt,
        items: prev.items.map((item) => ({
          ...item,
          pausedAt: item.status === "visible" ? startedAt : item.pausedAt,
        })),
      };
    });
  }

  function endPause(): void {
    const endedAt = Date.now();

    store.setState((prev) => {
      if (prev.pausedAt === null) {
        return prev;
      }

      return {
        pausedAt: null,
        items: prev.items.map((item) => {
          if (item.pausedAt === null) {
            return item;
          }

          return {
            ...item,
            pauseDuration: item.pauseDuration + (endedAt - item.pausedAt),
            pausedAt: null,
          };
        }),
      };
    });
  }

  function subscribe(listener: () => void): () => void {
    return store.subscribe(listener);
  }

  function getSnapshot(): ReadonlyArray<ToastItem> {
    return store.getState().items;
  }

  function getInitialSnapshot(): ReadonlyArray<ToastItem> {
    return store.getInitialState().items;
  }

  return {
    add,
    update,
    dismiss,
    remove,
    clear,
    updateHeight,
    startPause,
    endPause,
    subscribe,
    getSnapshot,
    getInitialSnapshot,
  };
}
