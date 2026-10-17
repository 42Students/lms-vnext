import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { facultyAssessmentVisibleToDelivery } from "@/modules/courses/faculty-assessment-batch-model";

const source = readFileSync("src/modules/courses/faculty-assessment-service.ts","utf8");

describe("FAC-assessments-R04 faculty assessment listing cost and ownership",()=>{
  it("FAC-assessments-R04 rejects sibling section records while retaining shared and own records",()=>{
    const own="11111111-1111-4111-8111-111111111111";
    const other="22222222-2222-4222-8222-222222222222";
    expect(facultyAssessmentVisibleToDelivery({deliveryId:null},own)).toBe(true);
    expect(facultyAssessmentVisibleToDelivery({deliveryId:own},own)).toBe(true);
    expect(facultyAssessmentVisibleToDelivery({deliveryId:other},own)).toBe(false);
  });
  it("FAC-assessments-R04 reads only authorized teaching offerings in bounded batches, without full authoring workspaces",()=>{
    expect(source).toContain("listFacultyCourseDeliveries(context)");
    expect(source).toContain("inArray(courseLearningPaths.offeringId, offeringIds)");
    expect(source).toContain("inArray(courseAssignments.deliveryId, deliveryIds)");
    expect(source).toContain("inArray(courseQuizzes.deliveryId, deliveryIds)");
    expect(source).toContain("facultyAssessmentVisibleToDelivery(item, course.deliveryId)");
    expect(source).not.toContain("getFacultyCourseWorkspace");
    expect(source).toContain("Promise.all([");
    expect(source).toContain("if (courses.length === 0) return empty");
    expect(source).toContain('ne(courseAssignments.status, "ARCHIVED")');
  });
});
