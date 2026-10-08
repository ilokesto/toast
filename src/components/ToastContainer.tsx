import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

function supportsPopover(): boolean {
  if (typeof HTMLElement === "undefined") {
    return false;
  }

  return typeof HTMLElement.prototype.showPopover === "function";
}

export function TopLayerContainer({
  style,
  className,
  children,
}: {
  readonly style: CSSProperties;
  readonly className?: string;
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

export function InlineContainer({
  style,
  className,
  children,
}: {
  readonly style: CSSProperties;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
