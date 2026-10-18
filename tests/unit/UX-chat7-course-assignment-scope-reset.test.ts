import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {learnerAssignmentFinalConfirmation} from "@/modules/courses/learner-assignment-confirmation-model";
import {createSubmissionFlightGuard} from "@/modules/courses/learner-submission-flight-model";
import {learnerQuizRouteScopeCurrent} from "@/modules/courses/learner-quiz-route-scope-model";
import {learnerQuizDraftCanPersist} from "@/modules/courses/learner-quiz-autosave-scope-model";

const source=(p:string)=>readFileSync("src/components/courses/"+p+".tsx","utf8");
describe("UX-courses-learner-reset-01 cross-assessment/browser-navigation guard",()=>{
 it("the All Assignments drawer remounts the form when the authorized delivery or assignment changes",()=>{
  const text=source("learner-assessment-overview");
  expect(text).toContain('key={selectedAssignment.deliveryId+":"+selectedAssignment.id}');
  expect(text).toContain('assignmentId={selectedAssignment.id}');
  expect(text).toContain('deliveryId={selectedAssignment.deliveryId}');
 });
 it("the course roadmap likewise remounts draft and method state when a course or assignment changes",()=>{
  const text=source("learner-course-workspace");
  expect(text).toContain('key={deliveryId+":"+assignment.id}');
  expect(text).toContain('assignmentId={assignment.id}');
  expect(text).toContain('deliveryId={deliveryId}');
 });
 it("a final submit must be confirmed and an overlapping click cannot begin a second request",()=>{
  const text=source("assignment-submission-control");
  expect(text).toContain("createSubmissionFlightGuard");
  expect(text).toContain("learnerAssignmentFinalConfirmation(submissionType)");
  for(const type of ["TEXT","LINK"] as const){
   expect(learnerAssignmentFinalConfirmation(type)).toContain("cannot replace");
  }
  const guard=createSubmissionFlightGuard();
  expect(guard.begin()).toBe(true);
  expect(guard.begin()).toBe(false);
  guard.end();
  expect(guard.begin()).toBe(true);
 });
 it("a stale quiz load cannot write the next course or quiz storage key",()=>{
  expect(learnerQuizRouteScopeCurrent("quiz:deliveryB:quizB","quiz:deliveryA:quizA")).toBe(false);
  expect(learnerQuizDraftCanPersist({
   storageKey:"quiz:deliveryB:quizB",loadedScopeKey:"quiz:deliveryA:quizA",
   review:false,loading:false,hasQuiz:true,
  })).toBe(false);
 });
});
