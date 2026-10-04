import {
  describe,
  expect,
  it,
} from "vitest";
import {
  calendarDays,
  eventsForDay,
  filterScheduleEvents,
  shiftCalendarAnchor,
  upcomingScheduleEvents,
} from "@/components/academics/learner-schedule-model";

describe("learner class schedule model", () => {
  const events = [
    {
      id: "general",
      deliveryId: null,
      startsAt: new Date(
        2026,
        9,
        5,
        9,
        0,
      ).toISOString(),
      endsAt: new Date(
        2026,
        9,
        5,
        10,
        0,
      ).toISOString(),
    },
    {
      id: "course-a",
      deliveryId: "delivery-a",
      startsAt: new Date(
        2026,
        9,
        6,
        10,
        0,
      ).toISOString(),
      endsAt: new Date(
        2026,
        9,
        6,
        11,
        0,
      ).toISOString(),
    },
    {
      id: "course-b",
      deliveryId: "delivery-b",
      startsAt: new Date(
        2026,
        9,
        7,
        10,
        0,
      ).toISOString(),
      endsAt: new Date(
        2026,
        9,
        7,
        11,
        0,
      ).toISOString(),
    },
  ];

  it("starts on legacy week view semantics and shifts by the active period", () => {
    const anchor = new Date(2026, 9, 7);
    expect(calendarDays(anchor, "week")).toHaveLength(7);
    expect(calendarDays(anchor, "day")).toHaveLength(1);
    expect(calendarDays(anchor, "month")).toHaveLength(42);

    expect(
      shiftCalendarAnchor(
        anchor,
        "week",
        1,
      ).getDate(),
    ).toBe(14);
  });

  it("keeps general Section events visible while Course filters change", () => {
    expect(
      filterScheduleEvents(events, [
        "delivery-a",
      ]).map((event) => event.id),
    ).toEqual([
      "general",
      "course-a",
    ]);
  });

  it("groups by local calendar day and returns the next events in time order", () => {
    expect(
      eventsForDay(
        events,
        new Date(2026, 9, 6),
      ).map((event) => event.id),
    ).toEqual(["course-a"]);

    expect(
      upcomingScheduleEvents(
        events,
        new Date(2026, 9, 5, 9, 30),
        2,
      ).map((event) => event.id),
    ).toEqual([
      "general",
      "course-a",
    ]);
  });
});
