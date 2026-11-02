import { requireRuntime } from "./registry";
import { DEFAULT_TOASTER_ID } from "./utils";
import type {
  PromiseToastMessages,
  Renderable,
  ToastFacade,
  ToastId,
  ToastOptions,
  ToastType,
  ToasterId,
} from "../types/toast";

function resolveToasterId(options?: ToastOptions): ToasterId {
  return options?.toasterId ?? DEFAULT_TOASTER_ID;
}

function createToast(message: Renderable, options?: ToastOptions): ToastId {
  return addToast("blank", message, options);
}

function addToast(type: ToastType, message: Renderable, options?: ToastOptions): ToastId {
  const runtime = requireRuntime(resolveToasterId(options));
  return runtime.addToast(type, message, options);
}

createToast.success = function success(message: Renderable, options?: ToastOptions): ToastId {
  return addToast("success", message, options);
};

createToast.error = function error(message: Renderable, options?: ToastOptions): ToastId {
  return addToast("error", message, options);
};

createToast.loading = function loading(message: Renderable, options?: ToastOptions): ToastId {
  return addToast("loading", message, {
    ...options,
    duration: Number.POSITIVE_INFINITY,
  });
};

createToast.custom = function custom(message: Renderable, options?: ToastOptions): ToastId {
  return addToast("custom", message, options);
};

createToast.promise = function promiseFn<TData>(
  promise: Promise<TData> | (() => Promise<TData>),
  messages: PromiseToastMessages<TData>,
  options?: ToastOptions,
): Promise<TData> {
  const runtime = requireRuntime(resolveToasterId(options));
  return runtime.promiseToast(promise, messages, options);
};

createToast.dismiss = function dismiss(id?: ToastId, toasterId?: ToasterId): void {
  const runtime = requireRuntime(toasterId ?? DEFAULT_TOASTER_ID);
  runtime.dismiss(id);
};

createToast.remove = function remove(id?: ToastId, toasterId?: ToasterId): void {
  const runtime = requireRuntime(toasterId ?? DEFAULT_TOASTER_ID);
  runtime.remove(id);
};

/**
 * @description Creates a plain toast in a mounted toaster, or updates an existing toast when its identifier is reused.
 * @param {ReactNode} message - React content displayed in the toast row.
 * @param {ToastOptions | undefined} [options] - Per-call identity, routing and display overrides; only omitted display settings inherit defaults.
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
 * @returns {string} Identifier of the created or updated toast.
 * @example
 * ```ts
 * // Mount <Toaster /> before calling the facade.
 * const id = toast("Saved");
 * toast.dismiss(id);
 * ```
 */
export const toast: ToastFacade = createToast;
