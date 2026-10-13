import { describe, expect, it } from "vitest";
import { parseLearnerQuizDraft } from "@/modules/courses/learner-quiz-draft";

describe("learner quiz session draft", () => {
  it("restores answers and current question together", () => {
    expect(parseLearnerQuizDraft(JSON.stringify({
      answers: { "q1": ["a1", "a2"], "q2": ["b1"] },
      step: 1,
    }), 3)).toEqual({
      answers: { q1: ["a1", "a2"], q2: ["b1"] },
      step: 1,
    });
  });
  it("fails closed for corrupt or non-object drafts", () => {
    expect(parseLearnerQuizDraft("{broken", 4)).toEqual({ answers: {}, step: 0 });
    expect(parseLearnerQuizDraft("[]", 4)).toEqual({ answers: {}, step: 0 });
    expect(parseLearnerQuizDraft(null, 4)).toEqual({ answers: {}, step: 0 });
  });
  it("discards stale step indexes when a quiz's question count changes", () => {
    expect(parseLearnerQuizDraft('{"step":5,"answers":{"q1":["a"]}}',2))
      .toEqual({ step: 0, answers: { q1: ["a"] } });
  });
  it("ignores invalid selected values and duplicate options", () => {
    expect(parseLearnerQuizDraft('{"step":0,"answers":{"q1":["a",5,"a",null]}}',1).answers)
      .toEqual({ q1: ["a"] });
  });
});
