import type {
  ToastAriaProps,
  IconTheme,
  ToastId,
  ToastPosition,
  ToastType,
} from "../types/toast";

let counter = 0;

/**
 * @description Generates a toast identifier from a process-local counter and the current timestamp.
 * @returns {string} Generated identifier.
 * @example
 * ```ts
 * const id = generateToastId();
 * ```
 */
export function generateToastId(): ToastId {
  counter += 1;
  return `toast-${counter}-${Date.now()}`;
}

export const DEFAULT_TOASTER_ID = "default";
export const DEFAULT_REMOVE_DELAY = 1000;
export const DEFAULT_GUTTER = 8;
export const DEFAULT_LIMIT = 20;
export const DEFAULT_POSITION: ToastPosition = "top-right";

export const DEFAULT_DURATION: Record<ToastType, number> = {
  blank: 4000,
  success: 2000,
  error: 4000,
  loading: Number.POSITIVE_INFINITY,
  custom: 4000,
};

export const DEFAULT_ARIA_PROPS: Record<ToastType, ToastAriaProps> = {
  blank: { role: "status", "aria-live": "polite", "aria-atomic": true },
  success: { role: "status", "aria-live": "polite", "aria-atomic": true },
  error: { role: "alert", "aria-live": "assertive", "aria-atomic": true },
  loading: { role: "status", "aria-live": "polite", "aria-atomic": true },
  custom: { role: "status", "aria-live": "polite", "aria-atomic": true },
};

export const DEFAULT_ICON_THEME: Record<"success" | "error", IconTheme> = {
  success: { primary: "#61d345", secondary: "#ffffff" },
  error: { primary: "#ff4b4b", secondary: "#ffffff" },
};

/**
 * @description Resolves a literal value or invokes its callback with the supplied argument.
 * @param {TValue | ((arg: TArg) => TValue)} value - A value or resolver invoked with the supplied argument.
 * @param {TArg} arg - Argument passed to the resolver; ignored for a literal value.
 * @returns {TValue} Resolved value.
 * @example
 * ```ts
 * const text = resolveValue((count: number) => `Saved ${count}`, 2);
 * ```
 */
export function resolveValue<TValue, TArg>(
  value: TValue | ((arg: TArg) => TValue),
  arg: TArg,
): TValue {
  return typeof value === "function"
    ? (value as (input: TArg) => TValue)(arg)
    : value;
}
