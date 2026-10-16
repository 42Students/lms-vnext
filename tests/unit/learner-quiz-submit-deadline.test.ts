import {describe,it,expect} from "vitest";
import {learnerQuizSubmitDeadlineOpen} from "@/modules/courses/learner-quiz-submit-deadline-model";
describe("learner quiz last-moment submit fence",()=>{
  const end="2026-10-15T12:00:00Z";
  it("allows a pre-deadline confirmation; the exact deadline instant is closed",()=>{
    expect(learnerQuizSubmitDeadlineOpen(end,Date.parse(end)-1)).toBe(true);
    expect(learnerQuizSubmitDeadlineOpen(end,Date.parse(end))).toBe(false);
  });
  it("refuses late or malformed deadlines, refuses undated quizzes (legacy)",()=>{
    expect(learnerQuizSubmitDeadlineOpen(end,Date.parse(end)+1)).toBe(false);
    expect(learnerQuizSubmitDeadlineOpen("invalid",Date.now())).toBe(false);
    expect(learnerQuizSubmitDeadlineOpen(null,Date.parse(end)+1000)).toBe(false);
  });
});
