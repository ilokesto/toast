import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createToastRuntime } from "../../src/core/createToastRuntime";
import type { ToastRuntimeApi } from "../../src/types/toast";

let runtime: ToastRuntimeApi;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  runtime = createToastRuntime("pause-clear");
});

afterEach(() => {
  runtime.clear();
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
});

it.each([false, true])("clear: paused runtime followed by endPause=%s -> new items expire with no inherited pause", (resume) => {
  runtime.addToast("blank", "Old", { duration: 1000 });
  runtime.startPause();
  vi.advanceTimersByTime(500);

  runtime.clear();
  runtime.addToast("blank", "Fresh", { duration: 200, removeDelay: 50 });
  if (resume) runtime.endPause();

  expect(runtime.getRawSnapshot()).toMatchObject([{ message: "Fresh", pausedAt: null, pauseDuration: 0 }]);
  vi.advanceTimersByTime(199);
  expect(runtime.getSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getSnapshot()[0].status).toBe("closing");
  vi.advanceTimersByTime(50);
  expect(runtime.getRawSnapshot()).toEqual([]);
});

it("clear: empty paused runtime and repeated clear -> next item starts running immediately", () => {
  runtime.startPause();
  runtime.clear();
  runtime.clear();

  runtime.addToast("blank", "Fresh", { duration: 100 });

  expect(runtime.getRawSnapshot()[0].pausedAt).toBeNull();
  vi.advanceTimersByTime(100);
  expect(runtime.getRawSnapshot()[0].status).toBe("closing");
});

it("clear: a new pause cycle -> store and runtime agree on the new start and remaining duration", () => {
  runtime.startPause();
  vi.advanceTimersByTime(500);
  runtime.clear();
  runtime.addToast("blank", "Fresh", { duration: 1000 });
  vi.advanceTimersByTime(250);

  runtime.startPause();
  expect(runtime.getRawSnapshot()[0].pausedAt).toBe(750);
  vi.advanceTimersByTime(1000);
  runtime.endPause();

  expect(runtime.getRawSnapshot()[0]).toMatchObject({ pausedAt: null, pauseDuration: 1000 });
  vi.advanceTimersByTime(749);
  expect(runtime.getRawSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getRawSnapshot()[0].status).toBe("closing");
});

it("clear: fresh cross-position queue -> waiting does not consume duration and promotion runs normally", () => {
  runtime.configureView({ limit: 1, position: "top-right" });
  runtime.startPause();
  runtime.clear();
  runtime.addToast("loading", "Blocking", { id: "blocking", position: "top-left" });
  runtime.addToast("success", "Queued", { duration: 500, position: "bottom-right" });
  vi.advanceTimersByTime(5000);

  runtime.remove("blocking");

  expect(runtime.getSnapshot()).toMatchObject([{ message: "Queued", position: "bottom-right", pausedAt: null }]);
  vi.advanceTimersByTime(499);
  expect(runtime.getSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getSnapshot()[0].status).toBe("closing");
});

it("clear: old and new Promise with the same ID -> old completion stays invalidated and new success expires", async () => {
  const oldTask = Promise.withResolvers<string>();
  const newTask = Promise.withResolvers<string>();
  const messages = { loading: "Loading", success: "Done", error: "Failed" };
  const oldOutcome = runtime.promiseToast(oldTask.promise, messages, { id: "same" });
  runtime.startPause();
  runtime.clear();
  const newOutcome = runtime.promiseToast(newTask.promise, messages, { id: "same", duration: 500 });
  oldTask.resolve("old");
  await expect(oldOutcome).resolves.toBe("old");
  expect(runtime.getSnapshot()).toMatchObject([{ type: "loading", pausedAt: null }]);

  newTask.resolve("new");

  await expect(newOutcome).resolves.toBe("new");
  expect(runtime.getSnapshot()).toMatchObject([{ message: "Done", type: "success", pausedAt: null }]);
  vi.advanceTimersByTime(499);
  expect(runtime.getSnapshot()[0].status).toBe("visible");
  vi.advanceTimersByTime(1);
  expect(runtime.getSnapshot()[0].status).toBe("closing");
});

it("clear: a subscriber adds an item during clear -> pause ownership is reset before notification", () => {
  runtime.addToast("loading", "Old");
  runtime.startPause();
  const unsubscribe = runtime.subscribe(() => {
    if (runtime.getRawSnapshot().length === 0) {
      runtime.addToast("blank", "Subscriber item", { duration: 100 });
    }
  });

  runtime.clear();
  unsubscribe();

  expect(runtime.getRawSnapshot()).toMatchObject([{ message: "Subscriber item", pausedAt: null }]);
  expect(vi.getTimerCount()).toBe(1);
  vi.advanceTimersByTime(100);
  expect(runtime.getRawSnapshot()[0].status).toBe("closing");
});
