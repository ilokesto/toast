import {
  useCallback,
  useEffect,
  useMemo,
  type CSSProperties,
} from "react";
import { DEFAULT_GUTTER, DEFAULT_LIMIT, DEFAULT_POSITION } from "../core/utils";
import { useToastItems } from "../hooks/useToastItems";
import { ToastBar } from "./ToastBar";
import { InlineContainer, TopLayerContainer } from "./ToastContainer";
import { ToastMeasure } from "./ToastMeasure";
import { ToasterContext, useToasterRuntime } from "./ToastProvider";
import { toasterStyles } from "./toasterStyles";
import type {
  ToastItem,
  ToastPosition,
  ToastRowHelpers,
  ToasterProps,
} from "../types/toast";

function getContainerStyle(position: ToastPosition): CSSProperties {
  const style: CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    pointerEvents: "none",
    padding: 16,
  };

  if (position.startsWith("top")) {
    style.top = 0;
  } else {
    style.bottom = 0;
  }

  if (position.endsWith("left")) {
    style.left = 0;
    style.alignItems = "flex-start";
  } else if (position.endsWith("right")) {
    style.right = 0;
    style.alignItems = "flex-end";
  } else {
    style.left = "50%";
    style.transform = "translateX(-50%)";
    style.alignItems = "center";
  }

  return style;
}

function getRegionStyle(position: ToastPosition, gutter: number): CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: position.endsWith("left")
      ? "flex-start"
      : position.endsWith("right")
        ? "flex-end"
        : "center",
    gap: gutter,
  };
}

export function Toaster({
  toasterId,
  position = DEFAULT_POSITION,
  transport = "inline",
  limit = DEFAULT_LIMIT,
  reverseOrder = false,
  gutter = DEFAULT_GUTTER,
  containerStyle,
  containerClassName,
  toastOptions,
  children: renderRow,
}: ToasterProps) {
  const runtime = useToasterRuntime(toasterId);
  const items = useToastItems(runtime);
  const activePosition = toastOptions?.position ?? position;

  useEffect(() => {
    runtime.configureView({
      limit,
      position: activePosition,
      toastOptions,
    });
  }, [activePosition, limit, runtime, toastOptions]);

  const orderedItems = useMemo(() => {
    return reverseOrder ? [...items].reverse() : items;
  }, [items, reverseOrder]);

  const containerStyleValue = useMemo<CSSProperties>(
    () => ({
      ...getContainerStyle(activePosition),
      ...containerStyle,
    }),
    [activePosition, containerStyle],
  );

  const regionStyle = useMemo<CSSProperties>(
    () => getRegionStyle(activePosition, gutter),
    [activePosition, gutter],
  );

  const createHelpers = useCallback(
    (item: ToastItem): ToastRowHelpers => ({
      dismiss: () => runtime.dismiss(item.id),
      remove: () => runtime.remove(item.id),
    }),
    [runtime],
  );

  const handleMouseEnter = useCallback(() => {
    runtime.startPause();
  }, [runtime]);

  const handleMouseLeave = useCallback(() => {
    runtime.endPause();
  }, [runtime]);

  const rows = orderedItems.map((item) => {
    const helpers = createHelpers(item);
    const content = renderRow === undefined
      ? <ToastBar toast={item} position={activePosition} />
      : renderRow(item, helpers);

    return (
      <ToastMeasure
        key={item.id}
        item={item}
        onHeight={runtime.updateHeight}
      >
        {content}
      </ToastMeasure>
    );
  });

  const Container = transport === "top-layer" ? TopLayerContainer : InlineContainer;

  return (
    <ToasterContext.Provider value={runtime}>
      <style>{toasterStyles}</style>
      <Container className={containerClassName} style={containerStyleValue}>
        <div
          role="region"
          aria-label="Notifications"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={regionStyle}
        >
          {rows}
        </div>
      </Container>
    </ToasterContext.Provider>
  );
}
