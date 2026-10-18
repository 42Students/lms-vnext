import {describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";

const state=vi.hoisted(()=>({scope:vi.fn(),db:vi.fn()}));
vi.mock("@/modules/projects/access",()=>({requireProjectReadAccess:state.scope}));
vi.mock("@/db/client",()=>({getDb:state.db}));
vi.mock("@/modules/activity/service",()=>({recordActivityEventInTransaction:vi.fn()}));
vi.mock("@/modules/projects/project-notification-service",()=>({notifyActiveProjectMembers:vi.fn()}));
import {learnerBacklogPullInputSchema,pullOwnBacklogTask} from "@/modules/projects/learner-backlog-pull-service";

const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const sprintId="33333333-3333-4333-8333-333333333333";
const version="2026-10-18T05:30:00.123Z";
const valid={taskId,sprintId,expectedUpdatedAt:version};
const actor={user:{id:"44444444-4444-4444-8444-444444444444"},
 membership:{id:"55555555-5555-4555-8555-555555555555",roles:["LEARNER"]}} as unknown as Parameters<typeof pullOwnBacklogTask>[0];

describe("PROJ-BREAK-LEARNER-BACKLOG-01 stale-tab and malformed command rejection",()=>{
 it("denies forged tenant, actor, status and unexpected keys under strict payload policy",()=>{
  expect(learnerBacklogPullInputSchema.safeParse(valid).success).toBe(true);
  for(const spoofed of [
   {...valid,taskId:"foreign"}, {...valid,sprintId:"wrong"},
   {...valid,expectedUpdatedAt:"yesterday"}, {...valid,collegeId:projectId},
   {...valid,assigneeMembershipId:actor.membership?.id}, {...valid,status:"DONE"},
   {...valid,updatedAt:version},{...valid,expectedUpdatedAt:null},
   {...valid,expectedUpdatedAt:"2026-10-18"},
  ])expect(learnerBacklogPullInputSchema.safeParse(spoofed).success).toBe(false);
 });
 it("bad input fails before project authorization, database writes or notifications",async()=>{
  state.scope.mockReset();state.db.mockReset();
  await expect(pullOwnBacklogTask(actor,projectId,{...valid,sprintId:"not-uuid"})).rejects.toThrow();
  expect(state.scope).not.toHaveBeenCalled();
  expect(state.db).not.toHaveBeenCalled();
 });
 it("stale client tokens use persisted millisecond-precision CAS and never plain timestamp equality",()=>{
  const source=readFileSync("src/modules/projects/learner-backlog-pull-service.ts","utf8");
  expect(source).toContain('task.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt)');
  expect(source).toContain("date_trunc('milliseconds',");
  expect(source).toContain("new Date(input.expectedUpdatedAt).toISOString()");
  expect(source).not.toContain("eq(projectTasks.updatedAt,task.updatedAt)");
 });
 it("denies a learner attempting to pull a task from a different role's project before a DB transaction",async()=>{
  state.scope.mockResolvedValueOnce({access:"MENTOR",project:{id:projectId}});
  state.db.mockClear();
  await expect(pullOwnBacklogTask(actor,projectId,valid)).rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.db).not.toHaveBeenCalled();
 });
});
