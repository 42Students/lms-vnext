import { describe, expect, it } from "vitest";
import { createCourseTeachingAssignmentInputSchema } from "@/modules/courses/validation";
import { teachingAssignmentConflict } from "@/modules/courses/teaching-assignment-guard";

const deliveryId = "11111111-1111-4111-8111-111111111111";
const membershipId = "22222222-2222-4222-8222-222222222222";
const otherMembership = "33333333-3333-4333-8333-333333333333";

describe("College Admin Faculty assignment guards", () => {
  it("rejects untrusted college fields, invalid roles and malformed UUIDs", () => {
    expect(createCourseTeachingAssignmentInputSchema.parse({
      deliveryId, membershipId, role: "PRIMARY",
    })).toEqual({ deliveryId, membershipId, role: "PRIMARY" });
    for (const input of [
      { deliveryId, membershipId, role: "PRIMARY", collegeId: otherMembership },
      { deliveryId, membershipId, role: "ADMIN" },
      { deliveryId: "wrong", membershipId, role: "PRIMARY" },
      { deliveryId, membershipId: "wrong", role: "TA" },
    ]) {
      expect(createCourseTeachingAssignmentInputSchema.safeParse(input).success).toBe(false);
    }
  });

  it("allows first primary or co-teacher, denies second primary", () => {
    expect(teachingAssignmentConflict({
      membershipId, role: "PRIMARY",
    }, [])).toBeNull();
    expect(teachingAssignmentConflict({
      membershipId: otherMembership, role: "CO_TEACHER",
    }, [{ membershipId, role: "PRIMARY" }])).toBeNull();
    expect(teachingAssignmentConflict({
      membershipId: otherMembership, role: "PRIMARY",
    }, [{ membershipId, role: "PRIMARY" }])).toBe("PRIMARY_TEACHER_CONFLICT");
  });

  it("denies the same member being assigned multiple live roles or duplicate rows", () => {
    expect(teachingAssignmentConflict({
      membershipId, role: "TA",
    }, [{ membershipId, role: "PRIMARY" }])).toBe("TEACHING_ASSIGNMENT_CONFLICT");
    expect(teachingAssignmentConflict({
      membershipId, role: "CO_TEACHER",
    }, [{ membershipId, role: "CO_TEACHER" }])).toBe("TEACHING_ASSIGNMENT_CONFLICT");
  });
});
