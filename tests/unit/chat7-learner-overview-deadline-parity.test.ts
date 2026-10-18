import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {assertAssignmentSubmissionDeadline} from "@/modules/courses/assignment-submission-deadline-policy";
import {learnerQuizSubmitDeadlineOpen} from "@/modules/courses/learner-quiz-submit-deadline-model";
import {learnerAssessmentMatchesState} from "@/modules/courses/learner-assessment-state-filter-model";
import {selectPriorityLearnerActivity} from "@/modules/courses/learner-overview-priority";

const now=Date.parse("2026-10-18T12:00:00.000Z");
const after=new Date(now+1000);
const at=new Date(now);
const before=new Date(now-1000);
const deadline=(due:Date|null)=>()=>assertAssignmentSubmissionDeadline(due,new Date(now));
const assignment=(due:string)=>({kind:"ASSIGNMENT" as const,submittedAt:null,
 gradePublished:false,dueAt:due});
describe("COURSES7-10 learner home and server deadline parity",()=>{
 it("rejects missing, invalid, earlier or exact-deadline assignment submissions",()=>{
  expect(deadline(after)).not.toThrow();
  expect(deadline(at)).toThrow("ASSIGNMENT_DEADLINE_PASSED");
  expect(deadline(before)).toThrow("ASSIGNMENT_DEADLINE_PASSED");
  expect(deadline(null)).toThrow("ASSIGNMENT_DEADLINE_NOT_CONFIGURED");
  expect(deadline(new Date(Number.NaN))).toThrow("ASSIGNMENT_DEADLINE_NOT_CONFIGURED");
 });
 it("uses the same strict deadline equality for quiz attempts",()=>{
  expect(learnerQuizSubmitDeadlineOpen(after.toISOString(),now)).toBe(true);
  expect(learnerQuizSubmitDeadlineOpen(at.toISOString(),now)).toBe(false);
  expect(learnerQuizSubmitDeadlineOpen(before.toISOString(),now)).toBe(false);
 });
 it("still labels late assignments overdue, rather than actionably submittable",()=>{
  expect(learnerAssessmentMatchesState(assignment(before.toISOString()),"OVERDUE",now)).toBe(true);
  expect(learnerAssessmentMatchesState(assignment(before.toISOString()),"DUE_SOON",now)).toBe(false);
  expect(learnerAssessmentMatchesState(assignment(at.toISOString()),"PENDING",now)).toBe(true);
 });
 it("home priority excludes expired assignments instead of offering a late-submit call to action",()=>{
  const source=readFileSync("src/components/courses/learner-course-overview.tsx","utf8");
  expect(source).not.toContain("late submission available");
  expect(source).not.toContain("overdueAssignmentActions");
  expect(source).toContain("selectPriorityLearnerActivity(allUpcomingActivity)");
  expect(source).toContain("item.dueAt!.getTime() > now");
  expect(selectPriorityLearnerActivity([])).toBeNull();
 });
});
