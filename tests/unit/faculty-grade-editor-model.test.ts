import { describe, expect, it } from "vitest";
import { facultyGradeEditorState } from "@/modules/courses/faculty-grade-editor-model";

const saved = {gradingStatus:"GRADED", pointsAwarded:0, feedback:null, gradePublished:false};
describe("Faculty grade editor publication", () => {
  it("distinguishes a deliberate zero from an empty or invalid score", () => {
    expect(facultyGradeEditorState(saved,"0","",10).canPublish).toBe(true);
    for (const value of ["", " ", "-1", "11", "1.5", "NaN", "Infinity"]) {
      const state = facultyGradeEditorState(saved,value,"",10);
      expect(state.points).toBeNull();
      expect(state.canPublish).toBe(false);
    }
  });
  it("requires draft score and feedback to match the saved values before publication", () => {
    const graded = {...saved, pointsAwarded:7, feedback:"Good work"};
    expect(facultyGradeEditorState(graded,"7"," Good work ",10).canPublish).toBe(true);
    expect(facultyGradeEditorState(graded,"8","Good work",10).canPublish).toBe(false);
    expect(facultyGradeEditorState(graded,"7","Changed",10).canPublish).toBe(false);
    expect(facultyGradeEditorState(graded,"7","Changed",10).hasChanges).toBe(true);
  });
  it("does not publish ungraded or already published submissions", () => {
    expect(facultyGradeEditorState({...saved,gradingStatus:"NOT_GRADED"},"0","",10).canPublish).toBe(false);
    expect(facultyGradeEditorState({...saved,gradePublished:true},"0","",10).canPublish).toBe(false);
  });
});
