import { describe, expect, it } from "vitest";
import { quizOverviewActionState, type QuizOverviewStatus } from "@/components/courses/quiz-overview-state";

const now = Date.parse("2026-10-10T08:00:00.000Z");
const base: QuizOverviewStatus = {
  status: "PUBLISHED",
  dueAt: "2026-10-10T09:00:00.000Z",
  attemptsUsed: 0,
  attemptsRemaining: 3,
  resultsPublished: false,
  progressStatus: "NOT_STARTED",
};

describe("W02 legacy QuizzesContent expired row parity", () => {
  it("missed past-due quiz is review-only even if attempts remain", () => {
    expect(quizOverviewActionState({
      ...base,
      dueAt: "2026-10-09T09:00:00.000Z",
      progressStatus: "MISSED",
    }, now)).toMatchObject({
      label: "Missed", action: "Unavailable", review: true,
    });
  });
  it("read-only missed quiz must not promise unpublished answers", () => {
    const result=quizOverviewActionState({...base,status:"CLOSED",resultsPublished:false,attemptsUsed:0},now);
    expect(result.action).toBe("Unavailable");
    expect(result.review).toBe(true);
  });
  it("previously submitted expired quiz is review, never retake", () => {
    expect(quizOverviewActionState({
      ...base,
      dueAt: "2026-10-09T09:00:00.000Z",
      attemptsUsed: 1,
    }, now)).toMatchObject({
      label: "Submitted", action: "Review quiz", review: true,
    });
  });
  it("upcoming quiz offers start and a submitted live quiz allows a retake", () => {
    expect(quizOverviewActionState(base, now)).toMatchObject({
      action: "Start Quiz", review: false,
    });
    expect(quizOverviewActionState({ ...base, attemptsUsed: 1 }, now)).toMatchObject({
      action: "Retake Quiz", review: false,
    });
  });
  it("exhaustion and faculty close never offer an attempt", () => {
    expect(quizOverviewActionState({
      ...base, attemptsUsed: 3, attemptsRemaining: 0,
    }, now).review).toBe(true);
    expect(quizOverviewActionState({
      ...base, status: "CLOSED",
    }, now).review).toBe(true);
    expect(quizOverviewActionState({
      ...base, status: "CLOSED", resultsPublished: true, attemptsUsed: 1,
    }, now)).toMatchObject({
      action: "View answers", review: true,
    });
  });
  it("the exact deadline instant is still allowed, and an unconfigured deadline is unavailable (legacy)", () => {
    expect(quizOverviewActionState({
      ...base, dueAt: "2026-10-10T08:00:00.000Z",
    }, now).review).toBe(false);
    expect(quizOverviewActionState({ ...base, dueAt: null }, now).review).toBe(true);
  });
});

describe("zero remaining learner quiz attempts",()=>{
 it("never offers Start Quiz without an available attempt",()=>{
  const result=quizOverviewActionState({...base,attemptsRemaining:0,attemptsUsed:0},now);
  expect(result).toMatchObject({label:"No attempts remaining",action:"View quiz",review:true});
 });
});

describe("unknown learner quiz deadlines",()=>{
 it("fails closed on malformed persisted timestamps and an unconfigured deadline is unavailable too",()=>{
  expect(quizOverviewActionState({...base,dueAt:"not-a-date"},now)).toMatchObject({
   label:"Deadline unavailable",review:true,
  });
  expect(quizOverviewActionState({...base,dueAt:null},now).review).toBe(true);
 });
});

describe("published learner results at attempt exhaustion",()=>{
 it("shows View Result after a released exhausted attempt",()=>{
  expect(quizOverviewActionState({
   ...base,attemptsUsed:2,attemptsRemaining:0,resultsPublished:true,
  },now)).toMatchObject({label:"Results published",action:"View answers",review:true});
 });
 it("does not claim an unpublished result",()=>{
  expect(quizOverviewActionState({
   ...base,attemptsUsed:2,attemptsRemaining:0,resultsPublished:false,
  },now).action).toBe("Review quiz");
 });
});
