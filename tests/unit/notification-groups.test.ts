import { describe, expect, it } from "vitest";
import {
  groupNotificationsByDate,
  notificationDateLabel,
} from "@/modules/activity/notification-groups";

describe("shared notification time buckets", () => {
  const now = new Date("2026-10-10T00:10:00.000Z"); // 05:40 IST

  it("uses India-local calendar days, not UTC date", () => {
    expect(notificationDateLabel("2026-10-09T19:10:00.000Z", now))
      .toBe("Today"); // Oct 10, 00:40 IST
    expect(notificationDateLabel("2026-10-09T17:30:00.000Z", now))
      .toBe("Yesterday");
    expect(notificationDateLabel("2026-10-07T05:00:00.000Z", now))
      .toBe("This week");
    expect(notificationDateLabel("2026-09-28T05:00:00.000Z", now))
      .toBe("Earlier");
  });

  it("fails safely for invalid and future notification timestamps", () => {
    expect(notificationDateLabel("not-a-date", now)).toBe("Earlier");
    expect(notificationDateLabel("2027-01-01T00:00:00.000Z", now))
      .toBe("Earlier");
  });

  it("returns only nonempty buckets and preserves order within groups", () => {
    const rows = [
      { id: "today-a", createdAt: "2026-10-09T20:00:00.000Z" },
      { id: "yesterday", createdAt: "2026-10-09T16:30:00.000Z" },
      { id: "today-b", createdAt: "2026-10-09T18:40:00.000Z" },
    ];
    const groups = groupNotificationsByDate(rows, now);
    expect(groups.map((group) => group.label)).toEqual(["Today", "Yesterday"]);
    expect(groups[0]?.items.map((row) => row.id))
      .toEqual(["today-a", "today-b"]);
    expect(groups[1]?.items.map((row) => row.id)).toEqual(["yesterday"]);
  });
});
