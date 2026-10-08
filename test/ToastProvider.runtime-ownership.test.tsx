import "@testing-library/jest-dom/vitest";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Toaster } from "../src/components/Toaster";
import { getRuntime } from "../src/core/registry";
import { toast } from "../src/core/toast";

const TOASTER_ID = "runtime-ownership-toaster";
const OLD_TOASTER_ID = `${TOASTER_ID}-old`;
const NEW_TOASTER_ID = `${TOASTER_ID}-new`;

afterEach(() => {
  cleanup();
  expect(getRuntime(TOASTER_ID)).toBeUndefined();
  expect(getRuntime(OLD_TOASTER_ID)).toBeUndefined();
  expect(getRuntime(NEW_TOASTER_ID)).toBeUndefined();
});

describe("Toaster runtime ownership", () => {
  it("Toaster: sameIdReplacement -> stale cleanup preserves current facade runtime", () => {
    // Arrange
    const first = render(<Toaster toasterId={TOASTER_ID} />);
    const firstRuntime = getRuntime(TOASTER_ID);
    expect(firstRuntime).toBeDefined();

    // Act
    const second = render(<Toaster toasterId={TOASTER_ID} />);
    const secondRuntime = getRuntime(TOASTER_ID);
    first.unmount();

    // Assert
    expect(secondRuntime).toBeDefined();
    expect(getRuntime(TOASTER_ID)).toBe(secondRuntime);
    expect(getRuntime(TOASTER_ID)).not.toBe(firstRuntime);

    act(() => {
      toast("Current runtime remains available", { toasterId: TOASTER_ID });
    });

    expect(secondRuntime?.getRawSnapshot()).toHaveLength(1);
  });

  it("Toaster: currentRuntimeUnmount -> registration is removed without resurrection", () => {
    // Arrange
    render(<Toaster toasterId={TOASTER_ID} />);
    const view = render(<Toaster toasterId={TOASTER_ID} />);
    const runtime = getRuntime(TOASTER_ID);
    expect(runtime).toBeDefined();

    // Act
    view.unmount();

    // Assert
    expect(getRuntime(TOASTER_ID)).toBeUndefined();
    expect(() => toast("No mounted runtime", { toasterId: TOASTER_ID })).toThrow(
      `No toaster runtime registered for toasterId "${TOASTER_ID}".`,
    );
  });

  it("Toaster: toasterIdChange -> old registration is removed and new registration remains", () => {
    // Arrange
    const view = render(<Toaster toasterId={OLD_TOASTER_ID} />);
    const oldRuntime = getRuntime(OLD_TOASTER_ID);
    expect(oldRuntime).toBeDefined();

    // Act
    view.rerender(<Toaster toasterId={NEW_TOASTER_ID} />);

    // Assert
    expect(getRuntime(OLD_TOASTER_ID)).toBeUndefined();
    expect(getRuntime(NEW_TOASTER_ID)).toBeDefined();
  });
});
