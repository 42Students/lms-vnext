import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import WeekTimeGrid, { keyboardSlot } from "@/components/tpo/WeekTimeGrid";
import { dj } from "@/components/tpo/dj";

// BE-0122: the empty-time "add" target works from the keyboard.
test("Enter on a day column starts something at a sensible time", () => {
  const monday = dj("2020-10-12T00:00:00"); // a Monday that is never today (the grid starts today at the next hour)
  const onSlotClick = jest.fn();
  render(<WeekTimeGrid days={[monday]} events={[]} colorOf={() => "#000"} renderEvent={() => null} canDrag={() => false}
    onSlotClick={onSlotClick} onDropEvent={jest.fn()} dragging={null} setDragging={jest.fn()} />);
  const day = screen.getByRole("gridcell", { name: /Monday 12 October/ });
  expect(day).toHaveAttribute("tabindex", "0");
  fireEvent.keyDown(day, { key: "Enter" });
  expect(onSlotClick).toHaveBeenCalledTimes(1);
  expect(onSlotClick.mock.calls[0][0].format("YYYY-MM-DD HH:mm")).toBe("2020-10-12 10:00");
});

test("today starts at the next whole hour", () => {
  const now = dj("2026-10-09T14:20:00");
  expect(keyboardSlot(dj("2026-10-09T00:00:00"), now).format("HH:mm")).toBe("15:00");
});
