import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { ToastItem } from "../types/toast";

export function ToastMeasure({
  item,
  onHeight,
  children,
}: {
  readonly item: ToastItem;
  readonly onHeight: (id: string, height: number) => void;
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
