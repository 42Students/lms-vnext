import { describe, expect, it } from "vitest";

import {
  groupPlacementCalendarEvents,
  placementCalendarDayKey,
  placementCalendarWindow,
  sortPlacementCalendarEvents,
  summarizePlacementCalendar,
  type PlacementCalendarEvent,
} from "@/modules/placements/placement-calendar-model";

function event(
  id: string,
  kind: PlacementCalendarEvent["kind"],
  startsAt: string,
  completedAt: string | null = null,
): PlacementCalendarEvent {
  return {
    id,
    kind,
    startsAt: new Date(startsAt),
    title: id,
    companyId: null,
    companyName: "Synthetic Company",
    jobId: null,
    jobTitle: null,
    roundId: null,
    roundKind: null,
    leadId: null,
    followupId: null,
    status: completedAt ? "DONE" : "OPEN",
    timezone: null,
    venue: null,
    note: null,
    completedAt: completedAt ? new Date(completedAt) : null,
  };
}

describe("Placement calendar India-local grouping", () => {
  it("uses Asia/Kolkata instead of UTC or server-local dates", () => {
    expect(
      placementCalendarDayKey(new Date("2026-10-14T18:29:59.999Z")),
    ).toBe("2026-10-14");

    expect(
      placementCalendarDayKey(new Date("2026-10-14T18:30:00.000Z")),
    ).toBe("2026-10-15");
  });

  it("sorts events without mutating the original array", () => {
    const original = [
      event("later", "FOLLOW_UP", "2026-10-15T10:00:00Z"),
      event("earlier", "ROUND", "2026-10-14T10:00:00Z"),
    ];

    const sorted = sortPlacementCalendarEvents(original);

    expect(sorted.map((item) => item.id)).toEqual(["earlier", "later"]);
    expect(original.map((item) => item.id)).toEqual(["later", "earlier"]);
  });

  it("groups and sorts mixed events on India-local days", () => {
    const groups = groupPlacementCalendarEvents([
      event("next-day", "FOLLOW_UP", "2026-10-14T18:30:00Z"),
      event("first", "ROUND", "2026-10-14T05:00:00Z"),
      event("second", "APPLICATION_DEADLINE", "2026-10-14T12:00:00Z"),
    ]);

    expect(groups.map((group) => group.day)).toEqual([
      "2026-10-14",
      "2026-10-15",
    ]);
    expect(groups[0]?.events.map((item) => item.id)).toEqual([
      "first",
      "second",
    ]);
    expect(groups[1]?.events.map((item) => item.id)).toEqual(["next-day"]);
  });

  it("returns an empty grouping for an empty calendar", () => {
    expect(groupPlacementCalendarEvents([])).toEqual([]);
  });
});

describe("Placement calendar view windows", () => {
  it("uses legacy Sunday-first TPO week boundaries", () => {
    const window = placementCalendarWindow("2026-10-14", "week");

    expect(window.from).toBe("2026-10-11");
    expect(window.to).toBe("2026-10-17");
    expect(window.days).toHaveLength(7);
    expect(window.days[0]).toBe("2026-10-11");
    expect(window.days[6]).toBe("2026-10-17");
  });

  it("includes adjacent month days in a 42-day grid", () => {
    const window = placementCalendarWindow("2026-10-14", "month");

    expect(window.from).toBe("2026-09-27");
    expect(window.to).toBe("2026-11-07");
    expect(window.days).toHaveLength(42);
    expect(window.days[0]).toBe(window.from);
    expect(window.days[41]).toBe(window.to);
  });

  it("uses the selected day and inclusive 30-day TPO agenda window", () => {
    const window = placementCalendarWindow("2026-02-14", "agenda");

    expect(window).toEqual({
      from: "2026-02-14",
      to: "2026-03-16",
      days: [],
    });
  });

  it("handles leap-year month boundaries", () => {
    const window = placementCalendarWindow("2028-02-29", "agenda");

    expect(window.to).toBe("2028-03-30");
  });
});

describe("Placement calendar summary", () => {
  const now = new Date("2026-10-14T09:00:00.000Z");

  it("counts each persisted event type once", () => {
    const events = [
      event("round", "ROUND", "2026-10-14T11:00:00Z"),
      event("deadline", "APPLICATION_DEADLINE", "2026-10-15T11:00:00Z"),
      event("followup", "FOLLOW_UP", "2026-10-16T11:00:00Z"),
    ];

    const summary = summarizePlacementCalendar(events, now);

    expect(summary).toMatchObject({
      total: 3,
      rounds: 1,
      deadlines: 1,
      followups: 1,
    });

    expect(summary.next?.id).toBe("round");
  });

  it("ignores completed follow-ups when finding the next action", () => {
    const events = [
      event(
        "done",
        "FOLLOW_UP",
        "2026-10-14T10:00:00Z",
        "2026-10-14T08:00:00Z",
      ),
      event("open", "FOLLOW_UP", "2026-10-14T12:00:00Z"),
    ];

    const summary = summarizePlacementCalendar(events, now);

    expect(summary.followups).toBe(2);
    expect(summary.next?.id).toBe("open");
  });

  it("returns null when no upcoming event exists", () => {
    const summary = summarizePlacementCalendar(
      [event("past", "ROUND", "2026-10-01T10:00:00Z")],
      now,
    );

    expect(summary.next).toBeNull();
  });
});
