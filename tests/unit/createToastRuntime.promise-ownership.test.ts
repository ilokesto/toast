import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createToastRuntime } from "../../src/core/createToastRuntime";
import type { ToastRuntimeApi } from "../../src/types/toast";

let runtime: ToastRuntimeApi;
const messages = { loading: "Loading", success: "Done", error: "Failed" };

beforeEach(() => {
  vi.useFakeTimers();
  runtime = createToastRuntime("promise-ownership");
});

afterEach(() => {
  runtime.clear();
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
});

it("promiseToast: clear before fulfillment -> preserves the value without rendering or invoking stale resolvers", async () => {
  const task = Promise.withResolvers<{ saved: boolean }>();
  const success = vi.fn(() => "Done");
  const outcome = runtime.promiseToast(task.promise, { ...messages, success });
  runtime.clear();
  const value = { saved: true };

  task.resolve(value);

  await expect(outcome).resolves.toBe(value);
  expect(success).not.toHaveBeenCalled();
  expect(runtime.getRawSnapshot()).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});

it("promiseToast: clear before rejection -> preserves the rejection without rendering or invoking stale resolvers", async () => {
  const task = Promise.withResolvers<never>();
  const error = vi.fn(() => "Failed");
  const outcome = runtime.promiseToast(task.promise, { ...messages, error });
  const reason = new Error("Original failure");
  const assertion = expect(outcome).rejects.toBe(reason);
  runtime.clear();

  task.reject(reason);

  await assertion;
  expect(error).not.toHaveBeenCalled();
  expect(runtime.getRawSnapshot()).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});

it("promiseToast: clear then reuse the ID -> older completion cannot overwrite a newer request", async () => {
  const first = Promise.withResolvers<string>();
  const second = Promise.withResolvers<string>();
  const oldOutcome = runtime.promiseToast(first.promise, messages, { id: "same" });
  runtime.clear();
  const newOutcome = runtime.promiseToast(second.promise, { ...messages, success: "New result" }, { id: "same" });
  second.resolve("new");
  await expect(newOutcome).resolves.toBe("new");

  first.resolve("old");

  await expect(oldOutcome).resolves.toBe("old");
  expect(runtime.getRawSnapshot()).toMatchObject([{ id: "same", message: "New result", type: "success" }]);
  expect(vi.getTimerCount()).toBe(1);
});

it("promiseToast: newer same-ID request is pending -> skips older success and leaves the current loading row intact", async () => {
  const first = Promise.withResolvers<string>();
  const second = Promise.withResolvers<string>();
  const success = vi.fn(() => "Old result");
  const oldOutcome = runtime.promiseToast(first.promise, { ...messages, success }, { id: "same" });
  const newOutcome = runtime.promiseToast(second.promise, { ...messages, loading: "New loading" }, { id: "same" });

  first.resolve("old");

  await expect(oldOutcome).resolves.toBe("old");
  expect(success).not.toHaveBeenCalled();
  expect(runtime.getRawSnapshot()).toMatchObject([{ id: "same", message: "New loading", type: "loading" }]);
  expect(vi.getTimerCount()).toBe(0);
  second.resolve("new");
  await expect(newOutcome).resolves.toBe("new");
  expect(runtime.getRawSnapshot()).toMatchObject([{ message: "Done", type: "success" }]);
});

it("promiseToast: older same-ID request rejects after newer success -> preserves both caller results and the new row", async () => {
  const first = Promise.withResolvers<string>();
  const error = vi.fn(() => "Old failure");
  const oldOutcome = runtime.promiseToast(first.promise, { ...messages, error }, { id: "same" });
  const reason = new Error("Old failure");
  const assertion = expect(oldOutcome).rejects.toBe(reason);
  await expect(runtime.promiseToast(Promise.resolve("new"), messages, { id: "same" })).resolves.toBe("new");

  first.reject(reason);

  await assertion;
  expect(error).not.toHaveBeenCalled();
  expect(runtime.getRawSnapshot()).toMatchObject([{ message: "Done", type: "success" }]);
});

it("promiseToast: a manual update reuses its ID -> cannot overwrite the newer notification", async () => {
  const task = Promise.withResolvers<string>();
  const outcome = runtime.promiseToast(task.promise, messages, { id: "same" });
  runtime.addToast("blank", "Manual", { id: "same", duration: Infinity });

  task.resolve("value");

  await expect(outcome).resolves.toBe("value");
  expect(runtime.getRawSnapshot()).toMatchObject([{ id: "same", message: "Manual", type: "blank" }]);
  expect(vi.getTimerCount()).toBe(0);
});

