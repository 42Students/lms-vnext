import { describe, expect, it } from "vitest";
import { tpoOwnNotificationQuerySchema, tpoMarkOwnNotificationSchema,
  filterTpoOwnNotificationStatus } from "@/modules/placements/tpo-own-notification-model";
const id = "10000000-0000-4000-8000-000000000001";
describe("TPO own notification filters and mark-read", () => {
  it("accepts only authorized filter shapes", () => {
    expect(tpoOwnNotificationQuerySchema.parse({})).toEqual({ status: "ALL", q: "", page: 1 });
    expect(tpoOwnNotificationQuerySchema.parse({ status: "UNREAD", q: "offer", page: "2" }))
      .toEqual({ status: "UNREAD", q: "offer", page: 2 });
    expect(tpoOwnNotificationQuerySchema.safeParse({ status: "SENT" }).success).toBe(false);
    expect(tpoOwnNotificationQuerySchema.safeParse({ collegeId: id }).success).toBe(false);
  });
  it("distinguishes read and unread without inferring deliveries", () => {
    expect(filterTpoOwnNotificationStatus("ALL", null)).toBe(true);
    expect(filterTpoOwnNotificationStatus("UNREAD", null)).toBe(true);
    expect(filterTpoOwnNotificationStatus("READ", null)).toBe(false);
    expect(filterTpoOwnNotificationStatus("READ", new Date())).toBe(true);
  });
  it("requires explicit confirmation and an owned UUID", () => {
    expect(tpoMarkOwnNotificationSchema.safeParse({ confirmed: true, expectedUnread: true,
      notificationId: id }).success).toBe(true);
    expect(tpoMarkOwnNotificationSchema.safeParse({ confirmed: false, expectedUnread: true,
      notificationId: id }).success).toBe(false);
    expect(tpoMarkOwnNotificationSchema.safeParse({ confirmed: true, expectedUnread: false,
      notificationId: id }).success).toBe(false);
    expect(tpoMarkOwnNotificationSchema.safeParse({ confirmed: true, expectedUnread: true,
      notificationId: id, userId: id }).success).toBe(false);
  });
});
