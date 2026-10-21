import React from "react";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import WeekTimeGrid from "../WeekTimeGrid";
import { dj } from "../dj";
import { HOUR_PX } from "../ui/calendarGrid";

const days = Array.from({ length: 7 }, (_, i) => dj("2026-10-12T00:00:00").add(i, "day"));
const events = [
  { id: 1, type: "FOLLOW_UP", title: "Call Priya", startsAt: "2026-10-13T10:00:00" },
  { id: 2, type: "ROUND", title: "Acme interview", startsAt: "2026-10-13T10:15:00", endsAt: "2026-10-13T11:00:00" },
  { id: 3, type: "DEADLINE", title: "Deadline: Globex", startsAt: "2026-10-14T23:59:00" },
];
const renderGrid = (props = {}) => {
  const handlers = { onSlotClick: jest.fn(), onDropEvent: jest.fn(), setDragging: jest.fn() };
  render(
    <WeekTimeGrid days={days} events={events} dragging={null} colorOf={() => "#123456"} canDrag={(e) => e.type === "FOLLOW_UP"}
      renderEvent={(e, style) => <div key={e.id} data-testid={`ev-${e.id}`} style={style}>{e.title}</div>} {...handlers} {...props} />,
  );
  return handlers;
};

test("shows each event in its own day, with deadlines in the all-day strip", () => {
  renderGrid();
  expect(screen.getByTestId("ev-1")).toBeInTheDocument();
  expect(screen.getByTestId("ev-3").closest(".tpo-timegrid__allday")).not.toBeNull();
  expect(screen.getByTestId("ev-1").closest(".tpo-timegrid__allday")).toBeNull();
});

test("overlapping events share the column instead of covering each other", () => {
  renderGrid();
  const a = screen.getByTestId("ev-1").style; const b = screen.getByTestId("ev-2").style;
  expect(a.width).toBe("calc(50% - 4px)");
  expect(b.width).toBe("calc(50% - 4px)");
  expect(a.left).not.toBe(b.left);
});

test("clicking an empty spot reports the time that was clicked, snapped to 15 minutes", () => {
  const { onSlotClick } = renderGrid();
  const tuesday = screen.getByLabelText(/Tuesday 13 October/);
  fireEvent.click(tuesday, { clientY: HOUR_PX * 2 + 14 });
  const at = onSlotClick.mock.calls[0][0];
  expect(at.format("YYYY-MM-DD HH:mm")).toBe("2026-10-13 09:15");
});

test("dropping a dragged follow-up on a time moves it there", () => {
  const dragged = events[0];
  const { onDropEvent, setDragging } = renderGrid({ dragging: dragged });
  const wednesday = screen.getByLabelText(/Wednesday 14 October/);
  const drop = createEvent.drop(wednesday);
  Object.defineProperty(drop, "clientY", { value: HOUR_PX * 5 });
  fireEvent(wednesday, drop);
  expect(setDragging).toHaveBeenCalledWith(null);
  expect(onDropEvent).toHaveBeenCalledTimes(1);
  expect(onDropEvent.mock.calls[0][0]).toBe(dragged);
  expect(onDropEvent.mock.calls[0][1].format("YYYY-MM-DD HH:mm")).toBe("2026-10-14 12:00");
});
