import { describe, expect, it } from "vitest";
import { facultyChangeQuizChoiceType, facultyQuizDraftIssue } from "@/modules/courses/faculty-quiz-builder-model";

const question = {
  type: "MULTIPLE_CHOICE" as const,
  prompt: "Which?",
  points: 2,
  sequence: 0,
  options: [
    { text: "A", correct: true, sequence: 0 },
    { text: "B", correct: true, sequence: 1 },
    { text: "C", correct: false, sequence: 2 },
  ],
};

describe("Faculty Quiz question type conversion", () => {
  it("keeps only the first correct choice when switching to single", () => {
    const changed = facultyChangeQuizChoiceType(question, "SINGLE_CHOICE");
    expect(changed.options.map(o => o.correct)).toEqual([true, false, false]);
    expect(facultyQuizDraftIssue("Lesson check", [changed])).toBeNull();
    expect(question.options.map(o => o.correct)).toEqual([true, true, false]);
  });
  it("chooses a first answer if none is yet selected", () => {
    const changed = facultyChangeQuizChoiceType({
      ...question,
      options: question.options.map(o => ({ ...o, correct: false })),
    }, "SINGLE_CHOICE");
    expect(changed.options.map(o => o.correct)).toEqual([true, false, false]);
  });
  it("preserves multi-choice correctness without mutating the source", () => {
    const changed = facultyChangeQuizChoiceType(question, "MULTIPLE_CHOICE");
    expect(changed.options.filter(o => o.correct)).toHaveLength(2);
    expect(changed).not.toBe(question);
  });
});
