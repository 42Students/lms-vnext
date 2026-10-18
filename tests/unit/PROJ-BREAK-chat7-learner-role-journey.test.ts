import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {learnerOwnTaskCreateInputSchema} from "@/modules/projects/learner-own-task-input-model";
import {learnerTaskStatusInputSchema,canLearnerMoveOwnTask} from "@/modules/projects/learner-task-status-policy";
import {learnerProjectArchiveState} from "@/modules/projects/learner-project-archive-model";
import {learnerProjectReadFailureDisposition} from "@/modules/projects/learner-project-detail-error-model";

const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const sprintId="11111111-1111-4111-8111-111111111111";
const timestamp="2099-01-01T12:00:00.000Z";

describe("IIT Dharwad Learner project role journey: hostile edits and stale sessions",()=>{
 it("PROJ-BREAK-LEARNER-91 refuses spoofed project, membership and terminal-state task creation",()=>{
  const input={title:"Write tests",sprintId:null,expectedSprintUpdatedAt:null};
  expect(learnerOwnTaskCreateInputSchema.safeParse(input).success).toBe(true);
  for(const smuggled of [
   {assigneeMembershipId:sprintId},{collegeId:sprintId},{projectId:sprintId},
   {userId:sprintId},{status:"DONE"},{status:"IN_REVIEW"},
   {title:""},{title:"A".repeat(201)},
   {dueDate:"2099-02-31"},
  ]){
   expect(learnerOwnTaskCreateInputSchema.safeParse({...input,...smuggled}).success).toBe(false);
  }
  expect(learnerOwnTaskCreateInputSchema.safeParse({...input,sprintId}).success).toBe(false);
  expect(learnerOwnTaskCreateInputSchema.safeParse({...input,status:"IN_PROGRESS"}).success).toBe(false);
  expect(learnerOwnTaskCreateInputSchema.safeParse({
   ...input,sprintId,expectedSprintUpdatedAt:timestamp,status:"BLOCKED",
  }).success).toBe(false);
  expect(learnerOwnTaskCreateInputSchema.safeParse({
   ...input,sprintId,expectedSprintUpdatedAt:timestamp,status:"BLOCKED",
   blockerReason:"Waiting on mentor",
  }).success).toBe(true);
 });
 it("PROJ-BREAK-LEARNER-92 never lets the learner complete/review a task or smuggle blockers",()=>{
  for(const [from,to] of [
   ["TODO","IN_PROGRESS"],["TODO","BLOCKED"],["IN_PROGRESS","BLOCKED"],
   ["BLOCKED","IN_PROGRESS"],
  ])expect(canLearnerMoveOwnTask(from,to)).toBe(true);
  for(const from of ["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE","ACCEPTED"]){
   for(const to of ["TODO","IN_REVIEW","DONE","ACCEPTED"]){
    expect(canLearnerMoveOwnTask(from,to)).toBe(false);
   }
  }
  expect(learnerTaskStatusInputSchema.safeParse({
   status:"BLOCKED",expectedUpdatedAt:timestamp,
  }).success).toBe(false);
  expect(learnerTaskStatusInputSchema.safeParse({
   status:"IN_PROGRESS",expectedUpdatedAt:timestamp,blockerReason:"Leftover blocker",
  }).success).toBe(false);
  expect(learnerTaskStatusInputSchema.safeParse({
   status:"BLOCKED",expectedUpdatedAt:timestamp,blockerReason:"Blocked by deployment",
  }).success).toBe(true);
  expect(learnerTaskStatusInputSchema.safeParse({
   status:"DONE",expectedUpdatedAt:timestamp,
  }).success).toBe(false);
 });
 it("PROJ-BREAK-LEARNER-93 archived projects are read only and foreign project guesses do not disclose existence",()=>{
  expect(learnerProjectArchiveState("ARCHIVED")).toEqual({
   readOnly:true,label:"Archived · read only",
  });
  expect(learnerProjectArchiveState("ACTIVE").readOnly).toBe(false);
  for(const code of ["PROJECT_NOT_FOUND","PROJECT_ACCESS_DENIED","COLLEGE_NOT_FOUND"] as const)
   expect(learnerProjectReadFailureDisposition(code)).toBe("NOT_FOUND");
  expect(learnerProjectReadFailureDisposition("PROJECT_TASK_INVALID_STATE")).toBe("RETRY");
  const access=read("src/modules/projects/access.ts");
  expect(access).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(access).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(access).toContain("resolveOptionalModuleAccess(context)");
 });
 it("PROJ-BREAK-LEARNER-94 checks persisted actor grant and task/sprint/release state within each write transaction",()=>{
  const guard=read("src/modules/projects/learner-mutation-guard.ts");
  const create=read("src/modules/projects/learner-own-task-service.ts");
  const move=read("src/modules/projects/learner-task-status-service.ts");
  for(const source of [create,move]){
   expect(source).toMatch(/project\??\.status\s*!==\s*"ACTIVE"/);
   expect(source).toContain('scope.access!=="LEARNER"');
   expect(source).toContain('getDb().transaction(async tx=>');
  }
  expect(create).toContain("assertPersistedLearnerProjectMutation(tx,context,projectId,scope.collegeId)");
  expect(create).toContain('task.assigneeMembershipId!==membership.id');
  expect(guard).toContain("eq(projectMembers.canMutate,true)");
  expect(guard).toContain("isNull(projectMembers.endedAt)");
  expect(guard).toContain('eq(membershipRoles.role,"LEARNER")');
  expect(move).toContain("eq(projectTasks.assigneeMembershipId,membership.id)");
  expect(move).toContain('sprint?.status!=="ACTIVE"');
  expect(move).toContain('["PLANNED","IN_PROGRESS"].includes(release.status)');
 });
 it("PROJ-BREAK-LEARNER-95 refuses learner-created tasks in cancelled or shipped release states",()=>{
  const own=read("src/modules/projects/learner-own-task-service.ts");
  const pull=read("src/modules/projects/learner-backlog-pull-service.ts");
  const status=read("src/modules/projects/learner-task-status-service.ts");
  const allowed='["PLANNED","IN_PROGRESS"].includes(release.status)';
  expect(own).toContain(allowed);
  expect(pull).toContain(allowed);
  expect(status).toContain(allowed);
  expect(own).not.toContain('release.status==="SHIPPED"');
  expect(own).toContain('sprint.status!=="ACTIVE"');
  expect(own).toContain('getDb().transaction(async tx=>');
 });

});
