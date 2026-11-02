import type { CSSProperties, ReactNode } from "react";

export type ToastId = string;
export type ToasterId = string;

export type ToastType = "blank" | "success" | "error" | "loading" | "custom";

export type ToastStatus = "visible" | "closing";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ToastTransport = "inline" | "top-layer";

export type Renderable = ReactNode;

export type ValueOrFunction<TValue, TArg> = TValue | ((arg: TArg) => TValue);

export interface ToastAriaProps {
  /** Announcement role; alert announces urgent errors. */
  readonly role: "status" | "alert";
  /** Politeness level for assistive technology announcements. */
  readonly "aria-live": "polite" | "assertive";
  /** Whether the complete notification is announced on changes. */
  readonly "aria-atomic"?: boolean;
}

export interface IconTheme {
  /** Icon background color. */
  readonly primary: string;
  /** Icon foreground color. */
  readonly secondary: string;
}

export interface ToastItem {
  /** Stable toast identifier; reuse it to update an existing toast. */
  readonly id: ToastId;
  /** Visual notification kind and default timing policy. */
  readonly type: ToastType;
  /** React content displayed in the toast row. */
  readonly message: Renderable;
  /** Visible or closing lifecycle phase. */
  readonly status: ToastStatus;
  /** Creation or update timestamp in milliseconds since the Unix epoch. */
  readonly createdAt: number;
  /** Identifier of the mounted toaster that owns the notification. */
  readonly toasterId: ToasterId;
  /** Visible lifetime in milliseconds; Infinity disables automatic dismissal. */
  readonly duration: number;
  /** Viewport region used to group and align toast rows. */
  readonly position: ToastPosition;
  /** Measured row height in pixels, or null before measurement. */
  readonly height: number | null;
  /** Accumulated paused time in milliseconds excluded from the visible lifetime. */
  readonly pauseDuration: number;
  /** Pause timestamp in milliseconds, or null while running. */
  readonly pausedAt: number | null;
  /** Live-region attributes used to announce the notification. */
  readonly ariaProps: ToastAriaProps;
  /** Inline style overrides applied to the toast row. */
  readonly style?: CSSProperties;
  /** CSS class applied to the rendered element. */
  readonly className?: string;
  /** Custom React icon content; overrides the built-in status icon. */
  readonly icon?: ReactNode;
  /** Colors for the built-in success or error icon. */
  readonly iconTheme?: IconTheme;
  /** Delay in milliseconds between dismissal and physical removal. */
  readonly removeDelay?: number;
 }

export interface ToastState {
  /** Immutable toast items in insertion order. */
  readonly items: ReadonlyArray<ToastItem>;
  /** Pause timestamp in milliseconds, or null while running. */
  readonly pausedAt: number | null;
}

export interface ToastOptions {
  /** Stable toast identifier; reuse it to update an existing toast. */
  readonly id?: ToastId;
  /** Identifier of the mounted toaster that owns the notification. */
  readonly toasterId?: ToasterId;
  /** Visible lifetime in milliseconds; Infinity disables automatic dismissal. */
  readonly duration?: number;
  /** Viewport region used to group and align toast rows. */
  readonly position?: ToastPosition;
  /** Live-region attributes used to announce the notification. */
  readonly ariaProps?: ToastAriaProps;
  /** Inline style overrides applied to the toast row. */
  readonly style?: CSSProperties;
  /** CSS class applied to the rendered element. */
  readonly className?: string;
  /** Custom React icon content; overrides the built-in status icon. */
  readonly icon?: ReactNode;
  /** Colors for the built-in success or error icon. */
  readonly iconTheme?: IconTheme;
  /** Delay in milliseconds between dismissal and physical removal. */
  readonly removeDelay?: number;
}

export interface DefaultToastOptions extends ToastOptions {
  /** Defaults for success notifications. */
  readonly success?: ToastOptions;
  /** Defaults for error notifications. */
  readonly error?: ToastOptions;
  /** Defaults for loading notifications. */
  readonly loading?: ToastOptions;
  /** Defaults for plain notifications. */
  readonly blank?: ToastOptions;
  /** Defaults for custom notification content. */
  readonly custom?: ToastOptions;
}

export interface ToastOffsetOptions {
  /** Whether to place the newest item before older items. */
  readonly reverseOrder?: boolean;
  /** Spacing between toast rows in pixels. */
  readonly gutter?: number;
}

