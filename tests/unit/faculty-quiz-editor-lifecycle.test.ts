import { facultyQuizMetadataEditable } from "@/modules/courses/faculty-quiz-builder-model";
import { facultyQuizCommandSchema } from "@/modules/courses/faculty-quiz-authoring-model";
import { describe, expect, it } from "vitest";
import { facultyQuizDraftEditable } from "@/modules/courses/faculty-quiz-builder-model";

describe("Faculty quiz question editor lifecycle", () => {
  it("permits new and draft question/metadata changes only", () => {
    expect(facultyQuizDraftEditable(null)).toBe(true);
    expect(facultyQuizDraftEditable(undefined)).toBe(true);
    expect(facultyQuizDraftEditable("DRAFT")).toBe(true);
  });
  it("disables question editing for posted or attempt-bearing lifecycle states", () => {
    for (const status of ["PUBLISHED", "CLOSED", "ARCHIVED"]) {
      expect(facultyQuizDraftEditable(status)).toBe(false);
    }
  });
});

describe("published Faculty Quiz metadata-only authoring",()=>{
  it("permits title/description/deadline edits on published and closed quizzes",()=>{
    expect(facultyQuizMetadataEditable("PUBLISHED")).toBe(true);
    expect(facultyQuizMetadataEditable("CLOSED")).toBe(true);
    expect(facultyQuizMetadataEditable("ARCHIVED")).toBe(false);
    const input={
      action:"EDIT",quizId:"11111111-1111-4111-8111-111111111111",
      expectedUpdatedAt:"2026-10-15T02:00:00.000Z",confirmed:true,
      title:"Updated instructions",description:"New guidance",dueAt:null,maxAttempts:2,
    };
    expect(facultyQuizCommandSchema.safeParse(input).success).toBe(true);
    expect(facultyQuizCommandSchema.safeParse({...input,questions:[]}).success).toBe(false);
  });
});
