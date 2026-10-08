import type { DefaultToastOptions, ToastOptions, ToastType } from "../types/toast";
import { DEFAULT_ARIA_PROPS, DEFAULT_ICON_THEME } from "./utils";

/** Merges view defaults, type defaults and per-toast overrides in that order. */
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