it("promiseToast: remove its loading ID -> settlement does not recreate the removed row", async () => {
  const task = Promise.withResolvers<string>();
  const outcome = runtime.promiseToast(task.promise, messages, { id: "removed" });
  runtime.remove("removed");

  task.resolve("value");

  await expect(outcome).resolves.toBe("value");
  expect(runtime.getRawSnapshot()).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});

it("promiseToast: loading subscriber clears synchronously -> completion remains invalidated", async () => {
  const task = Promise.withResolvers<string>();
  const unsubscribe = runtime.subscribe(() => {
    if (runtime.getRawSnapshot().length !== 0) runtime.clear();
  });
  const outcome = runtime.promiseToast(task.promise, messages);
  unsubscribe();

  task.resolve("value");

  await expect(outcome).resolves.toBe("value");
  expect(runtime.getRawSnapshot()).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});

it("promiseToast: success resolver clears runtime -> rechecks ownership before writing its message", async () => {
  const task = Promise.withResolvers<string>();
  const outcome = runtime.promiseToast(task.promise, {
    ...messages,
    success: () => {
      runtime.clear();
      return "Must not reappear";
    },
  });

  task.resolve("value");

  await expect(outcome).resolves.toBe("value");
  expect(runtime.getRawSnapshot()).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});

it("promiseToast: error resolver starts a newer same-ID request -> leaves the newer owner registered", async () => {
  const first = Promise.withResolvers<string>();
  const second = Promise.withResolvers<string>();
  let newOutcome: Promise<string> | undefined;
  const oldOutcome = runtime.promiseToast(first.promise, {
    ...messages,
    error: () => {
      newOutcome = runtime.promiseToast(second.promise, { ...messages, loading: "New loading" }, { id: "same" });
      return "Old failure";
    },
  }, { id: "same" });
  const reason = new Error("Original");
  const assertion = expect(oldOutcome).rejects.toBe(reason);

  first.reject(reason);

  await assertion;
  expect(runtime.getRawSnapshot()).toMatchObject([{ message: "New loading", type: "loading" }]);
  second.resolve("new");
  await expect(newOutcome).resolves.toBe("new");
  expect(runtime.getRawSnapshot()).toMatchObject([{ message: "Done", type: "success" }]);
});

it("promiseToast: independent IDs -> one settlement does not invalidate another pending request", async () => {
  const first = Promise.withResolvers<string>();
  const second = Promise.withResolvers<string>();
  const oldOutcome = runtime.promiseToast(first.promise, messages, { id: "first" });
  const newOutcome = runtime.promiseToast(second.promise, messages, { id: "second" });

  first.resolve("first");
  second.resolve("second");

  await expect(oldOutcome).resolves.toBe("first");
  await expect(newOutcome).resolves.toBe("second");
  expect(runtime.getRawSnapshot().map((item) => item.type)).toEqual(["success", "success"]);
});

it("promiseToast: lazy factory starts a newer same-ID request -> the newer request retains ownership", async () => {
  const first = Promise.withResolvers<string>();
  const second = Promise.withResolvers<string>();
  let newOutcome: Promise<string> | undefined;

  const oldOutcome = runtime.promiseToast(() => {
    newOutcome = runtime.promiseToast(second.promise, { ...messages, loading: "New loading" }, { id: "same" });
    return first.promise;
  }, { ...messages, loading: "Old loading" }, { id: "same" });

  expect(runtime.getRawSnapshot()).toMatchObject([{ message: "New loading", type: "loading" }]);
  first.resolve("old");
  await expect(oldOutcome).resolves.toBe("old");
  expect(runtime.getRawSnapshot()).toMatchObject([{ message: "New loading", type: "loading" }]);
  second.resolve("new");
  await expect(newOutcome).resolves.toBe("new");
  expect(runtime.getRawSnapshot()).toMatchObject([{ message: "Done", type: "success" }]);
});

it("promiseToast: lazy factory clears runtime -> preserves fulfillment without creating a loading or settlement row", async () => {
  const success = vi.fn(() => "Done");

  const outcome = runtime.promiseToast(() => {
    runtime.clear();
    return Promise.resolve("value");
  }, { ...messages, success });

  await expect(outcome).resolves.toBe("value");
  expect(success).not.toHaveBeenCalled();
  expect(runtime.getRawSnapshot()).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});

it("promiseToast: lazy factory throws synchronously -> preserves the rejection and leaves no row", async () => {
  const reason = new Error("Factory failed");

  const outcome = runtime.promiseToast(() => { throw reason; }, messages);

  await expect(outcome).rejects.toBe(reason);
  expect(runtime.getRawSnapshot()).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});
