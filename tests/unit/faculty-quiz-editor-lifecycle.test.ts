import { describe, expect, it } from "vitest";
import { facultyQuizDraftEditable } from "@/modules/courses/faculty-quiz-builder-model";

describe("Faculty quiz question editor lifecycle", () => {
  it("permits new and draft question/metadata changes only", () => {
    expect(facultyQuizDraftEditable(null)).toBe(true);
    expect(facultyQuizDraftEditable(undefined)).toBe(true);
    expect(facultyQuizDraftEditable("DRAFT")).toBe(true);
  });
  it("disables the editor for posted or attempt-bearing lifecycle states", () => {
    for (const status of ["PUBLISHED", "CLOSED", "ARCHIVED"]) {
      expect(facultyQuizDraftEditable(status)).toBe(false);
    }
  });
});
