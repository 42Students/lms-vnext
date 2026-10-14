import { describe, expect, it } from "vitest";
import { collegeStudyMemberLabel, collegeStudyMemberSchema } from "@/modules/groups/college-member-management-model";

describe("College Admin study-group member actions", () => {
  const id = "40000000-0000-4000-8000-000000000004";
  it("accepts precisely scoped add, remove and lock input", () => {
    expect(collegeStudyMemberSchema.parse({ action: "ADD", membershipId: id })).toEqual({
      action: "ADD", membershipId: id,
    });
    expect(collegeStudyMemberSchema.parse({
      action: "LOCK", membershipId: id, locked: true,
    })).toMatchObject({ locked: true });
    expect(collegeStudyMemberLabel({ action: "REMOVE", membershipId: id })).toMatch(/Remove/);
  });
  it("denies foreign scope fields, invalid UUID, wrong action and missing boolean", () => {
    for (const input of [
      { action: "ADD", membershipId: id, collegeId: "foreign" },
      { action: "REMOVE", membershipId: "bad" },
      { action: "LOCK", membershipId: id, locked: "yes" },
      { action: "LOCK", membershipId: id },
      { action: "EDIT", membershipId: id },
    ]) expect(collegeStudyMemberSchema.safeParse(input).success).toBe(false);
  });
});
