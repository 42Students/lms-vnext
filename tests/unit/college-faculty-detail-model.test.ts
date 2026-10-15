import { describe, expect, it } from "vitest";
import { collegeFacultyAssignmentHistoryQuerySchema, facultyTeachingAssignmentState } from "@/modules/people/college-faculty-detail-model";

describe("College Admin Faculty detail", () => {
  it("validates history filters and rejects attempts to select a different college", () => {
    expect(collegeFacultyAssignmentHistoryQuerySchema.parse({})).toEqual({status:"ALL",role:"ALL"});
    expect(collegeFacultyAssignmentHistoryQuerySchema.parse({status:"ENDED",role:"TA"})).toEqual({status:"ENDED",role:"TA"});
    expect(collegeFacultyAssignmentHistoryQuerySchema.safeParse({role:"VISITOR"}).success).toBe(false);
    expect(collegeFacultyAssignmentHistoryQuerySchema.safeParse({status:"ARCHIVED"}).success).toBe(false);
    expect(collegeFacultyAssignmentHistoryQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  });
  it("only calls an assignment active when both the assignment and delivery are active", () => {
    const now = new Date("2026-10-14T00:00:00.000Z");
    expect(facultyTeachingAssignmentState(null, null)).toBe("ACTIVE");
    expect(facultyTeachingAssignmentState(now, null)).toBe("ENDED");
    expect(facultyTeachingAssignmentState(null, now)).toBe("ENDED");
  });
});
