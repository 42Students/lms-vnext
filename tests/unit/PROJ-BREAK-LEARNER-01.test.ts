import {describe,expect,it} from "vitest";
import {learnerOwnTaskCreateInputSchema} from "@/modules/projects/learner-own-task-input-model";
import {learnerTaskStatusInputSchema,canLearnerMoveOwnTask} from "@/modules/projects/learner-task-status-policy";
import {learnerTaskProgressInputSchema,learnerTaskTransitionAllowed} from "@/modules/projects/learner-task-progress-model";
import {maySubmitAssignedProjectTask} from "@/modules/projects/task-assignee-policy";
import {projectSubmissionAllowsNewDraft} from "@/modules/projects/submission-draft-policy";
import {mentorTaskReviewTokenMatches} from "@/modules/projects/mentor-task-review-token-model";

const taskId="11111111-1111-4111-8111-111111111111",sprintId="22222222-2222-4222-8222-222222222222";
const version="2026-10-18T10:05:00.000+05:30";
const create={sprintId:null,expectedSprintUpdatedAt:null,title:"Implement report"} as const;

describe("PROJ-BREAK-LEARNER-01 create and mutate only own authorized project tasks",()=>{
 it("rejects tenant/owner spoofing, terminal status, missing title and unknown fields",()=>{
  expect(learnerOwnTaskCreateInputSchema.safeParse(create).success).toBe(true);
  for(const input of [
   {...create,createdByMembershipId:taskId},
   {...create,assigneeMembershipId:taskId},
   {...create,collegeId:taskId},
   {...create,projectId:taskId},
   {...create,status:"DONE"},
   {...create,status:"IN_REVIEW"},
   {...create,title:" "},
   {...create,title:"x".repeat(201)},
   {...create,estimatePoints:1001},
   {...create,estimatePoints:-1},
   {...create,dueDate:"2026-02-30"},
   {...create,priority:"ULTIMATE"},
  ])expect(learnerOwnTaskCreateInputSchema.safeParse(input).success).toBe(false);
 });
 it("rejects creation in inactive or stale sprint shape before any mutation",()=>{
  expect(learnerOwnTaskCreateInputSchema.safeParse({...create,sprintId}).success).toBe(false);
  expect(learnerOwnTaskCreateInputSchema.safeParse({...create,expectedSprintUpdatedAt:version}).success).toBe(false);
  expect(learnerOwnTaskCreateInputSchema.safeParse({...create,sprintId,expectedSprintUpdatedAt:version}).success).toBe(true);
  expect(learnerOwnTaskCreateInputSchema.safeParse({...create,sprintId,expectedSprintUpdatedAt:"invalid"}).success).toBe(false);
  expect(learnerOwnTaskCreateInputSchema.safeParse({...create,status:"IN_PROGRESS"}).success).toBe(false);
 });
 it("rejects inconsistent blocker reasons on unblocked tasks and requires real blocked notes",()=>{
  expect(learnerOwnTaskCreateInputSchema.safeParse({...create,status:"BLOCKED"}).success).toBe(false);
  expect(learnerOwnTaskCreateInputSchema.safeParse({...create,status:"TODO",blockerReason:"Still blocked"}).success).toBe(false);
  expect(learnerOwnTaskCreateInputSchema.safeParse({...create,sprintId,expectedSprintUpdatedAt:version,status:"IN_PROGRESS",blockerReason:"blocked"}).success).toBe(false);
  const blocked=learnerOwnTaskCreateInputSchema.safeParse({...create,sprintId,expectedSprintUpdatedAt:version,status:"BLOCKED",blockerReason:"  Missing design  "});
  expect(blocked.success).toBe(true);
  if(blocked.success)expect(blocked.data.blockerReason).toBe("Missing design");
 });
 it("rejects forged DONE and invalid optimistic update tokens in learner status route payload",()=>{
  const update={status:"BLOCKED",blockerReason:"Deployment blocked",expectedUpdatedAt:version};
  expect(learnerTaskStatusInputSchema.safeParse(update).success).toBe(true);
  for(const payload of [
   {...update,status:"DONE"},{...update,status:"IN_REVIEW"},
   {...update,status:"BLOCKED",blockerReason:" "},
   {...update,status:"IN_PROGRESS",blockerReason:"Still blocked"},
   {...update,expectedUpdatedAt:"yesterday"},
   {...update,role:"MENTOR"},
  ])expect(learnerTaskStatusInputSchema.safeParse(payload).success).toBe(false);
 });
 it("rejects every DONE/IN_REVIEW transition, every unchanged status, and premature blocked reset in status service",()=>{
  for(const from of ["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"]){
   for(const to of ["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"]){
    const allowed=(from==="TODO"&&(to==="IN_PROGRESS"||to==="BLOCKED"))||
      (from==="IN_PROGRESS"&&to==="BLOCKED")||
      (from==="BLOCKED"&&to==="IN_PROGRESS");
    expect(canLearnerMoveOwnTask(from,to)).toBe(allowed);
   }
  }
 });
 it("only assigned learner membership may submit (no null/unassigned/foreign membership bypass)",()=>{
  expect(maySubmitAssignedProjectTask(taskId,taskId)).toBe(true);
  expect(maySubmitAssignedProjectTask(taskId,sprintId)).toBe(false);
  expect(maySubmitAssignedProjectTask(null,taskId)).toBe(false);
  expect(maySubmitAssignedProjectTask(taskId,null)).toBe(false);
  expect(maySubmitAssignedProjectTask(null,null)).toBe(false);
 });
 it("cannot reopen terminal approved delivery by creating another draft",()=>{
  expect(projectSubmissionAllowsNewDraft("APPROVED")).toBe(false);
  for(const state of ["DRAFT","SUBMITTED","CHANGES_REQUESTED",null,undefined]){
   expect(projectSubmissionAllowsNewDraft(state)).toBe(true);
  }
 });
 it("rejects stale/future/invalid mentor review tokens to prevent parallel review override",()=>{
  const stored=new Date("2026-10-18T04:35:00.000Z");
  expect(mentorTaskReviewTokenMatches(stored,"2026-10-18T10:05:00.000+05:30")).toBe(true);
  for(const incorrect of ["2026-10-18T04:35:00.001Z","2026-10-18T04:34:59Z","not-a-date"]){
   expect(mentorTaskReviewTokenMatches(stored,incorrect)).toBe(false);
  }
 });
 it("requires one of the bounded states plus blocker details for generic learner task progress",()=>{
  expect(learnerTaskProgressInputSchema.safeParse({action:"STATUS",status:"BLOCKED",expectedUpdatedAt:version,blockerNote:"Blocked"}).success).toBe(true);
  for(const action of ["DELETE","APPROVE","STATUS_DONE"]){
   expect(learnerTaskProgressInputSchema.safeParse({action,expectedUpdatedAt:version} ).success).toBe(false);
  }
  expect(learnerTaskProgressInputSchema.safeParse({action:"STATUS",status:"DONE",expectedUpdatedAt:version}).success).toBe(false);
  expect(learnerTaskProgressInputSchema.safeParse({action:"STATUS",status:"BLOCKED",expectedUpdatedAt:version}).success).toBe(false);
  expect(learnerTaskProgressInputSchema.safeParse({action:"STATUS",status:"BLOCKED",blockerNote:"  ",expectedUpdatedAt:version}).success).toBe(false);
  expect(learnerTaskProgressInputSchema.safeParse({action:"STATUS",status:"IN_PROGRESS",blockerNote:"Still blocked",expectedUpdatedAt:version}).success).toBe(false);
  expect(learnerTaskProgressInputSchema.safeParse({action:"STATUS",status:"TODO",blockerNote:"Still blocked",expectedUpdatedAt:version}).success).toBe(false);
  expect(learnerTaskProgressInputSchema.safeParse({action:"MOVE_UP",expectedUpdatedAt:version,clientSequence:999}).success).toBe(false);
  expect(learnerTaskTransitionAllowed("TODO","BLOCKED","reason")).toBe(true);
  expect(learnerTaskTransitionAllowed("TODO","BLOCKED","  ")).toBe(false);
  expect(learnerTaskTransitionAllowed("IN_REVIEW","TODO","reason")).toBe(false);
  expect(learnerTaskTransitionAllowed("TODO","TODO","reason")).toBe(false);
 });
});