export interface PromiseToastMessages<TData> {
  /** Content displayed while the promise is pending. */
  readonly loading: Renderable;
  /** Success content or a resolver receiving the fulfilled value. */
  readonly success: ValueOrFunction<Renderable, TData>;
  /** Error content or a resolver receiving the rejection reason. */
  readonly error: ValueOrFunction<Renderable, unknown>;
}

export interface ToastStoreApi {
  /** Inserts a toast or replaces the matching identifier without changing its owner. */
  add(item: ToastItem): void;
  /** Merges mutable fields into the toast with the selected identifier. */
  update(id: ToastId, patch: Partial<Omit<ToastItem, "id" | "toasterId" | "createdAt">>): void;
  /** Marks the selected toast closing while retaining its exit animation. */
  dismiss(id?: ToastId): void;
  /** Removes the selected item, or all items when no identifier is provided. */
  remove(id?: ToastId): void;
  /** Clears all items and resets the stored pause timestamp. */
  clear(): void;
  /** Records the measured row height in pixels. */
  updateHeight(id: ToastId, height: number): void;
  /** Pauses automatic dismissal for visible notifications. */
  startPause(): void;
  /** Resumes dismissal after accounting for time spent paused. */
  endPause(): void;
  /** Subscribes to changes and returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Reads the current immutable snapshot. */
  getSnapshot(): ReadonlyArray<ToastItem>;
  /** Reads the initial snapshot used for server rendering. */
  getInitialSnapshot(): ReadonlyArray<ToastItem>;
}

export interface ToastRuntimeApi {
  /** Identifier of the mounted toaster that owns the notification. */
  readonly toasterId: ToasterId;
  /** Creates or updates a toast and schedules its lifecycle timers. */
  addToast(type: ToastType, message: Renderable, options?: ToastOptions): ToastId;
  /** Sets the active region, row limit and default options. */
  configureView(config: {
    /** Maximum number of rows exposed by the active view. */
    limit: number;
    /** Viewport region used to group and align toast rows. */
    position: ToastPosition;
    /** Shared defaults with optional per-kind overrides. */
    toastOptions?: DefaultToastOptions
  }): void;
  /** Updates a loading toast on promise settlement and preserves the result or rejection. */
  promiseToast<TData>(
    promise: Promise<TData> | (() => Promise<TData>),
    messages: PromiseToastMessages<TData>,
    options?: ToastOptions,
  ): Promise<TData>;
  /** Marks the selected toast closing while retaining its exit animation. */
  dismiss(id?: ToastId): void;
  /** Dismisses every toast using the normal exit lifecycle. */
  closeAll(): void;
  /** Immediately removes the selected toast and clears its timers. */
  remove(id?: ToastId): void;
  /** Immediately clears all items and timing state. */
  clear(): void;
  /** Records the measured row height in pixels. */
  updateHeight(id: ToastId, height: number): void;
  /** Reads all runtime items, including items outside the active view. */
  getRawSnapshot(): ReadonlyArray<ToastItem>;
  /** Pauses automatic dismissal for visible notifications. */
  startPause(): void;
  /** Resumes dismissal after accounting for time spent paused. */
  endPause(): void;
  /** Subscribes to changes and returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Reads the current immutable snapshot. */
  getSnapshot(): ReadonlyArray<ToastItem>;
  /** Reads the initial snapshot used for server rendering. */
  getInitialSnapshot(): ReadonlyArray<ToastItem>;
}

export interface ToastRowHelpers {
  /** Marks the selected toast closing while retaining its exit animation. */
  readonly dismiss: () => void;
  /** Immediately removes the selected toast and clears its timers. */
  readonly remove: () => void;
}

export interface ToasterProps {
  /** Identifier of the mounted toaster that owns the notification. */
  readonly toasterId?: ToasterId;
  /** Viewport region used to group and align toast rows. */
  readonly position?: ToastPosition;
  /** Inline rendering or the browser popover top layer with inline fallback. */
  readonly transport?: ToastTransport;
  /** Maximum number of rows exposed by the active view. */
  readonly limit?: number;
  /** Whether to place the newest item before older items. */
  readonly reverseOrder?: boolean;
  /** Spacing between toast rows in pixels. */
  readonly gutter?: number;
  /** Inline style overrides for the viewport container. */
  readonly containerStyle?: CSSProperties;
  /** CSS class for the viewport container. */
  readonly containerClassName?: string;
  /** Shared defaults with optional per-kind overrides. */
  readonly toastOptions?: DefaultToastOptions;
  /** Custom row renderer or nested React content as defined by the containing API. */
  readonly children?: (item: ToastItem, helpers: ToastRowHelpers) => ReactNode;
}

