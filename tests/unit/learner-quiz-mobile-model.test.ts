import {describe,expect,it} from "vitest";
import {learnerQuizMobileState} from "@/modules/courses/learner-quiz-mobile-model";
const now=Date.parse("2026-10-14T12:00:00Z");
const own={status:"PUBLISHED" as const,resultsPublished:false,attemptsUsed:0,
  attemptsRemaining:2,maxAttempts:2,dueAt:null};
describe("learner quiz mobile attempt state",()=>{
  it("shows only remaining authorized attempts",()=>{
    expect(learnerQuizMobileState(own,now)).toEqual({
      label:"Ready to attempt",detail:"2 of 2 attempts remaining",urgent:false,
    });
    expect(learnerQuizMobileState({...own,attemptsUsed:2,attemptsRemaining:0},now))
      .toMatchObject({label:"Attempts used",urgent:false});
  });
  it("does not leak score or imply submission for unpublished or closed results",()=>{
    expect(learnerQuizMobileState({...own,status:"CLOSED",attemptsUsed:1},now).label)
      .toBe("Closed");
    expect(learnerQuizMobileState({...own,resultsPublished:true,attemptsUsed:1},now).label)
      .toBe("Results available");
    expect(learnerQuizMobileState({...own,dueAt:"2026-10-13T12:00:00Z"},now).label)
      .toBe("Closed");
  });
});
