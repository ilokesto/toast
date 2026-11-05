import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Toaster } from "../../src/components/Toaster";
import { getRuntime } from "../../src/core/registry";
import { toast } from "../../src/core/toast";

const toasterId = "promise-cleanup";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  expect(getRuntime(toasterId)).toBeUndefined();
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
});

it.each(["resolve", "reject"] as const)("Toaster: unmount then %s -> old runtime stays empty and remounted runtime remains intact", async (settlement) => {
  const task = Promise.withResolvers<string>();
  const view = render(<Toaster toasterId={toasterId} />);
  const oldRuntime = getRuntime(toasterId)!;
  let outcome: Promise<string>;
  act(() => {
    outcome = toast.promise(task.promise, { loading: "Old loading", success: "Old success", error: "Old error" }, { toasterId, id: "same" });
  });
  expect(screen.getByText("Old loading")).toBeVisible();
  const reason = new Error("Original failure");
  const assertion = settlement === "resolve"
    ? expect(outcome!).resolves.toBe("Original value")
    : expect(outcome!).rejects.toBe(reason);
  view.unmount();
  render(<Toaster toasterId={toasterId} />);
  act(() => {
    toast.success("New runtime", { toasterId, id: "same", duration: Infinity });
  });

  await act(async () => {
    if (settlement === "resolve") task.resolve("Original value");
    else task.reject(reason);
    await assertion;
  });

  expect(oldRuntime.getRawSnapshot()).toEqual([]);
  expect(getRuntime(toasterId)?.getRawSnapshot()).toMatchObject([{ id: "same", message: "New runtime" }]);
  expect(screen.getByText("New runtime")).toBeVisible();
  expect(screen.queryByText("Old success")).toBeNull();
  expect(screen.queryByText("Old error")).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});
