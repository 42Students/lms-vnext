import {describe,it,expect} from "vitest";
import {assertAssignmentSubmissionDeadline} from "@/modules/courses/assignment-submission-deadline-policy";
import {assignmentOverviewState} from "@/modules/courses/learner-assignment-display";
const now=new Date("2026-10-16T12:00:00.000Z");
describe("LEARNER-learning-misc-05 strict assignment deadline",()=>{
 it("rejects missing, equal and past deadline and allows future",()=>{
  expect(()=>assertAssignmentSubmissionDeadline(null,now)).toThrow("ASSIGNMENT_DEADLINE_NOT_CONFIGURED");
  expect(()=>assertAssignmentSubmissionDeadline(now,now)).toThrow("ASSIGNMENT_DEADLINE_PASSED");
  expect(()=>assertAssignmentSubmissionDeadline(new Date(now.getTime()-1),now)).toThrow("ASSIGNMENT_DEADLINE_PASSED");
  expect(()=>assertAssignmentSubmissionDeadline(new Date(now.getTime()+1),now)).not.toThrow();
 });
 it("does not offer Submit for closed or deadline-free assignments",()=>{
  const base={submittedAt:null,gradePublished:false,pointsAwarded:null,maxPoints:10};
  expect(assignmentOverviewState({...base,dueAt:null},now.getTime()).action).toBe("View");
  expect(assignmentOverviewState({...base,dueAt:now.toISOString()},now.getTime()).label).toBe("Closed · not submitted");
  expect(assignmentOverviewState({...base,dueAt:new Date(now.getTime()+1).toISOString()},now.getTime()).action).toBe("Submit");
 });
});
