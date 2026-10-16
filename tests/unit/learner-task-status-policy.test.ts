import {describe,it,expect} from "vitest";
import {canLearnerMoveOwnTask,learnerTaskStatusInputSchema} from "@/modules/projects/learner-task-status-policy";
describe("LEARNER-projects-25 own-task transitions",()=>{
 it("allows start, block, resume but never complete or override review",()=>{
  expect(canLearnerMoveOwnTask("TODO","IN_PROGRESS")).toBe(true);
  expect(canLearnerMoveOwnTask("IN_PROGRESS","BLOCKED")).toBe(true);
  expect(canLearnerMoveOwnTask("BLOCKED","IN_PROGRESS")).toBe(true);
  expect(canLearnerMoveOwnTask("TODO","DONE")).toBe(false);
  expect(canLearnerMoveOwnTask("IN_REVIEW","IN_PROGRESS")).toBe(false);
  expect(canLearnerMoveOwnTask("DONE","BLOCKED")).toBe(false);
 });
 it("requires a blocker note and blocks spoofed extra fields",()=>{
  const base={status:"BLOCKED",expectedUpdatedAt:"2026-10-16T10:00:00.000Z"};
  expect(learnerTaskStatusInputSchema.safeParse(base).success).toBe(false);
  expect(learnerTaskStatusInputSchema.safeParse({...base,blockerReason:"Blocked by API"}).success).toBe(true);
  expect(learnerTaskStatusInputSchema.safeParse({...base,blockerReason:"Blocked",assigneeMembershipId:"x"}).success).toBe(false);
  expect(learnerTaskStatusInputSchema.safeParse({...base,status:"DONE",blockerReason:"blocked"}).success).toBe(false);
 });
});
