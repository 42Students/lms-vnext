import { describe, expect, it } from "vitest";
import {
  classifyMentorTeamMember,
  mentorTeamHistoryHref,
  mentorTeamHistoryPage,
  mentorTeamHistoryQuerySchema,
} from "@/modules/projects/mentor-team-history-model";

const projectId = "00000000-0000-4000-8000-000000000001";
const base = { endedAt: null, membershipStatus: "ACTIVE", platformStatus: "ACTIVE" };
describe("Mentor team lifecycle read model", () => {
  it("separates current, formerly assigned and revoked access", () => {
    expect(classifyMentorTeamMember(base)).toBe("CURRENT");
    expect(classifyMentorTeamMember({...base,endedAt:new Date("2026-09-01T00:00:00Z")})).toBe("ENDED");
    expect(classifyMentorTeamMember({...base,membershipStatus:"SUSPENDED"})).toBe("INACTIVE");
    expect(classifyMentorTeamMember({...base,platformStatus:"DISABLED"})).toBe("INACTIVE");
  });
  it("bounds paging and empty states", () => {
    expect(mentorTeamHistoryPage(41,999)).toEqual({
      total:41,page:3,totalPages:3,pageSize:20,
    });
    expect(mentorTeamHistoryPage(0,2)).toEqual({
      total:0,page:1,totalPages:1,pageSize:20,
    });
  });
  it("rejects arbitrary tenant selectors, untrusted values and invalid ids", () => {
    expect(mentorTeamHistoryQuerySchema.safeParse({projectId}).success).toBe(true);
    expect(mentorTeamHistoryQuerySchema.safeParse({projectId,collegeId:projectId}).success).toBe(false);
    expect(mentorTeamHistoryQuerySchema.safeParse({projectId,view:"SUSPENDED"}).success).toBe(false);
    expect(mentorTeamHistoryQuerySchema.safeParse({projectId,primary:"OTHER"}).success).toBe(false);
    expect(mentorTeamHistoryQuerySchema.parse({projectId,primary:"PRIMARY"}).primary).toBe("PRIMARY");
    expect(mentorTeamHistoryQuerySchema.safeParse({projectId:"foo"}).success).toBe(false);
    expect(mentorTeamHistoryQuerySchema.safeParse({projectId,page:0}).success).toBe(false);
  });
  it("preserves pagination filters without leaking the tenant scope", () => {
    expect(mentorTeamHistoryHref(projectId,{view:"ENDED",primary:"PRIMARY",page:2})).toContain("primary=PRIMARY");
    expect(mentorTeamHistoryHref(projectId,{view:"ENDED",page:2}))
      .toBe("/mentor/projects/" + projectId + "/team-history?view=ENDED&page=2");
  });
});
