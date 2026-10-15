import { describe, expect, it } from "vitest";
import { lessonVisibleToReader } from "@/modules/courses/faculty-lesson-visibility-model";
describe("staged Faculty-admin content visibility", () => {
  it("retains legacy public default and masks hidden rows from learners", () => {
    expect(lessonVisibleToReader({ role: "LEARNER",lessonPublished: true,contentPublished: true,visibleToStudents: true,belongsToAssignedDelivery:true })).toBe(true);
    expect(lessonVisibleToReader({ role: "LEARNER",lessonPublished: true,contentPublished: true,visibleToStudents: false,belongsToAssignedDelivery:true })).toBe(false);
  });
});
