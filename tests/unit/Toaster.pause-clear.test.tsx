import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Toaster } from "../../src/components/Toaster";
import { getRuntime } from "../../src/core/registry";
import { toast } from "../../src/core/toast";

const toasterId = "hover-clear";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
});

it("Toaster: clear while hovered then mouseleave -> the replacement row receives its normal duration", () => {
  render(<Toaster toasterId={toasterId} />);
  act(() => {
    toast("Old", { toasterId, duration: 1000 });
  });
  const region = screen.getByRole("region", { name: "Notifications" });
  fireEvent.mouseEnter(region);
  expect(getRuntime(toasterId)?.getSnapshot()[0].pausedAt).not.toBeNull();

  act(() => {
    getRuntime(toasterId)?.clear();
    toast("Fresh", { toasterId, duration: 200, removeDelay: 50 });
  });
  fireEvent.mouseLeave(region);

  expect(screen.queryByText("Old")).toBeNull();
  expect(getRuntime(toasterId)?.getSnapshot()[0].pausedAt).toBeNull();
  act(() => {
    vi.advanceTimersByTime(199);
  });
  expect(screen.getByText("Fresh")).toBeVisible();
  expect(screen.getByRole("status").style.animation).toContain("toast-enter");
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(screen.getByRole("status").style.animation).toContain("toast-exit");
  act(() => {
    vi.advanceTimersByTime(50);
  });
  expect(screen.queryByText("Fresh")).toBeNull();
});
