import { describe, expect, it } from "vitest";
import {
  mentorInboxPageHref, mentorInboxQuerySchema, resolveMentorInboxQuery,
} from "@/modules/activity/mentor-notifications-model";

const id="00000000-0000-4000-8000-000000000001";
describe("Mentor notification strict selectors and scoped page links",()=>{
  it("rejects an injected foreign college on read and mark-read navigation",()=>{
    expect(mentorInboxQuerySchema.safeParse({view:"all",collegeId:id}).success).toBe(false);
    expect(mentorInboxQuerySchema.safeParse({view:"unread",membershipId:id}).success).toBe(false);
    expect(resolveMentorInboxQuery({view:"unread"}).cursor.invalid).toBe(false);
    expect(mentorInboxPageHref("unread")).toBe("/mentor/notifications?view=unread");
  });
});
