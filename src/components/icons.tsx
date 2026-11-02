import { type CSSProperties, useMemo, type ReactNode } from "react";
import type { ToastType, IconTheme } from "../types/toast";

/**
 * @description Renders the animated built-in loading indicator.
 * @returns {Element} Rendered notification element.
 * @example
 * ```tsx
 * <DefaultSpinner />
 * ```
 */
export const DefaultSpinner = () => {
  const style = useMemo<CSSProperties>(
    () => ({
      width: 20,
      height: 20,
      boxSizing: "border-box",
      border: "2px solid",
      borderRadius: "100%",
      borderColor: "#e0e0e0",
      borderRightColor: "#616161",
      animation: "toast-spin 1s linear infinite",
    }),
    [],
  );

  return <div style={style} className="toast-motion-spin" />;
};

/**
 * @description Renders the animated built-in success check using the supplied theme colors.
 * @param {{ theme?: IconTheme | undefined; }} props - Properties for the rendered component.
 * @param {IconTheme | undefined} [props.theme] - Colors used for the built-in status icon.
 * @param {string} [props.theme.primary] - Icon background color.
 * @param {string} [props.theme.secondary] - Icon foreground color.
 * @returns {Element} Rendered notification element.
 * @example
 * ```tsx
 * <DefaultSuccess theme={{ primary: "green", secondary: "white" }} />
 * ```
 */
export const DefaultSuccess = ({ theme }: {
  /** Colors used for the built-in status icon. */
  theme?: IconTheme
}) => {
  const primary = theme?.primary || "#61d345";
  const secondary = theme?.secondary || "#fff";

  return (
    <div
      className="toast-motion-circle"
      style={{
        width: 20,
        height: 20,
        background: primary,
        borderRadius: "100%",
        position: "relative",
        animation: "toast-icon-circle 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards",
      }}
    >
      <div
        className="toast-motion-check"
        style={{
          boxSizing: "border-box",
          position: "absolute",
          top: "45%",
          left: "50%",
          width: 0,
          height: 0,
          border: `2px solid ${secondary}`,
          borderTop: 0,
          borderLeft: 0,
          transform: "translate(-50%, -50%) rotate(45deg)",
          transformOrigin: "center",
          animation: "toast-icon-check 0.28s 0.14s cubic-bezier(0.21, 1.02, 0.73, 1) forwards",
          opacity: 0,
        }}
      />
    </div>
  );
};

/**
 * @description Renders the animated built-in error cross using the supplied theme colors.
 * @param {{ theme?: IconTheme | undefined; }} props - Properties for the rendered component.
 * @param {IconTheme | undefined} [props.theme] - Colors used for the built-in status icon.
 * @param {string} [props.theme.primary] - Icon background color.
 * @param {string} [props.theme.secondary] - Icon foreground color.
 * @returns {Element} Rendered notification element.
 * @example
 * ```tsx
 * <DefaultError theme={{ primary: "red", secondary: "white" }} />
 * ```
 */
export const DefaultError = ({ theme }: {
  /** Colors used for the built-in status icon. */
  theme?: IconTheme
}) => {
  const primary = theme?.primary || "#ff4b4b";
  const secondary = theme?.secondary || "#fff";

  return (
    <div
      className="toast-motion-circle"
      style={{
        width: 20,
        height: 20,
        background: primary,
        borderRadius: "100%",
        position: "relative",
        animation: "toast-icon-circle 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards",
      }}
    >
      <div
        className="toast-motion-cross-first"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 10,
          height: 2,
          background: secondary,
          transform: "translate(-50%, -50%) rotate(45deg)",
          animation: "toast-icon-cross-first 0.24s 0.14s cubic-bezier(0.21, 1.02, 0.73, 1) forwards",
          opacity: 0,
        }}
      />
      <div
        className="toast-motion-cross-second"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 10,
          height: 2,
          background: secondary,
          transform: "translate(-50%, -50%) rotate(-45deg)",
          animation: "toast-icon-cross-second 0.24s 0.2s cubic-bezier(0.21, 1.02, 0.73, 1) forwards",
          opacity: 0,
        }}
      />
    </div>
  );
};

/**
 * @description Renders an explicit icon when provided, otherwise selects the built-in icon or null for plain and custom toasts.
 * @param {{ type: ToastType; icon?: ReactNode; iconTheme?: IconTheme | undefined; }} props - Properties for the rendered component.
 * @param {ToastType} props.type - Visual notification kind and default timing policy.
 * @param {ReactNode} [props.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [props.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [props.iconTheme.primary] - Icon background color.
 * @param {string} [props.iconTheme.secondary] - Icon foreground color.
 * @returns {Element | null} Rendered notification element.
 * @example
 * ```tsx
 * <ToastIcon type="success" />
 * ```
 */
export const ToastIcon = ({
  type,
  icon,
  iconTheme,
}: {
  /** Visual notification kind and default timing policy. */
  type: ToastType;
  /** Custom React icon content; overrides the built-in status icon. */
  icon?: ReactNode;
  /** Colors for the built-in success or error icon. */
  iconTheme?: IconTheme;
}) => {
  if (icon !== undefined) {
    return <>{icon}</>;
  }

  switch (type) {
    case "blank":
    case "custom":
      return null;
    case "loading":
      return <DefaultSpinner />;
    case "success":
      return <DefaultSuccess theme={iconTheme} />;
    case "error":
      return <DefaultError theme={iconTheme} />;
  }
};
