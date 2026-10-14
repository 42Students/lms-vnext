import { describe, expect, it } from "vitest";
import {
  mentorInboxPageHref, mentorInboxQuerySchema, resolveMentorInboxQuery,
} from "@/modules/activity/mentor-notifications-model";

const id="00000000-0000-4000-8000-000000000001";
const at="2026-10-14T04:30:00.000Z";
describe("Mentor own inbox pagination",() => {
  it("accepts only all/unread filters and no caller-owned tenant selector",() => {
    expect(mentorInboxQuerySchema.safeParse({view:"all"}).success).toBe(true);
    expect(mentorInboxQuerySchema.safeParse({view:"unread"}).success).toBe(true);
    expect(mentorInboxQuerySchema.safeParse({view:"filtered"}).success).toBe(false);
    expect(mentorInboxQuerySchema.safeParse({collegeId:id}).success).toBe(false);
    expect(mentorInboxQuerySchema.safeParse({userId:id}).success).toBe(false);
  });
  it("accepts a complete valid cursor in the selected inbox",() => {
    const result=resolveMentorInboxQuery({
      view:"unread",beforeCreatedAt:at,beforeId:id,
    });
    expect(result.cursor.invalid).toBe(false);
    expect(result.cursor.cursor?.beforeCreatedAt.toISOString()).toBe(at);
    expect(mentorInboxPageHref(result.query.view,result.cursor.cursor??undefined))
      .toBe("/mentor/notifications?view=unread&beforeCreatedAt="+
        encodeURIComponent(at)+"&beforeId="+id);
  });
  it("fails closed on incomplete or forged pagination",() => {
    expect(resolveMentorInboxQuery({beforeId:id}).cursor.invalid).toBe(true);
    expect(resolveMentorInboxQuery({beforeCreatedAt:at}).cursor.invalid).toBe(true);
    expect(resolveMentorInboxQuery({beforeCreatedAt:"not-a-date",beforeId:id}).cursor.invalid).toBe(true);
    expect(resolveMentorInboxQuery({beforeCreatedAt:at,beforeId:"invalid"}).cursor.invalid).toBe(true);
    expect(mentorInboxPageHref("all")).toBe("/mentor/notifications?view=all");
  });
});
