import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "../src/components/Toaster";
import { getRuntime } from "../src/core/registry";
import { toast } from "../src/core/toast";
import { useToaster } from "../src/hooks/useToaster";
import type { DefaultToastOptions } from "../src/types/toast";

const TOASTER_ID = "view-config-toaster";
const CONFIGURED_TOAST_OPTIONS = {
  duration: 60_000,
  className: "configured-row",
  ariaProps: {
    role: "alert",
    "aria-live": "assertive",
    "aria-atomic": false,
  },
} satisfies DefaultToastOptions;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  expect(getRuntime(TOASTER_ID)).toBeUndefined();
});

describe("Toaster view configuration", () => {
  it("renders a facade-created toast at the Toaster bottom-left position", () => {
    // Given
    render(<Toaster toasterId={TOASTER_ID} position="bottom-left" />);

    expect(getRuntime(TOASTER_ID)).toBeDefined();

    const region = screen.getByRole("region", { name: "Notifications" });

    // When
    act(() => {
      toast("Bottom-left toast", { toasterId: TOASTER_ID });
    });

    // Then
    expect(within(region).getByText("Bottom-left toast")).toBeVisible();
    expect(getRuntime(TOASTER_ID)?.getRawSnapshot()[0]?.position).toBe("bottom-left");
  });

  it("renders a facade-created toast at the Toaster bottom-center position", () => {
    // Given
    render(<Toaster toasterId={TOASTER_ID} position="bottom-center" />);

    expect(getRuntime(TOASTER_ID)).toBeDefined();

    const region = screen.getByRole("region", { name: "Notifications" });

    // When
    act(() => {
      toast("Bottom-center toast", { toasterId: TOASTER_ID });
    });

    // Then
    expect(within(region).getByText("Bottom-center toast")).toBeVisible();
    expect(getRuntime(TOASTER_ID)?.getRawSnapshot()[0]?.position).toBe("bottom-center");
  });

  it("keeps an explicit per-toast position ahead of the Toaster position", () => {
    // Given
    render(<Toaster toasterId={TOASTER_ID} position="bottom-left" />);

    expect(getRuntime(TOASTER_ID)).toBeDefined();

    // When
    act(() => {
      toast("Explicit toast", {
        toasterId: TOASTER_ID,
        position: "top-center",
      });
    });

    // Then
    expect(getRuntime(TOASTER_ID)?.getRawSnapshot()[0]?.position).toBe("top-center");
  });

  it("keeps toastOptions.position ahead of the Toaster position", () => {
    // Given
    render(
      <Toaster
        toasterId={TOASTER_ID}
        position="bottom-left"
        toastOptions={{ position: "bottom-center" }}
      />,
    );

    expect(getRuntime(TOASTER_ID)).toBeDefined();

    const region = screen.getByRole("region", { name: "Notifications" });

    // When
    act(() => {
      toast("Toast options position", { toasterId: TOASTER_ID });
    });

    // Then
    expect(within(region).getByText("Toast options position")).toBeVisible();
    expect(getRuntime(TOASTER_ID)?.getRawSnapshot()[0]?.position).toBe("bottom-center");
  });

  it("clears removed defaults after rerender while preserving the existing accessible toast row", () => {
    // Given
    const view = render(
      <Toaster
        toasterId={TOASTER_ID}
        toastOptions={CONFIGURED_TOAST_OPTIONS}
      />,
    );

    expect(getRuntime(TOASTER_ID)).toBeDefined();

    const region = screen.getByRole("region", { name: "Notifications" });

    act(() => {
      toast("Configured toast", { toasterId: TOASTER_ID });
    });

    const configuredRow = within(region).getByRole("alert");
    expect(configuredRow).toHaveTextContent("Configured toast");
    expect(configuredRow).toHaveClass("configured-row");
    expect(configuredRow).toHaveAttribute("aria-live", "assertive");
    expect(configuredRow).toHaveAttribute("aria-atomic", "false");

    // When
    view.rerender(<Toaster toasterId={TOASTER_ID} />);

    act(() => {
      toast("Unconfigured toast", { toasterId: TOASTER_ID });
    });

    // Then
    const unconfiguredRow = within(region).getByRole("status");
    expect(unconfiguredRow).toHaveTextContent("Unconfigured toast");
    expect(unconfiguredRow).not.toHaveClass("configured-row");
    expect(unconfiguredRow).toHaveAttribute("aria-live", "polite");
    expect(unconfiguredRow).toHaveAttribute("aria-atomic", "true");
    expect(within(region).getByRole("alert")).toBe(configuredRow);
    expect(configuredRow).toHaveTextContent("Configured toast");
  });

  it("measures initial and changed content without ResizeObserver", () => {
    // Given
    vi.stubGlobal("ResizeObserver", undefined);
    const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get");
    height.mockReturnValue(32);
    const view = render(<Toaster toasterId={TOASTER_ID} />);
    const options = { toasterId: TOASTER_ID, id: "measured", duration: Infinity };

    // When
    act(() => {
      toast("Initial content", options);
    });

    // Then
    expect(getRuntime(TOASTER_ID)?.getRawSnapshot()[0]?.height).toBe(32);

    height.mockReturnValue(64);
    act(() => {
      toast("Changed content", options);
    });
    expect(getRuntime(TOASTER_ID)?.getRawSnapshot()[0]?.height).toBe(64);

    view.unmount();
    expect(getRuntime(TOASTER_ID)).toBeUndefined();
  });

  it("updates measured height and disconnects observers on content, status, and unmount", () => {
    // Given
    const resizeCallbacks: Array<() => void> = [];
    const observe = vi.fn();
    const disconnect = vi.fn();
    const ResizeObserverMock = vi.fn(function (callback: () => void) {
      resizeCallbacks.push(callback);
      return { observe, disconnect };
    });
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get");
    height.mockReturnValue(32);
    const view = render(<Toaster toasterId={TOASTER_ID} />);
    const options = { toasterId: TOASTER_ID, id: "measured", duration: Infinity };
    act(() => {
      toast("Initial content", options);
    });
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(observe).toHaveBeenCalledWith(region.firstElementChild);
    expect(getRuntime(TOASTER_ID)?.getRawSnapshot()[0]?.height).toBe(32);

    // When
    height.mockReturnValue(48);
    act(() => {
      resizeCallbacks[0]();
    });

    // Then
    expect(getRuntime(TOASTER_ID)?.getRawSnapshot()[0]?.height).toBe(48);
    expect(ResizeObserverMock).toHaveBeenCalledOnce();
    expect(disconnect).not.toHaveBeenCalled();

    height.mockReturnValue(64);
    act(() => {
      toast("Changed content", options);
    });
    expect(getRuntime(TOASTER_ID)?.getRawSnapshot()[0]?.height).toBe(64);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(ResizeObserverMock).toHaveBeenCalledTimes(2);

    height.mockReturnValue(80);
    act(() => {
      toast.dismiss(options.id, TOASTER_ID);
    });
    expect(getRuntime(TOASTER_ID)?.getRawSnapshot()[0]?.height).toBe(80);
    expect(disconnect).toHaveBeenCalledTimes(2);
    expect(ResizeObserverMock).toHaveBeenCalledTimes(3);

    view.unmount();
    expect(disconnect).toHaveBeenCalledTimes(3);
  });

  it("keeps custom rows inside runtime context with hover and row helpers", () => {
    // Given
    function ContextRow() {
      const { toasts } = useToaster();
      return <span>{toasts[0]?.status}</span>;
    }

    render(
      <Toaster toasterId={TOASTER_ID}>
        {(item, { dismiss, remove }) => (
          <div>
            {item.message}
            <ContextRow />
            <button onClick={dismiss}>Dismiss</button>
            <button onClick={remove}>Remove</button>
          </div>
        )}
      </Toaster>,
    );
    act(() => {
      toast("Custom row", { toasterId: TOASTER_ID, duration: Infinity });
    });
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(within(region).getByText("Custom row")).toBeVisible();
    expect(within(region).getByText("visible")).toBeVisible();

    // When
    fireEvent.mouseEnter(region);

    // Then
    expect(getRuntime(TOASTER_ID)?.getRawSnapshot()[0]?.pausedAt).toEqual(expect.any(Number));
    fireEvent.mouseLeave(region);
    expect(getRuntime(TOASTER_ID)?.getRawSnapshot()[0]?.pausedAt).toBeNull();

    fireEvent.click(within(region).getByRole("button", { name: "Dismiss" }));
    expect(within(region).getByText("closing")).toBeVisible();
    fireEvent.click(within(region).getByRole("button", { name: "Remove" }));
    expect(region).toBeEmptyDOMElement();
  });
});
