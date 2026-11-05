import { useCallback, useContext, useMemo } from "react";
import { ToasterContext } from "../components/ToastProvider";
import type {
  ToastItem,
  ToastOffsetOptions,
  UseToasterResult,
} from "../types/toast";
import { DEFAULT_GUTTER } from "../core/utils";
import { useToastItems } from "./useToastItems";

/**
 * @description Reads visible toasts and layout controls from the surrounding Toaster; throws outside its context.
 * @returns {UseToasterResult} Current visible items and custom renderer controls.
 * - toasts `readonly ToastItem[]` - Current visible items from the surrounding toaster runtime.
 * - handlers `{ updateHeight: (id: string, height: number) => void; startPause: () => void; endPause: () => void; calculateOffset: (toast: ToastItem, options?: ToastOffsetOptions | undefined) => number; }` - Measurement, pause and layout controls for custom renderers.
 * : handlers.updateHeight `(id: string, height: number) => void` - Records the measured row height in pixels.
 * : handlers.startPause `() => void` - Pauses automatic dismissal for visible notifications.
 * : handlers.endPause `() => void` - Resumes dismissal after accounting for time spent paused.
 * : handlers.calculateOffset `(toast: ToastItem, options?: ToastOffsetOptions | undefined) => number` - Returns the summed heights and gutters of preceding rows at the same position in pixels.
 * @example
 * ```tsx
 * function Summary() {
 *   const { toasts, handlers } = useToaster();
 *   return <div onMouseEnter={handlers.startPause}>{toasts.length}</div>;
 * }
 * ```
 */
export function useToaster(): UseToasterResult {
  const runtime = useContext(ToasterContext);

  if (runtime === null) {
    throw new Error(
      "useToaster must be used within a <Toaster> component.",
    );
  }

  const toasts = useToastItems(runtime);

  const calculateOffset = useCallback(
    (toast: ToastItem, options?: ToastOffsetOptions): number => {
      const gutter = options?.gutter ?? DEFAULT_GUTTER;
      const positioned = toasts.filter((item) => item.position === toast.position);
      const ordered = options?.reverseOrder ? positioned.reverse() : positioned;
      const index = ordered.findIndex((item) => item.id === toast.id);

      if (index === -1) {
        return 0;
      }

      return ordered.slice(0, index).reduce((offset, item) => {
        return offset + (item.height ?? 0) + gutter;
      }, 0);
    },
    [toasts],
  );

  return useMemo(
    () => ({
      toasts,
      handlers: {
        updateHeight: runtime.updateHeight,
        startPause: runtime.startPause,
        endPause: runtime.endPause,
        calculateOffset,
      },
    }),
    [calculateOffset, runtime.endPause, runtime.startPause, runtime.updateHeight, toasts],
  );
}