export interface ToastFacade {
  (message: Renderable, options?: ToastOptions): ToastId;
  /**
   * @description Creates or updates a success toast in the selected mounted toaster.
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
   * const id = toast.success("Saved");
   * ```
   */
  success(message: Renderable, options?: ToastOptions): ToastId;
  /**
   * @description Creates or updates an error toast in the selected mounted toaster.
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
   * const id = toast.error("Save failed");
   * ```
   */
  error(message: Renderable, options?: ToastOptions): ToastId;
  /**
   * @description Creates a loading toast with infinite duration until updated, dismissed or removed.
   * @param {ReactNode} message - React content displayed in the toast row.
   * @param {ToastOptions | undefined} [options] - Per-call identity, routing and display overrides; duration is always replaced with Infinity.
   * @param {string | undefined} [options.id] - Stable toast identifier; reuse it to update an existing toast.
   * @param {string | undefined} [options.toasterId] - Identifier of the mounted toaster that owns the notification.
   * @param {number | undefined} [options.duration] - Accepted by the shared options type but always overridden to Infinity for loading.
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
   * const id = toast.loading("Saving");
   * ```
   */
  loading(message: Renderable, options?: ToastOptions): ToastId;
  /**
   * @description Creates or updates a custom toast in the selected mounted toaster.
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
   * const id = toast.custom("Saved");
   * ```
   */
  custom(message: Renderable, options?: ToastOptions): ToastId;
  /**
   * @description Tracks a promise with loading and settlement content while preserving its value or rejection.
   * @param {Promise<TData> | (() => Promise<TData>)} promise - Promise or lazy promise factory whose result and rejection are preserved.
   * @param {PromiseToastMessages<TData>} messages - Content for loading, fulfillment and rejection states.
   * @param {ReactNode} messages.loading - Content displayed while the promise is pending.
   * @param {ValueOrFunction<ReactNode, TData>} messages.success - Success content or a resolver receiving the fulfilled value.
   * @param {ValueOrFunction<ReactNode, unknown>} messages.error - Error content or a resolver receiving the rejection reason.
   * @param {ToastOptions | undefined} [options] - Per-call identity, routing and display overrides; the pending loading phase uses infinite duration.
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
   * @returns {Promise<TData>} Promise preserving the task fulfillment value or rejection.
   * @example
   * ```ts
   * const result = await toast.promise(save(), { loading: "Saving", success: "Saved", error: "Failed" });
   * ```
   */
  promise<TData>(
    promise: Promise<TData> | (() => Promise<TData>),
    messages: PromiseToastMessages<TData>,
    options?: ToastOptions,
  ): Promise<TData>;
  /**
   * @description Dismisses one toast or all toasts in the selected toaster, retaining the removal delay.
   * @param {string | undefined} [id] - Identifier to dismiss; omit it to dismiss every toast in the selected toaster.
   * @param {string | undefined} [toasterId] - Identifier of the mounted toaster that owns the notification.
   * @example
   * ```ts
   * toast.dismiss("toast-id", "sidebar");
   * ```
   */
  dismiss(id?: ToastId, toasterId?: ToasterId): void;
  /**
   * @description Immediately removes one toast or all toasts in the selected toaster.
   * @param {string | undefined} [id] - Identifier to remove; omit it to remove every toast in the selected toaster.
   * @param {string | undefined} [toasterId] - Identifier of the mounted toaster that owns the notification.
   * @example
   * ```ts
   * toast.remove("toast-id", "sidebar");
   * ```
   */
  remove(id?: ToastId, toasterId?: ToasterId): void;
}

export interface UseToasterResult {
  /** Current visible items from the surrounding toaster runtime. */
  readonly toasts: ReadonlyArray<ToastItem>;
  /** Measurement, pause and layout controls for custom renderers. */
  readonly handlers: {
    /** Records the measured row height in pixels. */
    updateHeight: (id: ToastId, height: number) => void;
    /** Pauses automatic dismissal for visible notifications. */
    startPause: () => void;
    /** Resumes dismissal after accounting for time spent paused. */
    endPause: () => void;
    /** Returns the summed heights and gutters of preceding rows in pixels. */
    calculateOffset: (toast: ToastItem, options?: ToastOffsetOptions) => number;
  };
}
