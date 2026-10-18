import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 learnerTaskTransitionAllowed,learnerTaskProgressInputSchema,
 learnerTaskProgressParamsSchema,
} from "@/modules/projects/learner-task-progress-model";
import {canLearnerMoveOwnTask} from "@/modules/projects/learner-task-status-policy";

const stamp="2099-01-01T12:00:00.000Z";
const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
describe("PROJ-BREAK-LEARNER-98 protected state-transition matrix for both learner task endpoints",()=>{
 it("allows only TODO to working/blocked, working to blocked, and blocked back to working",()=>{
  const allowed=[
   ["TODO","IN_PROGRESS"],["TODO","BLOCKED"],
   ["IN_PROGRESS","BLOCKED"],["BLOCKED","IN_PROGRESS"],
  ];
  for(const from of ["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE","ACCEPTED"]){
   for(const to of ["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE","ACCEPTED"]){
    const permitted=allowed.some(pair=>pair[0]===from&&pair[1]===to);
    expect(learnerTaskTransitionAllowed(from,to,"Valid blocker")).toBe(permitted);
    expect(canLearnerMoveOwnTask(from,to)).toBe(permitted);
   }
  }
 });
 it("requires a meaningful bounded blocker note and forbids smuggled terminal/TODO transitions",()=>{
  for(const status of ["TODO","IN_REVIEW","DONE","ACCEPTED","CANCELLED"]){
   expect(learnerTaskProgressInputSchema.safeParse({action:"STATUS",status,
    expectedUpdatedAt:stamp}).success).toBe(false);
  }
  for(const payload of [
   {action:"STATUS",status:"BLOCKED",expectedUpdatedAt:stamp},
   {action:"STATUS",status:"BLOCKED",expectedUpdatedAt:stamp,blockerNote:" x "},
   {action:"STATUS",status:"BLOCKED",expectedUpdatedAt:stamp,blockerNote:"a".repeat(2001)},
   {action:"STATUS",status:"IN_PROGRESS",expectedUpdatedAt:stamp,blockerNote:"Old blocker"},
   {action:"MOVE_UP",expectedUpdatedAt:stamp,assigneeMembershipId:projectId},
   {action:"MOVE_DOWN",expectedUpdatedAt:stamp,projectId},
  ])expect(learnerTaskProgressInputSchema.safeParse(payload).success).toBe(false);
  expect(learnerTaskProgressInputSchema.safeParse({
   action:"STATUS",status:"BLOCKED",expectedUpdatedAt:stamp,blockerNote:"Waiting for tests",
  }).success).toBe(true);
  expect(learnerTaskTransitionAllowed("TODO","BLOCKED","  ")).toBe(false);
 });
 it("requires scoped UUID route params, never trusts forged tenant or actor fields",()=>{
  expect(learnerTaskProgressParamsSchema.safeParse({projectId,taskId}).success).toBe(true);
  expect(learnerTaskProgressParamsSchema.safeParse({projectId,taskId,collegeId:taskId}).success).toBe(false);
  expect(learnerTaskProgressParamsSchema.safeParse({projectId:"bad",taskId}).success).toBe(false);
 });
 it("retains same-origin route guard, transactional persisted membership and notification/audit side effects",()=>{
  const service=readFileSync("src/modules/projects/learner-task-progress-service.ts","utf8");
  const route=readFileSync("src/app/api/projects/[projectId]/tasks/[taskId]/learner-progress/route.ts","utf8");
  for(const clause of [
   "assertPersistedLearnerProjectMutation(tx,context",
   'project.status !== "ACTIVE"',
   'release.status',
   "learnerTaskTransitionAllowed(",
   "recordActivityEventInTransaction(tx, context",
   "notifyActiveProjectMembers(tx, taskEvent.id",
  ])expect(service).toContain(clause);
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route.indexOf("isSameOriginRequest(request)")).toBeLessThan(route.indexOf("request.json()"));
 });
 it("never presents an unsupported backward move, including undo or keyboard selector paths",()=>{
  const board=readFileSync("src/components/projects/learner-board-interactive.tsx","utf8");
  expect(board).toContain("!canLearnerMoveOwnTask(task.status,next)");
  expect(board).toContain("canLearnerMoveOwnTask(task.status,undo.status)");
  expect(board).toContain("statuses.filter(status=>status===task.status||canLearnerMoveOwnTask(task.status,status))");
  expect(board).toContain("disabled={status===task.status}");
  expect(board).toContain("The task or sprint changed. Refresh before trying again.");
  expect(board).toContain("Describe the blocker in 3 to 2,000 characters, then try again.");
  expect(board).toContain("note.trim().length>2000");
 });
});
