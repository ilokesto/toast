import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createToastRuntime } from "../src/core/createToastRuntime";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

it("replacing a closing ID cancels its old removal and uses the new duration", () => {
  const runtime = createToastRuntime("replacement");
  runtime.addToast("blank", "old", { id: "same", duration: 100, removeDelay: 100 });
  vi.advanceTimersByTime(100);
  expect(runtime.getRawSnapshot()[0].status).toBe("closing");

  runtime.addToast("success", "new", { id: "same", duration: 1000, removeDelay: 100 });
  vi.advanceTimersByTime(100);
  expect(runtime.getRawSnapshot()).toMatchObject([{ message: "new", status: "visible" }]);
  vi.advanceTimersByTime(900);
  expect(runtime.getRawSnapshot()[0].status).toBe("closing");
  vi.advanceTimersByTime(100);
  expect(runtime.getRawSnapshot()).toEqual([]);
});

it("pause and resume preserve the exact remaining duration before delayed removal", () => {
  const runtime = createToastRuntime("remaining");
  runtime.addToast("blank", "paused", { duration: 1000, removeDelay: 50 });
  vi.advanceTimersByTime(250);
  runtime.startPause();
  vi.advanceTimersByTime(500);
  runtime.endPause();

  vi.advanceTimersByTime(749);
  expect(runtime.getRawSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getRawSnapshot()[0].status).toBe("closing");
  vi.advanceTimersByTime(50);
  expect(runtime.getRawSnapshot()).toEqual([]);
});

it("a toast created while paused receives its full duration after resume", () => {
  const runtime = createToastRuntime("created-paused");
  runtime.startPause();
  vi.advanceTimersByTime(200);
  runtime.addToast("blank", "new while paused", { duration: 500 });
  vi.advanceTimersByTime(1000);
  expect(runtime.getRawSnapshot()[0].status).toBe("visible");
  runtime.endPause();

  vi.advanceTimersByTime(499);
  expect(runtime.getRawSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getRawSnapshot()[0].status).toBe("closing");
  runtime.clear();
});

it("clear cancels both timeout maps without touching another runtime", () => {
  const first = createToastRuntime("first");
  const second = createToastRuntime("second");
  first.addToast("blank", "dismiss later", { duration: 1000 });
  const closing = first.addToast("blank", "remove later", { duration: Infinity, removeDelay: 100 });
  first.dismiss(closing);
  second.addToast("blank", "independent", { duration: 500, removeDelay: 100 });
  expect(vi.getTimerCount()).toBe(3);

  first.clear();

  expect(vi.getTimerCount()).toBe(1);
  expect(first.getRawSnapshot()).toEqual([]);
  vi.advanceTimersByTime(500);
  expect(second.getRawSnapshot()[0].status).toBe("closing");
  vi.advanceTimersByTime(100);
  expect(second.getRawSnapshot()).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});
