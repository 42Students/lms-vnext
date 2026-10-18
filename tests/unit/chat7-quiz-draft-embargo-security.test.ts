import {describe,expect,it} from "vitest";
import {parseLearnerQuizDraft} from "@/modules/courses/learner-quiz-draft";
import {normalizeLearnerQuizDraftForQuestions} from "@/modules/courses/learner-quiz-draft-scope-model";
import {learnerQuizResultsReleased} from "@/modules/courses/learner-quiz-result-release-policy";
import {learnerQuizSubmitDeadlineOpen} from "@/modules/courses/learner-quiz-submit-deadline-model";
import {canReviewLearnerQuizCorrectAnswers} from "@/modules/courses/learner-quiz-correctness-visibility-model";
import {learnerQuizSubmissionReceiptVisible} from "@/modules/courses/learner-quiz-submission-receipt-model";
import {learnerQuizRequestCurrent} from "@/modules/courses/learner-quiz-request-race-model";

const stamp=Date.parse("2099-07-01T09:00:00.000Z");
describe("IIT Dharwad learner quiz draft, release and stale-tab safety",()=>{
 it("LEARNER-QUIZ-DRAFT-01 rejects corrupted, oversized and prototype-poisoning browser drafts",()=>{
  const bad='{"answers":{"__proto__":["attack"],"constructor":["attack"],"prototype":["attack"],"q1":["a","a","b"]},"step":1}';
  expect(parseLearnerQuizDraft(bad,2)).toEqual({answers:{q1:["a","b"]},step:1});
  expect(Object.getPrototypeOf(parseLearnerQuizDraft(bad,2).answers)).toBe(Object.prototype);
  for(const raw of [null,"invalid json","[]","null"," ".repeat(250001)]){
   expect(parseLearnerQuizDraft(raw,2)).toEqual({answers:{},step:0});
  }
 });
 it("LEARNER-QUIZ-DRAFT-01 bounds per-question selections, question count and navigation state",()=>{
  const answers=Object.fromEntries(Array.from({length:240},(_,i)=>["q"+i,Array.from({length:180},(_,k)=>"v"+k)]));
  const parsed=parseLearnerQuizDraft(JSON.stringify({answers,step:1000}),201);
  expect(Object.keys(parsed.answers).length).toBeLessThanOrEqual(200);
  for(const values of Object.values(parsed.answers))expect(values.length).toBeLessThanOrEqual(100);
  expect(parsed.step).toBe(0);
 });
 it("LEARNER-QUIZ-DRAFT-01 drops options removed by the author and never uses inherited answer keys",()=>{
  const questions=[
   {id:"single",type:"SINGLE_CHOICE" as const,options:[{id:"a"},{id:"b"}]},
   {id:"multi",type:"MULTIPLE_CHOICE" as const,options:[{id:"c"},{id:"d"}]},
  ];
  const answers=Object.assign(Object.create(null) as Record<string,string[]>,{
   single:["a","b","missing","a"],multi:["c","d","other","d"],
  });
  const normalized=normalizeLearnerQuizDraftForQuestions({answers,step:9},questions);
  expect(normalized).toEqual({answers:{single:["a"],multi:["c","d"]},step:0});
  const inherited=Object.create({single:["a"]}) as Record<string,string[]>;
  expect(normalizeLearnerQuizDraftForQuestions({answers:inherited,step:0},questions).answers).toEqual({});
 });
 it("LEARNER-QUIZ-EMBARGO-01 requires closure, explicit release and elapsed due time before showing answer keys",()=>{
  const dueAt=new Date(stamp);
  for(const status of ["DRAFT","PUBLISHED","ARCHIVED"]){
   expect(learnerQuizResultsReleased({status,resultsPublished:true,dueAt},stamp+1)).toBe(false);
  }
  expect(learnerQuizResultsReleased({status:"CLOSED",resultsPublished:false,dueAt},stamp+1)).toBe(false);
  expect(learnerQuizResultsReleased({status:"CLOSED",resultsPublished:true,dueAt},stamp-1)).toBe(false);
  expect(learnerQuizResultsReleased({status:"CLOSED",resultsPublished:true,dueAt},stamp)).toBe(true);
  expect(learnerQuizResultsReleased({status:"CLOSED",resultsPublished:true,dueAt:null},stamp+1)).toBe(false);
  expect(canReviewLearnerQuizCorrectAnswers(true,false)).toBe(false);
  expect(canReviewLearnerQuizCorrectAnswers(false,true)).toBe(false);
  expect(canReviewLearnerQuizCorrectAnswers(true,true)).toBe(true);
 });
 it("LEARNER-QUIZ-DEADLINE-01 enforces the strict server-style deadline at final submit",()=>{
  const dueAt=new Date(stamp).toISOString();
  expect(learnerQuizSubmitDeadlineOpen(dueAt,stamp-1)).toBe(true);
  expect(learnerQuizSubmitDeadlineOpen(dueAt,stamp)).toBe(false);
  expect(learnerQuizSubmitDeadlineOpen(dueAt,stamp+1)).toBe(false);
  expect(learnerQuizSubmitDeadlineOpen(null,stamp)).toBe(false);
  expect(learnerQuizSubmitDeadlineOpen("bad",stamp)).toBe(false);
 });
 it("LEARNER-QUIZ-STALE-01 discards stale attempts and only shows exact quiz submission receipts",()=>{
  expect(learnerQuizRequestCurrent({aborted:true})).toBe(false);
  expect(learnerQuizRequestCurrent({aborted:false})).toBe(true);
  expect(learnerQuizSubmissionReceiptVisible("quiz-1","quiz-2")).toBe(false);
  expect(learnerQuizSubmissionReceiptVisible("quiz-1","quiz-1")).toBe(true);
  expect(learnerQuizSubmissionReceiptVisible(null,"quiz-1")).toBe(false);
 });
});
