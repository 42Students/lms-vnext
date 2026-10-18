import {describe,expect,it} from "vitest";
import {learnerQuizSubmitDeadlineOpen} from "@/modules/courses/learner-quiz-submit-deadline-model";
import {learnerQuizDraftCanPersist} from "@/modules/courses/learner-quiz-autosave-scope-model";
import {canReviewLearnerQuizCorrectAnswers} from "@/modules/courses/learner-quiz-correctness-visibility-model";
import {learnerDiscussionMayPost} from "@/modules/courses/learner-discussion-submit-guard-model";
import {createSubmissionFlightGuard} from "@/modules/courses/learner-submission-flight-model";
import {learnerCourseTabPath} from "@/modules/courses/learner-course-tab-route-model";
import {learnerQuizRequestCurrent} from "@/modules/courses/learner-quiz-request-race-model";
import {learnerQuizRouteScopeCurrent} from "@/modules/courses/learner-quiz-route-scope-model";
import {learnerQuizRefreshFailureMessage} from "@/modules/courses/learner-quiz-refresh-failure-model";
import {learnerAssignmentFinalConfirmation} from "@/modules/courses/learner-assignment-confirmation-model";
import {normalizeLearnerQuizDraftForQuestions} from "@/modules/courses/learner-quiz-draft-scope-model";
import {parseLearnerQuizDraft} from "@/modules/courses/learner-quiz-draft";
import {requireLearnerQuizResponseId} from "@/modules/courses/learner-quiz-response-id-model";
import {learnerAssessmentMatchesState} from "@/modules/courses/learner-assessment-state-filter-model";

