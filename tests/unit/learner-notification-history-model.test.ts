import { describe, expect, it } from "vitest";
import {
  learnerNotificationHistoryEmptyState,
  learnerNotificationHistoryHref,
  learnerNotificationHistoryQuerySchema,
} from "@/modules/activity/learner-notification-history-model";

describe("Learner notification history cursor", () => {
  it("requires a complete and typed stable keyset cursor", () => {
    const query = {
      unread: "1",
      beforeAt: "2026-10-01T00:00:00.000Z",
      beforeId: "11111111-1111-4111-8111-111111111111",
    };
    expect(learnerNotificationHistoryQuerySchema.parse(query)).toEqual(query);
    expect(learnerNotificationHistoryQuerySchema.safeParse({ beforeAt: query.beforeAt }).success).toBe(false);
    expect(learnerNotificationHistoryQuerySchema.safeParse({ beforeId: query.beforeId }).success).toBe(false);
    expect(learnerNotificationHistoryQuerySchema.safeParse({ ...query, beforeId: "not-an-id" }).success).toBe(false);
    expect(learnerNotificationHistoryQuerySchema.safeParse({ ...query, unread: "all" }).success).toBe(false);
    expect(learnerNotificationHistoryQuerySchema.safeParse({ memberId: query.beforeId }).success).toBe(false);
  });

  it("encodes the persisted cursor without reinterpreting its UTC instant", () => {
    const at = new Date("2026-09-30T18:40:00.000Z"); // October 1, 00:10 IST
    const href = learnerNotificationHistoryHref({
      beforeCreatedAt: at,
      beforeId: "11111111-1111-4111-8111-111111111111",
    }, true);
    const url = new URL(href, "https://lms.example");
    expect(url.pathname).toBe("/learn/notifications/history");
    expect(url.searchParams.get("beforeAt")).toBe("2026-09-30T18:40:00.000Z");
    expect(url.searchParams.get("unread")).toBe("1");
    expect(url.searchParams.get("beforeId")).toBe("11111111-1111-4111-8111-111111111111");
    expect(learnerNotificationHistoryHref(null, false)).toBe("/learn/notifications/history");
  });

  it("distinguishes filtered empties and exhausted older pages", () => {
    expect(learnerNotificationHistoryEmptyState(1, false, false)).toBeNull();
    expect(learnerNotificationHistoryEmptyState(0, true, true)).toContain("older");
    expect(learnerNotificationHistoryEmptyState(0, false, true)).toContain("unread");
    expect(learnerNotificationHistoryEmptyState(0, false, false)).toContain("No personal");
  });
});
