import { describe, expect, it } from "vitest";
import { collegeFacultyAssignmentHistoryQuerySchema, facultyTeachingAssignmentState } from "@/modules/people/college-faculty-detail-model";

describe("College Admin Faculty detail", () => {
  it("only calls an assignment active when both the assignment and delivery are active", () => {
    const now = new Date("2026-10-14T00:00:00.000Z");
    expect(facultyTeachingAssignmentState(null, null)).toBe("ACTIVE");
    expect(facultyTeachingAssignmentState(now, null)).toBe("ENDED");
    expect(facultyTeachingAssignmentState(null, now)).toBe("ENDED");
  });
});
