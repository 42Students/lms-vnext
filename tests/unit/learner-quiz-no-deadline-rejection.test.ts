import {describe,it,expect} from "vitest";
import {learnerQuizSubmitDeadlineOpen} from "@/modules/courses/learner-quiz-submit-deadline-model";
import {learnerQuizDeadlineDisplay} from "@/modules/courses/learner-quiz-deadline-display-model";
import {quizOverviewActionState} from "@/components/courses/quiz-overview-state";
describe("LEARNER-learning-misc-23 / LEARNER-course-detail-02 no due date",()=>{
 const now=Date.parse("2026-10-17T12:00:00Z");
 it("disables unconfigured and expired quizzes",()=>{
  expect(learnerQuizSubmitDeadlineOpen(null,now)).toBe(false);
  expect(learnerQuizSubmitDeadlineOpen("2026-10-17T12:00:00Z",now)).toBe(false);
  expect(learnerQuizSubmitDeadlineOpen("2026-10-17T12:00:01Z",now)).toBe(true);
  expect(learnerQuizDeadlineDisplay(null)).toBe("Deadline unavailable");
 });
 it("provides the legacy unavailable state instead of Start Quiz",()=>{
  const state=quizOverviewActionState({status:"PUBLISHED",dueAt:null,attemptsUsed:0,
    attemptsRemaining:1,resultsPublished:false,progressStatus:"NOT_STARTED"},now);
  expect(state.label).toBe("Unavailable · deadline missing");
  expect(state.review).toBe(true);
 });
});
