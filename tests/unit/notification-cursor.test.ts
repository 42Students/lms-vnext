import { describe, expect, it } from "vitest";
import { parseNotificationCursor } from "@/modules/activity/notification-cursor";

describe("W06 notification cursor validation", () => {
  const id = "10000000-0000-4000-8000-000000000001";

  it("accepts fresh inbox requests without a cursor", () => {
    expect(parseNotificationCursor({})).toEqual({ cursor: null, invalid: false });
  });

  it("rejects incomplete, malformed and external cursors", () => {
    expect(parseNotificationCursor({ beforeId: id }).invalid).toBe(true);
    expect(parseNotificationCursor({
      beforeCreatedAt: "2026-10-10T09:00:00.000Z",
    }).invalid).toBe(true);
    expect(parseNotificationCursor({
      beforeCreatedAt: "invalid", beforeId: id,
    }).invalid).toBe(true);
    expect(parseNotificationCursor({
      beforeCreatedAt: "2026-10-10T09:00:00.000Z",
      beforeId: "not-an-id",
    }).invalid).toBe(true);
  });

  it("parses an ISO cursor without losing its exact instant or UUID", () => {
    const parsed = parseNotificationCursor({
      beforeCreatedAt: "2026-10-10T14:30:00.000+05:30",
      beforeId: id,
    });
    expect(parsed.invalid).toBe(false);
    expect(parsed.cursor?.beforeCreatedAt.toISOString())
      .toBe("2026-10-10T09:00:00.000Z");
    expect(parsed.cursor?.beforeId).toBe(id);
  });
});
