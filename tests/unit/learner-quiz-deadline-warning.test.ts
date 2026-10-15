import { describe, expect, it } from "vitest";
import { learnerQuizDeadlineWarning } from "@/modules/courses/learner-quiz-deadline-warning-model";
const now=Date.parse("2026-10-15T10:00:00Z");
describe("learner quiz approaching deadline cue",()=>{
  it("warns during the last ten minutes only for actionable quizzes",()=>{
    expect(learnerQuizDeadlineWarning("2026-10-15T10:10:00Z",now,true)).toContain("10 minutes");
    expect(learnerQuizDeadlineWarning("2026-10-15T10:00:30Z",now,true)).toContain("1 minute");
    expect(learnerQuizDeadlineWarning("2026-10-15T10:11:00Z",now,true)).toBeNull();
  });
  it("never shows false urgency on closed, expired or undated attempts",()=>{
    expect(learnerQuizDeadlineWarning("2026-10-15T10:05:00Z",now,false)).toBeNull();
    expect(learnerQuizDeadlineWarning("2026-10-15T09:59:00Z",now,true)).toBeNull();
    expect(learnerQuizDeadlineWarning(null,now,true)).toBeNull();
  });
});
