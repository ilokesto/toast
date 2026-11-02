import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

function supportsPopover(): boolean {
  if (typeof HTMLElement === "undefined") {
    return false;
  }

  return typeof HTMLElement.prototype.showPopover === "function";
}

/**
 * @description Renders notifications in a manual popover when supported, with an inline fallback otherwise.
 * @param {{ readonly style: CSSProperties; readonly className?: string | undefined; readonly children: ReactNode; }} props - Properties for the rendered component.
 * @param {CSSProperties} props.style - Positioning and appearance of the notification container.
 * @param {string | undefined} [props.className] - CSS class applied to the rendered element.
 * @param {ReactNode} props.children - Notification rows rendered inside the container.
 * @returns {Element} Rendered notification element.
 * @example
 * ```tsx
 * <TopLayerContainer style={{ position: "fixed" }}>Notifications</TopLayerContainer>
 * ```
 */
export function TopLayerContainer({
  style,
  className,
  children,
}: {
  /** Positioning and appearance of the notification container. */
  readonly style: CSSProperties;
  /** CSS class applied to the rendered element. */
  readonly className?: string;
  /** Notification rows rendered inside the container. */
  readonly children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (element === null || !supportsPopover()) {
      return;
    }

    try {
      element.showPopover();
    } catch (error) {
      console.error("Failed to show top-layer toast popover", error);
    }

    return () => {
      if (typeof element.hidePopover !== "function") {
        return;
      }

      try {
        element.hidePopover();
      } catch (error) {
        console.error("Failed to hide top-layer toast popover", error);
      }
    };
  }, []);

  if (!supportsPopover()) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        inset: "auto",
        ...style,
        border: "none",
        background: "transparent",
        margin: 0,
        overflow: "visible",
      }}
      {...({ popover: "manual" } as React.HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </div>
  );
}

/**
 * @description Renders an inline container for notification rows.
 * @param {{ readonly style: CSSProperties; readonly className?: string | undefined; readonly children: ReactNode; }} props - Properties for the rendered component.
 * @param {CSSProperties} props.style - Positioning and appearance of the notification container.
 * @param {string | undefined} [props.className] - CSS class applied to the rendered element.
 * @param {ReactNode} props.children - Notification rows rendered inside the container.
 * @returns {Element} Rendered notification element.
 * @example
 * ```tsx
 * <InlineContainer style={{ position: "fixed" }}>Notifications</InlineContainer>
 * ```
 */
export function InlineContainer({
  style,
  className,
  children,
}: {
  /** Positioning and appearance of the notification container. */
  readonly style: CSSProperties;
  /** CSS class applied to the rendered element. */
  readonly className?: string;
  /** Notification rows rendered inside the container. */
  readonly children: ReactNode;
}) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
