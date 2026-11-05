import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createToastRuntime } from "../../src/core/createToastRuntime";
import type { ToastRuntimeApi } from "../../src/types/toast";

let runtime: ToastRuntimeApi;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  runtime = createToastRuntime("queue");
  runtime.configureView({ limit: 1, position: "top-right" });
});

afterEach(() => {
  runtime.clear();
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
});

it("queued toast: long wait behind loading -> receives its full duration on display", () => {
  runtime.addToast("loading", "Blocking", { id: "first" });
  runtime.addToast("success", "Queued", { id: "next", duration: 500 });
  vi.advanceTimersByTime(10_000);
  expect(runtime.getRawSnapshot()).toHaveLength(2);
  expect(vi.getTimerCount()).toBe(0);

  runtime.remove("first");

  expect(runtime.getSnapshot()).toMatchObject([{ id: "next", status: "visible", createdAt: 0 }]);
  vi.advanceTimersByTime(499);
  expect(runtime.getSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getSnapshot()[0].status).toBe("closing");
});

it("limit: shrink and expand -> preserves remaining displayed duration without changing creation metadata", () => {
  runtime.configureView({ limit: 2, position: "top-right" });
  runtime.addToast("loading", "Blocking");
  runtime.addToast("blank", "Timed", { id: "timed", duration: 1000 });
  vi.advanceTimersByTime(250);

  runtime.configureView({ limit: 1, position: "top-right" });
  vi.advanceTimersByTime(10_000);
  runtime.configureView({ limit: 2, position: "top-right" });

  expect(runtime.getRawSnapshot()[1]).toMatchObject({ createdAt: 0, pauseDuration: 0, status: "visible" });
  vi.advanceTimersByTime(749);
  expect(runtime.getRawSnapshot()[1].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getRawSnapshot()[1].status).toBe("closing");
});

it("limit: initially zero -> starts the first lifetime only after enabling display", () => {
  runtime.configureView({ limit: 0, position: "top-right" });
  runtime.addToast("blank", "Hidden", { duration: 500 });
  vi.advanceTimersByTime(10_000);
  expect(runtime.getSnapshot()).toEqual([]);

  runtime.configureView({ limit: 1, position: "top-right" });

  expect(runtime.getSnapshot()).toHaveLength(1);
  vi.advanceTimersByTime(499);
  expect(runtime.getSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getSnapshot()[0].status).toBe("closing");
});

it("queued toast: promotion during pause -> starts its full duration after resume", () => {
  runtime.addToast("loading", "Blocking", { id: "first" });
  runtime.addToast("blank", "Queued", { duration: 500 });
  vi.advanceTimersByTime(2000);
  runtime.startPause();

  runtime.remove("first");
  vi.advanceTimersByTime(2000);
  runtime.endPause();

  vi.advanceTimersByTime(499);
  expect(runtime.getSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getSnapshot()[0].status).toBe("closing");
});

it("limit and pause: overlapping hidden time -> excludes the overlap only once", () => {
  runtime.configureView({ limit: 2, position: "top-right" });
  runtime.addToast("loading", "Blocking");
  runtime.addToast("blank", "Timed", { duration: 1000 });
  vi.advanceTimersByTime(250);
  runtime.startPause();
  vi.advanceTimersByTime(500);
  runtime.configureView({ limit: 1, position: "top-right" });
  runtime.endPause();
  vi.advanceTimersByTime(5000);

  runtime.configureView({ limit: 2, position: "top-right" });

  vi.advanceTimersByTime(749);
  expect(runtime.getRawSnapshot()[1].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getRawSnapshot()[1].status).toBe("closing");
});

it("closing toast: exit delay occupies the slot -> promotes the queue only on removal", () => {
  runtime.addToast("blank", "First", { duration: 100, removeDelay: 200 });
  runtime.addToast("blank", "Queued", { id: "next", duration: 300 });
  vi.advanceTimersByTime(100);
  expect(runtime.getSnapshot()[0].status).toBe("closing");
  vi.advanceTimersByTime(199);
  expect(runtime.getSnapshot()[0].message).toBe("First");

  vi.advanceTimersByTime(1);

  expect(runtime.getSnapshot()).toMatchObject([{ id: "next", status: "visible" }]);
  vi.advanceTimersByTime(299);
  expect(runtime.getSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getSnapshot()[0].status).toBe("closing");
});

it("queued ID: updating a closing item -> cancels old removal and resets its future lifetime", () => {
  runtime.addToast("loading", "Blocking", { id: "first" });
  runtime.addToast("blank", "Old", { id: "same", duration: 100, removeDelay: 100 });
  runtime.dismiss("same");
  vi.advanceTimersByTime(50);

  runtime.addToast("success", "Updated", { id: "same", duration: 500 });
  vi.advanceTimersByTime(2000);
  runtime.remove("first");

  expect(runtime.getSnapshot()).toMatchObject([{ id: "same", message: "Updated", status: "visible" }]);
  vi.advanceTimersByTime(499);
  expect(runtime.getSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getSnapshot()[0].status).toBe("closing");
});

it("displayed ID: updating duration -> resets its lifetime without changing its queue order", () => {
  runtime.addToast("blank", "Old", { id: "same", duration: 1000 });
  runtime.addToast("blank", "Queued", { duration: 100 });
  vi.advanceTimersByTime(250);

  runtime.addToast("success", "Updated", { id: "same", duration: 500 });

  vi.advanceTimersByTime(499);
  expect(runtime.getSnapshot()[0]).toMatchObject({ id: "same", status: "visible" });
  vi.advanceTimersByTime(1);
  expect(runtime.getSnapshot()[0].status).toBe("closing");
});

it("position groups: queued ID moves and default position changes -> shares the limit without restarting displayed time", () => {
  runtime.addToast("loading", "Top", { id: "first", position: "top-left" });
  runtime.addToast("blank", "Bottom", { id: "next", position: "bottom-left", duration: 1000 });
  vi.advanceTimersByTime(5000);
  runtime.addToast("blank", "Moved", { id: "next", position: "bottom-right", duration: 500 });

  runtime.remove("first");
  vi.advanceTimersByTime(250);
  runtime.configureView({ limit: 1, position: "bottom-center" });

  expect(runtime.getSnapshot()[0]).toMatchObject({ position: "bottom-right", status: "visible" });
  vi.advanceTimersByTime(249);
  expect(runtime.getSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getSnapshot()[0].status).toBe("closing");
});

it("queued removal: hidden closing items -> remove on schedule even while display is paused", () => {
  runtime.addToast("loading", "Blocking");
  runtime.addToast("blank", "Hidden", { id: "hidden", duration: 100, removeDelay: 50 });
  runtime.startPause();

  runtime.dismiss("hidden");
  vi.advanceTimersByTime(50);

  expect(runtime.getRawSnapshot()).toHaveLength(1);
  expect(runtime.getRawSnapshot()[0].message).toBe("Blocking");
  runtime.endPause();
});

it("remove and clear: discard queued lifetimes -> ID reuse receives a fresh duration without leftover timers", () => {
  runtime.addToast("loading", "Blocking", { id: "first" });
  runtime.addToast("blank", "Hidden", { id: "same", duration: 100 });
  runtime.remove("same");
  runtime.clear();

  runtime.addToast("blank", "Fresh", { id: "same", duration: 500 });

  expect(vi.getTimerCount()).toBe(1);
  vi.advanceTimersByTime(499);
  expect(runtime.getSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getSnapshot()[0].status).toBe("closing");
});
