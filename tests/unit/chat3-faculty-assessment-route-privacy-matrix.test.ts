import { describe, expect, it } from "vitest";
import {
  facultyAssignmentReportHidden, facultyQuizReportHidden,
  parseFacultyAssessmentReportRoute,
} from "@/modules/courses/faculty-assessment-route-boundary";
import {
  facultyAssignmentGradePublicationAllowed, facultyAssignmentGradingAllowed,
} from "@/modules/courses/faculty-assignment-grading-policy";
import {
  lessonVisibilityCommandSchema, lessonVisibleToReader, mayEditLessonStudentVisibility,
} from "@/modules/courses/faculty-lesson-visibility-model";
import { CoursesServiceError } from "@/modules/courses/errors";

const own = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
describe("FAC-ASSESSMENT-ROUTE-PRIVACY-01 Faculty and learner report surfaces", () => {
  it("only accepts a UUID assessment and optional exact delivery ID from the URL", () => {
    expect(parseFacultyAssessmentReportRoute(own, {})).toEqual({
      assessmentId: own, deliveryId: null,
    });
    expect(parseFacultyAssessmentReportRoute(own, { deliveryId: other })).toEqual({
      assessmentId: own, deliveryId: other,
    });
    for (const [id, query] of [
      ["invalid", {}],
      [own, { collegeId: other }],
      [own, { deliveryId: [own, other] }],
      [own, { deliveryId: "bad" }],
      [own, { role: "SUPER_ADMIN" }],
      [own, { deliveryId: null }],
    ] as const) {
      expect(parseFacultyAssessmentReportRoute(id, query)).toBeNull();
    }
  });

  it("hides a revoked assignment/quiz/teaching Section as private not-found, not a database outage", () => {
    for (const code of [
      "SECTION_DELIVERY_NOT_FOUND", "FACULTY_TEACHING_SCOPE_REQUIRED",
      "LEARNING_ACCESS_DENIED",
    ] as const) {
      const error = new CoursesServiceError(code);
      expect(facultyAssignmentReportHidden(error)).toBe(true);
      expect(facultyQuizReportHidden(error)).toBe(true);
    }
    expect(facultyAssignmentReportHidden(new CoursesServiceError("ASSIGNMENT_NOT_FOUND"))).toBe(true);
    expect(facultyQuizReportHidden(new CoursesServiceError("QUIZ_NOT_FOUND"))).toBe(true);
    expect(facultyQuizReportHidden(new CoursesServiceError("ASSIGNMENT_NOT_FOUND"))).toBe(false);
    expect(facultyAssignmentReportHidden(new CoursesServiceError("QUIZ_NOT_FOUND"))).toBe(false);
    expect(facultyAssignmentReportHidden(new Error("SQL unavailable"))).toBe(false);
    expect(facultyQuizReportHidden(new Error("SQL unavailable"))).toBe(false);
  });

  it("only grades published assignments with finite whole points in assigned grading range", () => {
    expect(facultyAssignmentGradingAllowed("PUBLISHED", 8, 10)).toBe(true);
    expect(facultyAssignmentGradingAllowed("PUBLISHED", 0, 10)).toBe(true);
    for (const [status, points, max] of [
      ["DRAFT", 8, 10], ["ARCHIVED", 8, 10],
      ["PUBLISHED", -1, 10], ["PUBLISHED", 11, 10],
      ["PUBLISHED", 1.5, 10], ["PUBLISHED", NaN, 10],
      ["PUBLISHED", 1, Infinity], ["PUBLISHED", 1, -1],
    ] as const) {
      expect(facultyAssignmentGradingAllowed(status, points, max)).toBe(false);
    }
    expect(facultyAssignmentGradePublicationAllowed("PUBLISHED", "GRADED")).toBe(true);
    expect(facultyAssignmentGradePublicationAllowed("DRAFT", "GRADED")).toBe(false);
    expect(facultyAssignmentGradePublicationAllowed("PUBLISHED", "NOT_GRADED")).toBe(false);
  });

  it("never turns the Faculty visibility read role into shared lesson publication permission", () => {
    const entry = {
      lessonPublished: false, contentPublished: false,
      visibleToStudents: false, belongsToAssignedDelivery: true,
    };
    expect(lessonVisibleToReader({ ...entry, role: "FACULTY" })).toBe(true);
    expect(lessonVisibleToReader({ ...entry, role: "LEARNER" })).toBe(false);
    expect(lessonVisibleToReader({ ...entry, role: "ADMIN" })).toBe(true);
    expect(lessonVisibleToReader({
      ...entry, role: "FACULTY", belongsToAssignedDelivery: false,
    })).toBe(false);
    expect(lessonVisibleToReader({
      ...entry, role: "LEARNER", lessonPublished: true, contentPublished: true,
      visibleToStudents: true,
    })).toBe(true);
    expect(mayEditLessonStudentVisibility("FACULTY")).toBe(false);
    expect(mayEditLessonStudentVisibility("LEARNER")).toBe(false);
    expect(mayEditLessonStudentVisibility("ADMIN")).toBe(true);
  });

  it("requires explicit administrative confirmation, exact content ID and optimistic ISO version", () => {
    expect(lessonVisibilityCommandSchema.safeParse({
      lessonContentId: own, visibleToStudents: true,
      expectedUpdatedAt: "2099-01-01T00:00:00.000+05:30", confirmed: true,
    }).success).toBe(true);
    for (const raw of [
      { lessonContentId: own, visibleToStudents: true, expectedUpdatedAt: "2099-01-01T00:00:00Z" },
      { lessonContentId: own, visibleToStudents: "true", confirmed: true, expectedUpdatedAt: "bad" },
      { lessonContentId: "invalid", visibleToStudents: true, confirmed: true, expectedUpdatedAt: "2099-01-01T00:00:00Z" },
      { lessonContentId: own, visibleToStudents: true, confirmed: true, expectedUpdatedAt: "2099-01-01T00:00:00Z", collegeId: other },
    ]) {
      expect(lessonVisibilityCommandSchema.safeParse(raw).success).toBe(false);
    }
  });
});
