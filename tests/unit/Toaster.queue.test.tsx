import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Toaster } from "../../src/components/Toaster";
import { toast } from "../../src/core/toast";

const toasterId = "queue-view";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  cleanup();
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
});

it("Toaster: queued cross-position row -> renders its full lifetime after the blocking row is removed", () => {
  render(<Toaster toasterId={toasterId} limit={1} />);
  act(() => {
    toast.loading("Blocking", { toasterId, id: "blocking", position: "top-left" });
    toast("Queued", { toasterId, duration: 500, removeDelay: 50, position: "bottom-right" });
    vi.advanceTimersByTime(5000);
  });
  expect(screen.getByText("Blocking")).toBeVisible();
  expect(screen.queryByText("Queued")).toBeNull();

  act(() => {
    toast.remove("blocking", toasterId);
  });

  expect(screen.getByText("Queued")).toBeVisible();
  expect(screen.getByText("Queued").closest("[data-toast-position]")).toHaveAttribute("data-toast-position", "bottom-right");
  act(() => {
    vi.advanceTimersByTime(499);
  });
  expect(screen.getByRole("status").style.animation).toContain("toast-enter");
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(screen.getByRole("status").style.animation).toContain("toast-exit");
  act(() => {
    vi.advanceTimersByTime(50);
  });
  expect(screen.queryByText("Queued")).toBeNull();
});

it("Toaster: limit prop hides a displayed row -> resumes its remaining duration after a later rerender", () => {
  const view = render(<Toaster toasterId={toasterId} limit={2} />);
  act(() => {
    toast.loading("Blocking", { toasterId });
    toast("Timed", { toasterId, duration: 1000 });
    vi.advanceTimersByTime(250);
  });
  view.rerender(<Toaster toasterId={toasterId} limit={1} />);
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  expect(screen.queryByText("Timed")).toBeNull();

  view.rerender(<Toaster toasterId={toasterId} limit={2} />);

  expect(screen.getByText("Timed")).toBeVisible();
  act(() => {
    vi.advanceTimersByTime(749);
  });
  expect(screen.getByText("Timed").closest('[role="status"]')?.getAttribute("style")).toContain("toast-enter");
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(screen.getByText("Timed").closest('[role="status"]')?.getAttribute("style")).toContain("toast-exit");
});
