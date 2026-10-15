import { describe, it, expect } from "vitest";
import { lessonVisibilityCommandSchema, lessonVisibleToReader, mayEditLessonStudentVisibility } from "@/modules/courses/faculty-lesson-visibility-model";
const base = { lessonPublished: true, contentPublished: true, visibleToStudents: false, belongsToAssignedDelivery: true };
describe("faculty lesson visibility parity contract", () => {
  it("hides disabled content from students but not assigned teachers", () => {
    expect(lessonVisibleToReader({ ...base, role: "LEARNER" })).toBe(false);
    expect(lessonVisibleToReader({ ...base, role: "FACULTY" })).toBe(true);
    expect(lessonVisibleToReader({ ...base, role: "ADMIN" })).toBe(true);
  });
  it("does not give unassigned staff visibility", () => {
    expect(lessonVisibleToReader({ ...base, role: "FACULTY", belongsToAssignedDelivery: false })).toBe(false);
    expect(lessonVisibleToReader({ ...base, role: "LEARNER", visibleToStudents: true, belongsToAssignedDelivery: false })).toBe(false);
  });
  it("does not let Faculty mutate the administrator switch", () => {
    expect(mayEditLessonStudentVisibility("FACULTY")).toBe(false);
    expect(mayEditLessonStudentVisibility("ADMIN")).toBe(true);
    expect(lessonVisibilityCommandSchema.safeParse({ lessonContentId: "not-a-uuid", visibleToStudents: true, confirmed: true }).success).toBe(false);
  });
});
