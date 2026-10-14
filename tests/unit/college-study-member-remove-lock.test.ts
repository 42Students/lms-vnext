import { describe, expect, it } from "vitest";
import { collegeStudyMemberLabel, collegeStudyMemberSchema } from "@/modules/groups/college-member-management-model";

describe("College Admin atomic remove and lock contract", () => {
  const membershipId = "40000000-0000-4000-8000-000000000004";
  it("requires explicit confirmation and optimistic member version", () => {
    const action = collegeStudyMemberSchema.parse({
      action: "REMOVE_AND_LOCK", membershipId, expectedVersion: 2, confirm: true,
    });
    expect(collegeStudyMemberLabel(action)).toContain("lock");
    expect(collegeStudyMemberSchema.safeParse({action:"REMOVE_AND_LOCK",membershipId,expectedVersion:0,confirm:true}).success).toBe(true);
    for (const candidate of [
      { action: "REMOVE_AND_LOCK", membershipId, expectedVersion: 2 },
      { action: "REMOVE_AND_LOCK", membershipId, expectedVersion: -1, confirm: true },
      { action: "REMOVE_AND_LOCK", membershipId, expectedVersion: 2, confirm: false },
      { action: "REMOVE_AND_LOCK", membershipId, expectedVersion: 2, confirm: true, collegeId: membershipId },
    ]) expect(collegeStudyMemberSchema.safeParse(candidate).success).toBe(false);
  });
});
