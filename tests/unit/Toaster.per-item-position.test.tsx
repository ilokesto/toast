import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Toaster } from "../../src/components/Toaster";
import { getRuntime } from "../../src/core/registry";
import { toast } from "../../src/core/toast";
import { useToaster } from "../../src/hooks/useToaster";
import type { ToastItem, ToastPosition } from "../../src/types/toast";

const toasterId = "per-item-position";
const positions: ToastPosition[] = [
  "top-left", "top-center", "top-right",
  "bottom-left", "bottom-center", "bottom-right",
];

afterEach(cleanup);

it("Toaster: per-item positions -> renders all six regions with their own motion direction", () => {
  render(<Toaster toasterId={toasterId} />);

  act(() => {
    for (const position of positions) {
      toast.success(position, { toasterId, position, duration: Infinity });
    }
  });

  for (const position of positions) {
    const row = screen.getByText(position).closest('[role="status"]');
    const region = row?.closest('[role="region"]');
    expect(region).toHaveAttribute("data-toast-position", position);
    expect(row).toHaveStyle({
      "--toast-enter-y": position.startsWith("top") ? "-14px" : "14px",
    });
    expect(row).toBeVisible();
  }
});

it("Toaster: mixed positions -> preserves a runtime-wide limit and per-region order and gutter", () => {
  render(<Toaster toasterId={toasterId} limit={3} reverseOrder gutter={12} />);

  act(() => {
    toast("First", { toasterId, position: "bottom-left", duration: Infinity });
    toast("Other region", { toasterId, duration: Infinity });
    toast("Second", { toasterId, position: "bottom-left", duration: Infinity });
    toast("Queued", { toasterId, position: "bottom-right", duration: Infinity });
  });

  const region = screen.getByText("First").closest('[role="region"]') as HTMLElement;
  expect(within(region).getAllByRole("status").map((row) => row.textContent)).toEqual(["Second", "First"]);
  expect(region).toHaveStyle({ gap: "12px" });
  expect(screen.getByText("Other region")).toBeVisible();
  expect(screen.queryByText("Queued")).toBeNull();
});

it("Toaster: type defaults and position changes -> keeps existing rows visible and moves updated IDs", () => {
  const view = render(
    <Toaster toasterId={toasterId} toastOptions={{ success: { position: "bottom-center" } }} />,
  );
  act(() => {
    toast.success("Typed", { toasterId, id: "typed", duration: Infinity });
    toast("Original default", { toasterId, duration: Infinity });
  });
  expect(screen.getByText("Typed")).toBeVisible();

  view.rerender(<Toaster toasterId={toasterId} position="bottom-right" />);
  act(() => {
    toast("New default", { toasterId, duration: Infinity });
    toast.success("Moved", { toasterId, id: "typed", position: "top-left", duration: Infinity });
  });

  expect(screen.getByText("Original default")).toBeVisible();
  expect(screen.getByText("New default").closest("[data-toast-position]")).toHaveAttribute("data-toast-position", "bottom-right");
  expect(screen.getByText("Moved").closest("[data-toast-position]")).toHaveAttribute("data-toast-position", "top-left");
  expect(screen.queryByText("Typed")).toBeNull();
});

it("Toaster: custom rows across positions -> shares controls while offsets stay within each position", () => {
  function CustomRow({ item, remove }: { item: ToastItem; remove: () => void }) {
    const { handlers } = useToaster();
    return (
      <button onClick={remove} data-offset={handlers.calculateOffset(item)}>
        {item.message}
      </button>
    );
  }
  render(
    <Toaster toasterId={toasterId}>
      {(item, { remove }) => <CustomRow item={item} remove={remove} />}
    </Toaster>,
  );
  act(() => {
    toast("Top", { toasterId, id: "top", duration: Infinity });
    toast("Bottom first", { toasterId, id: "bottom-first", position: "bottom-left", duration: Infinity });
    toast("Bottom second", { toasterId, id: "bottom-second", position: "bottom-left", duration: Infinity });
  });
  act(() => {
    getRuntime(toasterId)?.updateHeight("top", 100);
    getRuntime(toasterId)?.updateHeight("bottom-first", 30);
  });

  expect(screen.getByRole("button", { name: "Bottom first" })).toHaveAttribute("data-offset", "0");
  const second = screen.getByRole("button", { name: "Bottom second" });
  expect(second).toHaveAttribute("data-offset", "38");
  const region = second.closest('[role="region"]') as HTMLElement;
  fireEvent.mouseEnter(region);
  expect(getRuntime(toasterId)?.getRawSnapshot().every((item) => item.pausedAt !== null)).toBe(true);
  fireEvent.mouseLeave(region);
  expect(getRuntime(toasterId)?.getRawSnapshot().every((item) => item.pausedAt === null)).toBe(true);
  fireEvent.click(second);
  expect(screen.queryByRole("button", { name: "Bottom second" })).toBeNull();
});
