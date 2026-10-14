import { describe, expect, it } from "vitest";
import {
  requiresStudentSectionMove, studentSectionMoveMessage, studentSectionMoveSchema,
} from "@/modules/academics/college-student-section-move-model";

const from = "0bad0000-0000-4000-8000-000000000001";
const to = "0bad0000-0000-4000-8000-000000000002";
const placement = "0bad0000-0000-4000-8000-000000000003";

describe("College student class move model", () => {
  it("requires an explicit current placement and confirmation", () => {
    expect(studentSectionMoveSchema.parse({
      sectionId: to, expectedSectionEnrollmentId: placement, confirm: true,
    })).toMatchObject({ sectionId: to });
    expect(studentSectionMoveSchema.safeParse({ sectionId: to, confirm: true }).success).toBe(false);
    expect(studentSectionMoveSchema.safeParse({
      sectionId: to, expectedSectionEnrollmentId: placement, confirm: false,
    }).success).toBe(false);
    expect(studentSectionMoveSchema.safeParse({
      sectionId: to, expectedSectionEnrollmentId: placement, confirm: true, collegeId: from,
    }).success).toBe(false);
  });
  it("refuses a no-op and clearly describes the irreversible old-placement transition", () => {
    expect(requiresStudentSectionMove(from, from)).toBe(false);
    expect(requiresStudentSectionMove(from, to)).toBe(true);
    expect(studentSectionMoveMessage("Learner", "B"))
      .toContain("previous class placement will be marked MOVED");
  });
});
