import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { ToastItem } from "../types/toast";

/**
 * @description Reports initial and resized row heights to the runtime and disconnects its observer on cleanup.
 * @param {{ readonly item: ToastItem; readonly onHeight: (id: string, height: number) => void; readonly children: ReactNode; }} props - Properties for the rendered component.
 * @param {ToastItem} props.item - Toast item whose row height is measured.
 * @param {string} props.item.id - Stable toast identifier; reuse it to update an existing toast.
 * @param {ToastType} props.item.type - Visual notification kind and default timing policy.
 * @param {ReactNode} props.item.message - React content displayed in the toast row.
 * @param {ToastStatus} props.item.status - Visible or closing lifecycle phase.
 * @param {number} props.item.createdAt - Creation or update timestamp in milliseconds since the Unix epoch.
 * @param {string} props.item.toasterId - Identifier of the mounted toaster that owns the notification.
 * @param {number} props.item.duration - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition} props.item.position - Viewport region used to group and align toast rows.
 * @param {number | null} props.item.height - Measured row height in pixels, or null before measurement.
 * @param {number} props.item.pauseDuration - Accumulated paused time in milliseconds excluded from the visible lifetime.
 * @param {number | null} props.item.pausedAt - Pause timestamp in milliseconds, or null while running.
 * @param {ToastAriaProps} props.item.ariaProps - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} props.item.ariaProps.role - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} props.item.ariaProps.aria-live - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [props.item.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [props.item.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [props.item.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [props.item.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [props.item.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [props.item.iconTheme.primary] - Icon background color.
 * @param {string} [props.item.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [props.item.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {(id: string, height: number) => void} props.onHeight - Receives the toast identifier and measured height in pixels.
 * @param {ReactNode} props.children - Row content enclosed by the measurement element.
 * @returns {Element} Rendered notification element.
 * @example
 * ```tsx
 * <ToastMeasure item={item} onHeight={runtime.updateHeight}>{item.message}</ToastMeasure>
 * ```
 */
export function ToastMeasure({
  item,
  onHeight,
  children,
}: {
  /** Toast item whose row height is measured. */
  readonly item: ToastItem;
  /** Receives the toast identifier and measured height in pixels. */
  readonly onHeight: (id: string, height: number) => void;
  /** Row content enclosed by the measurement element. */
  readonly children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;

    if (element === null) {
      return;
    }

    const updateHeight = () => {
      onHeight(item.id, element.offsetHeight);
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [item.id, item.message, item.status, onHeight]);

  return (
    <div ref={ref} style={{ width: "fit-content", maxWidth: "100%", pointerEvents: "auto" }}>
      {children}
    </div>
  );
}
