import { type CSSProperties, type ReactNode } from "react";
import type { ToastItem, ToastPosition } from "../types/toast";
import { ToastIcon } from "./icons";

export interface ToastBarProps {
  /** Toast item whose content, appearance and lifecycle are rendered. */
  readonly toast: ToastItem;
  /** Viewport region used to group and align toast rows. */
  readonly position?: ToastPosition;
  /** Inline style overrides applied to the toast row. */
  readonly style?: CSSProperties;
  /** Composes prepared icon and message elements; ignored for custom toast items. */
  readonly children?: (components: {
    /** Prepared status icon element. */
    icon: ReactNode;
    /** Prepared message element. */
    message: ReactNode
  }) => ReactNode;
}

const getMotionStyle = (toast: ToastItem, position: ToastPosition): CSSProperties => {
  const isClosing = toast.status === "closing";
  const isCenter = position.endsWith("center");

  const enterAnimation = `toast-enter 220ms cubic-bezier(0.21, 1.02, 0.73, 1) forwards`;
  const exitAnimation = `toast-exit 180ms cubic-bezier(0.06, 0.71, 0.55, 1) forwards`;

  return {
    animation: isClosing ? exitAnimation : enterAnimation,
    "--toast-enter-y": position.startsWith("top") ? "-14px" : "14px",
    "--toast-exit-y": position.startsWith("top") ? "-10px" : "10px",
    "--toast-enter-x": isCenter ? "0px" : position.endsWith("left") ? "-18px" : "18px",
    "--toast-exit-x": isCenter ? "0px" : position.endsWith("left") ? "-14px" : "14px",
  } as CSSProperties;
};

/**
 * @description Renders an animated toast row with live-region attributes; custom toasts render their message without icon composition.
 * @param {ToastBarProps} props - Properties for the rendered component.
 * @param {ToastItem} props.toast - Toast item whose content, appearance and lifecycle are rendered.
 * @param {string} props.toast.id - Stable toast identifier; reuse it to update an existing toast.
 * @param {ToastType} props.toast.type - Visual notification kind and default timing policy.
 * @param {ReactNode} props.toast.message - React content displayed in the toast row.
 * @param {ToastStatus} props.toast.status - Visible or closing lifecycle phase.
 * @param {number} props.toast.createdAt - Creation or update timestamp in milliseconds since the Unix epoch.
 * @param {string} props.toast.toasterId - Identifier of the mounted toaster that owns the notification.
 * @param {number} props.toast.duration - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition} props.toast.position - Viewport region used to group and align toast rows.
 * @param {number | null} props.toast.height - Measured row height in pixels, or null before measurement.
 * @param {number} props.toast.pauseDuration - Accumulated paused time in milliseconds excluded from the visible lifetime.
 * @param {number | null} props.toast.pausedAt - Pause timestamp in milliseconds, or null while running.
 * @param {ToastAriaProps} props.toast.ariaProps - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} props.toast.ariaProps.role - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} props.toast.ariaProps.aria-live - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [props.toast.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [props.toast.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [props.toast.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [props.toast.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [props.toast.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [props.toast.iconTheme.primary] - Icon background color.
 * @param {string} [props.toast.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [props.toast.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {ToastPosition | undefined} [props.position] - Viewport region used to group and align toast rows.
 * @param {CSSProperties | undefined} [props.style] - Inline style overrides applied to the toast row.
 * @param {((components: { icon: ReactNode; message: ReactNode; }) => ReactNode) | undefined} [props.children] - Composes the prepared icon and message; ignored for custom toast items.
 * @returns {Element} Rendered notification element.
 * @example
 * ```tsx
 * <ToastBar toast={item} />
 * ```
 */
export const ToastBar = ({ toast, position, style, children }: ToastBarProps) => {
  const isCustom = toast.type === "custom";

  const defaultStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    color: "#363636",
    lineHeight: 1.3,
    willChange: "transform, opacity",
    boxShadow: "0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05)",
    width: "fit-content",
    maxWidth: 350,
    pointerEvents: "auto",
    padding: "10px 12px",
    borderRadius: 8,
    transition: "box-shadow 180ms ease, background-color 180ms ease, color 180ms ease",
    ...getMotionStyle(toast, position ?? toast.position ?? "top-center"),
    ...toast.style,
    ...style,
  };

  const icon = <ToastIcon type={toast.type} icon={toast.icon} iconTheme={toast.iconTheme} />;
  const message = (
    <div style={{ display: "flex", alignItems: "center", margin: "2px 4px 2px 8px", color: "inherit", flex: 1 }}>
      {toast.message}
    </div>
  );

  return (
    <div
      className={toast.className}
      style={defaultStyle}
      role={toast.ariaProps.role}
      aria-live={toast.ariaProps["aria-live"]}
      aria-atomic={toast.ariaProps["aria-atomic"]}
    >
      {isCustom ? (
        toast.message
      ) : typeof children === "function" ? (
        children({ icon, message })
      ) : (
        <>
          {icon}
          {message}
        </>
      )}
    </div>
  );
};
