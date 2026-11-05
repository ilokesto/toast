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

/**
 * @description Mounts an isolated toaster runtime, groups rows by their viewport position and pauses dismissal while the pointer is inside.
 * @param {ToasterProps} props - Properties for the rendered component.
 * @param {string | undefined} [props.toasterId] - Identifier of the mounted toaster that owns the notification.
 * @param {ToastPosition | undefined} [props.position] - Viewport region used to group and align toast rows.
 * @param {ToastTransport | undefined} [props.transport] - Inline rendering or the browser popover top layer with inline fallback.
 * @param {number | undefined} [props.limit] - Maximum number of rows exposed across all viewport positions.
 * @param {boolean | undefined} [props.reverseOrder] - Whether to place the newest item before older items.
 * @param {number | undefined} [props.gutter] - Spacing between toast rows in pixels.
 * @param {CSSProperties | undefined} [props.containerStyle] - Inline style overrides for the viewport container.
 * @param {string | undefined} [props.containerClassName] - CSS class for the viewport container.
 * @param {DefaultToastOptions | undefined} [props.toastOptions] - Shared defaults with optional per-kind overrides.
 * @param {ToastOptions | undefined} [props.toastOptions.success] - Defaults for success notifications.
 * @param {string | undefined} [props.toastOptions.success.id] - Ignored in defaults; pass id to an individual toast call.
 * @param {string | undefined} [props.toastOptions.success.toasterId] - Ignored in defaults; the top-level toasterId selects this runtime.
 * @param {number | undefined} [props.toastOptions.success.duration] - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition | undefined} [props.toastOptions.success.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [props.toastOptions.success.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [props.toastOptions.success.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [props.toastOptions.success.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [props.toastOptions.success.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [props.toastOptions.success.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [props.toastOptions.success.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [props.toastOptions.success.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [props.toastOptions.success.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [props.toastOptions.success.iconTheme.primary] - Icon background color.
 * @param {string} [props.toastOptions.success.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [props.toastOptions.success.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {ToastOptions | undefined} [props.toastOptions.error] - Defaults for error notifications.
 * @param {string | undefined} [props.toastOptions.error.id] - Ignored in defaults; pass id to an individual toast call.
 * @param {string | undefined} [props.toastOptions.error.toasterId] - Ignored in defaults; the top-level toasterId selects this runtime.
 * @param {number | undefined} [props.toastOptions.error.duration] - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition | undefined} [props.toastOptions.error.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [props.toastOptions.error.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [props.toastOptions.error.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [props.toastOptions.error.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [props.toastOptions.error.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [props.toastOptions.error.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [props.toastOptions.error.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [props.toastOptions.error.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [props.toastOptions.error.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [props.toastOptions.error.iconTheme.primary] - Icon background color.
 * @param {string} [props.toastOptions.error.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [props.toastOptions.error.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {ToastOptions | undefined} [props.toastOptions.loading] - Defaults for loading notifications.
 * @param {string | undefined} [props.toastOptions.loading.id] - Ignored in defaults; pass id to an individual toast call.
 * @param {string | undefined} [props.toastOptions.loading.toasterId] - Ignored in defaults; the top-level toasterId selects this runtime.
 * @param {number | undefined} [props.toastOptions.loading.duration] - Default lifetime in milliseconds; toast.loading overrides it to Infinity.
 * @param {ToastPosition | undefined} [props.toastOptions.loading.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [props.toastOptions.loading.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [props.toastOptions.loading.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [props.toastOptions.loading.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [props.toastOptions.loading.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [props.toastOptions.loading.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [props.toastOptions.loading.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [props.toastOptions.loading.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [props.toastOptions.loading.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [props.toastOptions.loading.iconTheme.primary] - Icon background color.
 * @param {string} [props.toastOptions.loading.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [props.toastOptions.loading.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {ToastOptions | undefined} [props.toastOptions.blank] - Defaults for plain notifications.
 * @param {string | undefined} [props.toastOptions.blank.id] - Ignored in defaults; pass id to an individual toast call.
 * @param {string | undefined} [props.toastOptions.blank.toasterId] - Ignored in defaults; the top-level toasterId selects this runtime.
 * @param {number | undefined} [props.toastOptions.blank.duration] - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition | undefined} [props.toastOptions.blank.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [props.toastOptions.blank.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [props.toastOptions.blank.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [props.toastOptions.blank.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [props.toastOptions.blank.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [props.toastOptions.blank.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [props.toastOptions.blank.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [props.toastOptions.blank.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [props.toastOptions.blank.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [props.toastOptions.blank.iconTheme.primary] - Icon background color.
 * @param {string} [props.toastOptions.blank.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [props.toastOptions.blank.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {ToastOptions | undefined} [props.toastOptions.custom] - Defaults for custom notification content.
 * @param {string | undefined} [props.toastOptions.custom.id] - Ignored in defaults; pass id to an individual toast call.
 * @param {string | undefined} [props.toastOptions.custom.toasterId] - Ignored in defaults; the top-level toasterId selects this runtime.
 * @param {number | undefined} [props.toastOptions.custom.duration] - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition | undefined} [props.toastOptions.custom.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [props.toastOptions.custom.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [props.toastOptions.custom.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [props.toastOptions.custom.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [props.toastOptions.custom.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [props.toastOptions.custom.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [props.toastOptions.custom.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [props.toastOptions.custom.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [props.toastOptions.custom.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [props.toastOptions.custom.iconTheme.primary] - Icon background color.
 * @param {string} [props.toastOptions.custom.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [props.toastOptions.custom.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {string | undefined} [props.toastOptions.id] - Ignored in defaults; pass id to an individual toast call.
 * @param {string | undefined} [props.toastOptions.toasterId] - Ignored in defaults; the top-level toasterId selects this runtime.
 * @param {number | undefined} [props.toastOptions.duration] - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition | undefined} [props.toastOptions.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [props.toastOptions.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [props.toastOptions.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [props.toastOptions.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [props.toastOptions.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [props.toastOptions.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [props.toastOptions.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [props.toastOptions.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [props.toastOptions.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [props.toastOptions.iconTheme.primary] - Icon background color.
 * @param {string} [props.toastOptions.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [props.toastOptions.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {((item: ToastItem, helpers: ToastRowHelpers) => ReactNode) | undefined} [props.children] - Custom row renderer receiving the item and its dismiss/remove controls.
 * @returns {Element} Rendered notification element.
 * @example
 * ```tsx
 * <Toaster position="top-right" limit={3} toastOptions={{ duration: 4000 }} />
 * ```
 */
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

  const regions = useMemo(() => {
    const grouped = new Map<ToastPosition, ToastItem[]>([[activePosition, []]]);
    const ordered = reverseOrder ? [...items].reverse() : items;
    for (const item of ordered) {
      const region = grouped.get(item.position);
      if (region === undefined) {
        grouped.set(item.position, [item]);
      } else {
        region.push(item);
      }
    }
    return [...grouped];
  }, [activePosition, items, reverseOrder]);

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

  const Container = transport === "top-layer" ? TopLayerContainer : InlineContainer;

  return (
    <ToasterContext.Provider value={runtime}>
      <style>{toasterStyles}</style>
      {regions.map(([regionPosition, regionItems]) => (
        <Container
          key={regionPosition === activePosition ? "default" : regionPosition}
          className={containerClassName}
          style={{ ...getContainerStyle(regionPosition), ...containerStyle }}
        >
          <div
            role="region"
            aria-label="Notifications"
            data-toast-position={regionPosition}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={getRegionStyle(regionPosition, gutter)}
          >
            {regionItems.map((item) => (
              <ToastMeasure key={item.id} item={item} onHeight={runtime.updateHeight}>
                {renderRow === undefined
                  ? <ToastBar toast={item} position={item.position} />
                  : renderRow(item, createHelpers(item))}
              </ToastMeasure>
            ))}
          </div>
        </Container>
      ))}
    </ToasterContext.Provider>
  );
}
