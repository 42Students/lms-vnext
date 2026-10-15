import { describe, expect, it } from "vitest";
import { collegeJoinViewState, publicCollegeJoinCodeSchema, publicCollegeJoinTokenSchema, workEmailDomain } from "@/modules/placements/public-college-join-model";

describe("public college join guards", () => {
  it("requires opaque bounded tokens and exact six digit verification codes", () => {
    expect(publicCollegeJoinTokenSchema.safeParse("a".repeat(32)).success).toBe(true);
    expect(publicCollegeJoinTokenSchema.safeParse("../another-college").success).toBe(false);
    expect(publicCollegeJoinTokenSchema.safeParse("short").success).toBe(false);
    expect(publicCollegeJoinCodeSchema.safeParse("012345").success).toBe(true);
    expect(publicCollegeJoinCodeSchema.safeParse("12345").success).toBe(false);
  });
  it("uses a bounded work-email domain and does not claim a verified company", () => {
    expect(workEmailDomain(" Recruiter@Example.COM ")).toBe("example.com");
    expect(workEmailDomain("person@gmail.com")).toBeNull();
    expect(workEmailDomain("not-an-email")).toBeNull();
  });
  it("never shows an already-joined result for invalid or unavailable links", () => {
    expect(collegeJoinViewState({ validToken: false, invitationAvailable: true, alreadyJoined: true })).toBe("INVALID_LINK");
    expect(collegeJoinViewState({ validToken: true, invitationAvailable: false, alreadyJoined: true })).toBe("UNAVAILABLE");
    expect(collegeJoinViewState({ validToken: true, invitationAvailable: true, alreadyJoined: true })).toBe("ALREADY_JOINED");
  });
});
