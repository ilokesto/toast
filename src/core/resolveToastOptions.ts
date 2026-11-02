import type { DefaultToastOptions, ToastOptions, ToastType } from "../types/toast";
import { DEFAULT_ARIA_PROPS, DEFAULT_ICON_THEME } from "./utils";

/**
 * @description Merges view defaults, per-kind defaults and toast overrides in order; merges style and announcement fields separately.
 * @param {ToastType} type - Visual notification kind and default timing policy.
 * @param {DefaultToastOptions | undefined} defaultOptions - View defaults followed by per-kind defaults; undefined uses built-in defaults.
 * @param {ToastOptions | undefined} [defaultOptions.success] - Defaults for success notifications.
 * @param {string | undefined} [defaultOptions.success.id] - Stable toast identifier; reuse it to update an existing toast.
 * @param {string | undefined} [defaultOptions.success.toasterId] - Identifier of the mounted toaster that owns the notification.
 * @param {number | undefined} [defaultOptions.success.duration] - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition | undefined} [defaultOptions.success.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [defaultOptions.success.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [defaultOptions.success.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [defaultOptions.success.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [defaultOptions.success.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [defaultOptions.success.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [defaultOptions.success.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [defaultOptions.success.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [defaultOptions.success.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [defaultOptions.success.iconTheme.primary] - Icon background color.
 * @param {string} [defaultOptions.success.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [defaultOptions.success.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {ToastOptions | undefined} [defaultOptions.error] - Defaults for error notifications.
 * @param {string | undefined} [defaultOptions.error.id] - Stable toast identifier; reuse it to update an existing toast.
 * @param {string | undefined} [defaultOptions.error.toasterId] - Identifier of the mounted toaster that owns the notification.
 * @param {number | undefined} [defaultOptions.error.duration] - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition | undefined} [defaultOptions.error.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [defaultOptions.error.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [defaultOptions.error.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [defaultOptions.error.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [defaultOptions.error.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [defaultOptions.error.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [defaultOptions.error.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [defaultOptions.error.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [defaultOptions.error.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [defaultOptions.error.iconTheme.primary] - Icon background color.
 * @param {string} [defaultOptions.error.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [defaultOptions.error.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {ToastOptions | undefined} [defaultOptions.loading] - Defaults for loading notifications.
 * @param {string | undefined} [defaultOptions.loading.id] - Stable toast identifier; reuse it to update an existing toast.
 * @param {string | undefined} [defaultOptions.loading.toasterId] - Identifier of the mounted toaster that owns the notification.
 * @param {number | undefined} [defaultOptions.loading.duration] - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition | undefined} [defaultOptions.loading.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [defaultOptions.loading.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [defaultOptions.loading.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [defaultOptions.loading.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [defaultOptions.loading.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [defaultOptions.loading.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [defaultOptions.loading.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [defaultOptions.loading.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [defaultOptions.loading.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [defaultOptions.loading.iconTheme.primary] - Icon background color.
 * @param {string} [defaultOptions.loading.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [defaultOptions.loading.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {ToastOptions | undefined} [defaultOptions.blank] - Defaults for plain notifications.
 * @param {string | undefined} [defaultOptions.blank.id] - Stable toast identifier; reuse it to update an existing toast.
 * @param {string | undefined} [defaultOptions.blank.toasterId] - Identifier of the mounted toaster that owns the notification.
 * @param {number | undefined} [defaultOptions.blank.duration] - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition | undefined} [defaultOptions.blank.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [defaultOptions.blank.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [defaultOptions.blank.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [defaultOptions.blank.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [defaultOptions.blank.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [defaultOptions.blank.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [defaultOptions.blank.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [defaultOptions.blank.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [defaultOptions.blank.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [defaultOptions.blank.iconTheme.primary] - Icon background color.
 * @param {string} [defaultOptions.blank.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [defaultOptions.blank.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {ToastOptions | undefined} [defaultOptions.custom] - Defaults for custom notification content.
 * @param {string | undefined} [defaultOptions.custom.id] - Stable toast identifier; reuse it to update an existing toast.
 * @param {string | undefined} [defaultOptions.custom.toasterId] - Identifier of the mounted toaster that owns the notification.
 * @param {number | undefined} [defaultOptions.custom.duration] - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition | undefined} [defaultOptions.custom.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [defaultOptions.custom.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [defaultOptions.custom.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [defaultOptions.custom.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [defaultOptions.custom.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [defaultOptions.custom.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [defaultOptions.custom.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [defaultOptions.custom.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [defaultOptions.custom.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [defaultOptions.custom.iconTheme.primary] - Icon background color.
 * @param {string} [defaultOptions.custom.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [defaultOptions.custom.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {string | undefined} [defaultOptions.id] - Stable toast identifier; reuse it to update an existing toast.
 * @param {string | undefined} [defaultOptions.toasterId] - Identifier of the mounted toaster that owns the notification.
 * @param {number | undefined} [defaultOptions.duration] - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition | undefined} [defaultOptions.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [defaultOptions.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [defaultOptions.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [defaultOptions.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [defaultOptions.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [defaultOptions.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [defaultOptions.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [defaultOptions.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [defaultOptions.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [defaultOptions.iconTheme.primary] - Icon background color.
 * @param {string} [defaultOptions.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [defaultOptions.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @param {ToastOptions | undefined} [options] - Per-notification overrides; omitted fields inherit the configured defaults.
 * @param {string | undefined} [options.id] - Stable toast identifier; reuse it to update an existing toast.
 * @param {string | undefined} [options.toasterId] - Identifier of the mounted toaster that owns the notification.
 * @param {number | undefined} [options.duration] - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * @param {ToastPosition | undefined} [options.position] - Viewport region used to group and align toast rows.
 * @param {ToastAriaProps | undefined} [options.ariaProps] - Live-region attributes used to announce the notification.
 * @param {"status" | "alert"} [options.ariaProps.role] - Announcement role; alert announces urgent errors.
 * @param {"polite" | "assertive"} [options.ariaProps.aria-live] - Politeness level for assistive technology announcements.
 * @param {boolean | undefined} [options.ariaProps.aria-atomic] - Whether the complete notification is announced on changes.
 * @param {CSSProperties | undefined} [options.style] - Inline style overrides applied to the toast row.
 * @param {string | undefined} [options.className] - CSS class applied to the rendered element.
 * @param {ReactNode} [options.icon] - Custom React icon content; overrides the built-in status icon.
 * @param {IconTheme | undefined} [options.iconTheme] - Colors for the built-in success or error icon.
 * @param {string} [options.iconTheme.primary] - Icon background color.
 * @param {string} [options.iconTheme.secondary] - Icon foreground color.
 * @param {number | undefined} [options.removeDelay] - Delay in milliseconds between dismissal and physical removal.
 * @returns {ToastOptions} Merged toast settings including announcement and icon defaults.
 * - id `string | undefined` - Stable toast identifier; reuse it to update an existing toast.
 * - toasterId `string | undefined` - Identifier of the mounted toaster that owns the notification.
 * - duration `number | undefined` - Visible lifetime in milliseconds; Infinity disables automatic dismissal.
 * - position `ToastPosition | undefined` - Viewport region used to group and align toast rows.
 * - ariaProps `ToastAriaProps | undefined` - Live-region attributes used to announce the notification.
 * : ariaProps.role `"status" | "alert"` - Announcement role; alert announces urgent errors.
 * : ariaProps.aria-live `"polite" | "assertive"` - Politeness level for assistive technology announcements.
 * : ariaProps.aria-atomic `boolean | undefined` - Whether the complete notification is announced on changes.
 * - style `CSSProperties | undefined` - Inline style overrides applied to the toast row.
 * - className `string | undefined` - CSS class applied to the rendered element.
 * - icon `ReactNode` - Custom React icon content; overrides the built-in status icon.
 * - iconTheme `IconTheme | undefined` - Colors for the built-in success or error icon.
 * : iconTheme.primary `string` - Icon background color.
 * : iconTheme.secondary `string` - Icon foreground color.
 * - removeDelay `number | undefined` - Delay in milliseconds between dismissal and physical removal.
 * @example
 * ```ts
 * const options = resolveToastOptions("success", { duration: 3000 }, { duration: 1000 });
 * ```
 */
export function resolveToastOptions(
  type: ToastType,
  defaultOptions: DefaultToastOptions | undefined,
  options?: ToastOptions,
): ToastOptions {
  const defaultTypeOptions = defaultOptions?.[type];
  return {
    ...defaultOptions,
    ...defaultTypeOptions,
    ...options,
    style: {
      ...(defaultOptions?.style ?? {}),
      ...(defaultTypeOptions?.style ?? {}),
      ...(options?.style ?? {}),
    },
    ariaProps: {
      ...(DEFAULT_ARIA_PROPS[type] ?? {}),
      ...(defaultOptions?.ariaProps ?? {}),
      ...(defaultTypeOptions?.ariaProps ?? {}),
      ...(options?.ariaProps ?? {}),
    },
    iconTheme: options?.iconTheme
      ?? defaultTypeOptions?.iconTheme
      ?? defaultOptions?.iconTheme
      ?? (type === "success" || type === "error" ? DEFAULT_ICON_THEME[type] : undefined),
  };
}