describe("chat-7 learner assessment and discussion guard exhaustive source-model coverage",()=>{
 const now=Date.parse("2099-01-01T12:00:00.000Z");
 const hour=60*60*1000;
 const iso=(time:number)=>new Date(time).toISOString();
 const assignment=(overrides:Partial<{kind:"ASSIGNMENT";submittedAt:string|null;gradePublished:boolean;dueAt:string|null}>={})=>
  ({kind:"ASSIGNMENT" as const,submittedAt:null,gradePublished:false,dueAt:iso(now+hour),...overrides});
 const quiz=(overrides:Partial<{kind:"QUIZ";attemptsUsed:number;attemptsRemaining:number;status:"PUBLISHED"|"CLOSED";dueAt:string|null;resultsPublished:boolean}>={})=>
  ({kind:"QUIZ" as const,attemptsUsed:0,attemptsRemaining:1,status:"PUBLISHED" as const,dueAt:iso(now+hour),resultsPublished:false,...overrides});

 it("UX-quiz-deadline-01 allows submission strictly before the deadline, rejects equality, expired, missing and malformed inputs",()=>{
  const due=iso(now+hour);
  expect(learnerQuizSubmitDeadlineOpen(due,now)).toBe(true);
  expect(learnerQuizSubmitDeadlineOpen(due,now+hour)).toBe(false);
  expect(learnerQuizSubmitDeadlineOpen(due,now+hour+1)).toBe(false);
  expect(learnerQuizSubmitDeadlineOpen(null,now)).toBe(false);
  expect(learnerQuizSubmitDeadlineOpen("not a date",now)).toBe(false);
  expect(learnerQuizSubmitDeadlineOpen(due,Number.NaN)).toBe(false);
 });

 it("UX-quiz-scope-02 only autosaves active, loaded, matching drafts; not review, loading, missing quiz or stale routes",()=>{
  const valid={storageKey:"quiz:c:q",loadedScopeKey:"quiz:c:q",review:false,loading:false,hasQuiz:true};
  expect(learnerQuizDraftCanPersist(valid)).toBe(true);
  expect(learnerQuizDraftCanPersist({...valid,review:true})).toBe(false);
  expect(learnerQuizDraftCanPersist({...valid,loading:true})).toBe(false);
  expect(learnerQuizDraftCanPersist({...valid,hasQuiz:false})).toBe(false);
  expect(learnerQuizDraftCanPersist({...valid,storageKey:""})).toBe(false);
  expect(learnerQuizDraftCanPersist({...valid,loadedScopeKey:null})).toBe(false);
  expect(learnerQuizDraftCanPersist({...valid,loadedScopeKey:"quiz:other:q"})).toBe(false);
  expect(learnerQuizRouteScopeCurrent("a","a")).toBe(true);
  expect(learnerQuizRouteScopeCurrent("a","b")).toBe(false);
  expect(learnerQuizRouteScopeCurrent("a",null)).toBe(false);
 });

 it("UX-quiz-permission-03 conceals answer correctness until both publication and attempt visibility permit it",()=>{
  expect(canReviewLearnerQuizCorrectAnswers(true,true)).toBe(true);
  for(const [published,visible] of [[true,false],[false,true],[false,false]]){
   expect(canReviewLearnerQuizCorrectAnswers(published,visible)).toBe(false);
  }
 });

 it("UX-discussion-post-04 prevents empty, unauthorized and overlapping discussion posts",()=>{
  expect(learnerDiscussionMayPost("  Hello  ",true,false)).toBe(true);
  expect(learnerDiscussionMayPost(" \n ",true,false)).toBe(false);
  expect(learnerDiscussionMayPost("Hello",false,false)).toBe(false);
  expect(learnerDiscussionMayPost("Hello",true,true)).toBe(false);
  expect(learnerDiscussionMayPost("Hello",false,true)).toBe(false);
 });

 it("UX-learner-submit-flight-05 guards synchronous double clicks and unlocks after success or failure",()=>{
  const guard=createSubmissionFlightGuard();
  expect(guard.begin()).toBe(true);
  expect(guard.begin()).toBe(false);
  guard.end();
  expect(guard.begin()).toBe(true);
  guard.end();
  expect(guard.begin()).toBe(true);
 });

 it("UX-course-tab-route-06 denies unexpected tab descendants and unlisted route slugs",()=>{
  const allowed=["home","roadmap","discussions"];
  expect(learnerCourseTabPath(["roadmap"],allowed)).toBe("roadmap");
  expect(learnerCourseTabPath([],allowed)).toBeNull();
  expect(learnerCourseTabPath(["roadmap","admin"],allowed)).toBeNull();
  expect(learnerCourseTabPath(["unknown"],allowed)).toBeNull();
  expect(learnerCourseTabPath([""],allowed)).toBeNull();
 });

 it("UX-quiz-request-race-07 ignores stale aborted reads",()=>{
  expect(learnerQuizRequestCurrent()).toBe(true);
  expect(learnerQuizRequestCurrent({aborted:false})).toBe(true);
  expect(learnerQuizRequestCurrent({aborted:true})).toBe(false);
 });

 it("GR-quiz-read-01 never surfaces raw backend codes but preserves confirmed final submission receipts",()=>{
  expect(learnerQuizRefreshFailureMessage(false,new Error("Forbidden INTERNAL_ERROR"))).toBe("Unable to load this quiz. Please try again.");
  expect(learnerQuizRefreshFailureMessage(false,"trace")).toBe("Unable to load this quiz. Please try again.");
  const submitted=learnerQuizRefreshFailureMessage(true,new Error("database credential"));
  expect(submitted).toContain("was submitted");
  expect(submitted).toContain("Open All Quizzes");
  expect(submitted).not.toContain("database credential");
 });

 it("UX-assignment-final-08 confirms submission irreversibility with action-specific copy",()=>{
  const text=learnerAssignmentFinalConfirmation("TEXT");
  const link=learnerAssignmentFinalConfirmation("LINK");
  expect(text).toContain("written response");
  expect(link).toContain("HTTPS link");
  for(const message of [text,link])expect(message).toContain("cannot replace it after submission");
 });

 it("UX-quiz-draft-09 validates malformed browser JSON, answer IDs, duplicate selections and bounded step index",()=>{
  expect(parseLearnerQuizDraft(null,3)).toEqual({answers:{},step:0});
  expect(parseLearnerQuizDraft("{",3)).toEqual({answers:{},step:0});
  expect(parseLearnerQuizDraft("[]",3)).toEqual({answers:{},step:0});
  const read=parseLearnerQuizDraft(JSON.stringify({answers:{q:["a","a","b",false,25]},step:2}),3);
  expect(read).toEqual({answers:{q:["a","b"]},step:2});
  expect(parseLearnerQuizDraft(JSON.stringify({answers:{q:["a"]},step:3}),3).step).toBe(0);
  expect(parseLearnerQuizDraft(JSON.stringify({answers:{q:["a"]},step:-1}),3).step).toBe(0);
  expect(parseLearnerQuizDraft(JSON.stringify({answers:{q:["a"]},step:"1"}),3).step).toBe(0);
 });

 it("UX-quiz-draft-scope-10 strips foreign questions/options and restricts single-choice answers",()=>{
  const questionList=[
   {id:"q1",type:"SINGLE_CHOICE" as const,options:[{id:"a"},{id:"b"}]},
   {id:"q2",type:"MULTIPLE_CHOICE" as const,options:[{id:"c"},{id:"d"}]},
  ];
  const draft={answers:{q1:["b","b","foreign","a"],q2:["d","c","d","foreign"],other:["a"]},step:99};
  expect(normalizeLearnerQuizDraftForQuestions(draft,questionList)).toEqual({
   answers:{q1:["b"],q2:["d","c"]},step:0,
  });
  expect(normalizeLearnerQuizDraftForQuestions({answers:{q1:["a"]},step:1},questionList).step).toBe(1);
  expect(normalizeLearnerQuizDraftForQuestions(draft,[])).toEqual({answers:{},step:0});
 });

 it("UX-quiz-response-id-11 denies mismatched and malformed quiz payloads before draft restore",()=>{
  const original="11111111-1111-4111-8111-111111111111";
  expect(()=>requireLearnerQuizResponseId(original,original)).not.toThrow();
  expect(()=>requireLearnerQuizResponseId(original,"22222222-2222-4222-8222-222222222222")).toThrow("does not match");
  expect(()=>requireLearnerQuizResponseId(original,"not-uuid")).toThrow("does not match");
  expect(()=>requireLearnerQuizResponseId(original,null)).toThrow("does not match");
 });

 it("UX-assessment-filter-12 covers all learner assignment transitions and exact 72-hour time boundaries",()=>{
  expect(learnerAssessmentMatchesState(assignment(),"ALL",now)).toBe(true);
  expect(learnerAssessmentMatchesState(assignment(),"PENDING",now)).toBe(true);
  expect(learnerAssessmentMatchesState(assignment(),"DUE_SOON",now)).toBe(true);
  expect(learnerAssessmentMatchesState(assignment({dueAt:iso(now+72*hour)}),"DUE_SOON",now)).toBe(true);
  expect(learnerAssessmentMatchesState(assignment({dueAt:iso(now+72*hour+1)}),"DUE_SOON",now)).toBe(false);
  expect(learnerAssessmentMatchesState(assignment({dueAt:iso(now-hour)}),"OVERDUE",now)).toBe(true);
  expect(learnerAssessmentMatchesState(assignment({dueAt:null}),"OVERDUE",now)).toBe(false);
  expect(learnerAssessmentMatchesState(assignment({submittedAt:iso(now)}),"COMPLETED",now)).toBe(true);
  expect(learnerAssessmentMatchesState(assignment({submittedAt:iso(now)}),"OVERDUE",now)).toBe(false);
  expect(learnerAssessmentMatchesState(assignment({submittedAt:iso(now),gradePublished:true}),"RESULTS",now)).toBe(true);
  expect(learnerAssessmentMatchesState(assignment({submittedAt:iso(now),gradePublished:false}),"RESULTS",now)).toBe(false);
  expect(learnerAssessmentMatchesState(assignment(),"nonsense",now)).toBe(true);
 });

 it("UX-assessment-filter-13 covers published, closed, exhausted, attempted, and withheld quiz states",()=>{
  expect(learnerAssessmentMatchesState(quiz(),"PENDING",now)).toBe(true);
  expect(learnerAssessmentMatchesState(quiz(),"DUE_SOON",now)).toBe(true);
  expect(learnerAssessmentMatchesState(quiz({attemptsRemaining:0}),"DUE_SOON",now)).toBe(false);
  expect(learnerAssessmentMatchesState(quiz({status:"CLOSED"}),"OVERDUE",now)).toBe(true);
  expect(learnerAssessmentMatchesState(quiz({status:"CLOSED"}),"PENDING",now)).toBe(false);
  expect(learnerAssessmentMatchesState(quiz({dueAt:iso(now-hour)}),"OVERDUE",now)).toBe(true);
  expect(learnerAssessmentMatchesState(quiz({attemptsUsed:1}),"COMPLETED",now)).toBe(true);
  expect(learnerAssessmentMatchesState(quiz({attemptsUsed:1}),"PENDING",now)).toBe(false);
  expect(learnerAssessmentMatchesState(quiz({attemptsUsed:1,resultsPublished:true}),"RESULTS",now)).toBe(false);
  expect(learnerAssessmentMatchesState(quiz({attemptsUsed:1,resultsPublished:true,status:"CLOSED"}),"RESULTS",now)).toBe(false);
  expect(learnerAssessmentMatchesState(quiz({attemptsUsed:1,resultsPublished:true,status:"CLOSED",dueAt:iso(now-hour)}),"RESULTS",now)).toBe(true);
  expect(learnerAssessmentMatchesState(quiz({attemptsUsed:1,resultsPublished:false}),"RESULTS",now)).toBe(false);
  expect(learnerAssessmentMatchesState(quiz({dueAt:null}),"DUE_SOON",now)).toBe(false);
  expect(learnerAssessmentMatchesState(quiz({dueAt:null}),"PENDING",now)).toBe(true);
 });
});
