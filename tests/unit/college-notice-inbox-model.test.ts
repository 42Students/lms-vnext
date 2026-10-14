import { describe, expect, it } from "vitest";
import { collegeNoticeInboxProjection, collegeNoticeInboxQuerySchema }
  from "@/modules/announcements/college-notice-inbox-model";

describe("College notice inbox read-only projection", () => {
  it("requires no client-selected user or college scope", () => {
    expect(collegeNoticeInboxQuerySchema.parse({})).toEqual({unreadOnly:"0"});
    expect(collegeNoticeInboxQuerySchema.parse({unreadOnly:"1"})).toEqual({unreadOnly:"1"});
    expect(collegeNoticeInboxQuerySchema.safeParse({unreadOnly:"true"}).success).toBe(false);
    expect(collegeNoticeInboxQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  });
  it("serializes persisted dates and distinguishes unread from missing notices", () => {
    expect(collegeNoticeInboxProjection([])).toEqual([]);
    const date = new Date("2026-10-14T12:30:00.000Z");
    expect(collegeNoticeInboxProjection([{
      id: "notice", title: "Session changed", body: "Room updated",
      actionHref: null, createdAt: date, readAt: null,
    }])).toEqual([{
      id: "notice", title: "Session changed", body: "Room updated",
      actionHref: null, createdAt: "2026-10-14T12:30:00.000Z", readAt: null,
    }]);
  });
});
