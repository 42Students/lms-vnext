import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {createMentorProjectTask} from "@/modules/projects/mentor-task-create-service";
import {updateMentorTaskDetails} from "@/modules/projects/mentor-task-details-service";

const state=vi.hoisted(()=>({
 enabled:true,scopeCalls:0,projectLocks:0,actorChecks:0,
 childReads:0,writes:0,audits:0,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const context={
 user:{id:"mentor-user",platformStatus:"ACTIVE"},
 membership:{id:"mentor-member",status:"ACTIVE",collegeId:"college-a",
  organizationId:"org-a",roles:["MENTOR"]},
} as unknown as RequestContext;

vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...items:unknown[])=>items,eq:(...items:unknown[])=>items,
 desc:(item:unknown)=>item,isNull:(item:unknown)=>item,
 sql:(_parts:TemplateStringsArray,...values:unknown[])=>values,
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",status:"project.status",collegeId:"project.college_id"},
 projectTasks:{id:"task.id",projectId:"task.project_id",updatedAt:"task.updated_at"},
 projectSprints:{id:"sprint.id",projectId:"sprint.project_id"},
 projectReleases:{id:"release.id",projectId:"release.project_id"},
 collegeMemberships:{},membershipRoles:{},projectMembers:{},users:{},
}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>true,
 hasMembershipRole:(_:unknown,role:string)=>role==="MENTOR",
}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>true}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleAccess:async()=>{
  state.scopeCalls++;
  return {access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
   project:{id:projectId,status:"ACTIVE"}};
 },
 requireProjectLifecycleMutationAccess:async()=>{
  state.scopeCalls++;
  return {access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
   project:{id:projectId,status:"ACTIVE"}};
 },
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.actorChecks++;
  throw new Error("PROJECT_LIFECYCLE_ACCESS_DENIED");
 },
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.audits++;},
}));
vi.mock("@/modules/activity/taxonomy",()=>({ACTIVITY_EVENT_TYPES:{}}));
vi.mock("@/modules/projects/project-notification-service",()=>({
 notifyProjectMemberships:async()=>{throw new Error("Unexpected notification");},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(callback:(tx:unknown)=>Promise<unknown>)=>{
   const tx={
    select:()=>({
     from:(table:unknown)=>({
      where:()=>({
       for:()=>({
        limit:async()=>{
         if(table && typeof table==="object" && "collegeId" in table){
          state.projectLocks++;
          return [{status:"ACTIVE"}];
         }
         state.childReads++;
         throw new Error("Unauthorized child lookup");
        },
       }),
      }),
     }),
    }),
    update:()=>{state.writes++;throw new Error("Unexpected update");},
    insert:()=>{state.writes++;throw new Error("Unexpected insert");},
    delete:()=>{state.writes++;throw new Error("Unexpected delete");},
   };
   return callback(tx);
  },
 }),
}));

const createInput={
 sprintId:null,title:"Build prototype",description:null,
 acceptanceCriteria:null,priority:"MEDIUM",expectedSprintUpdatedAt:null,
};
const detailInput={
 title:"New title",description:null,acceptanceCriteria:null,priority:"MEDIUM",
 expectedUpdatedAt:"2099-01-01T00:00:00.000Z",
};
beforeEach(()=>{
 state.enabled=true;state.scopeCalls=0;state.projectLocks=0;
 state.actorChecks=0;state.childReads=0;state.writes=0;state.audits=0;
});
describe("Mentor task write transaction permissions",()=>{
 it("PROJ-BREAK-MENTOR-218 denies task creation when Projects is disabled without resolving project identity",async()=>{
  state.enabled=false;
  await expect(createMentorProjectTask(context,{projectId},createInput))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.scopeCalls).toBe(0);
  expect(state.projectLocks).toBe(0);
  expect(state.childReads+state.writes+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-219 rechecks Mentor project assignment under parent lock before task creation",async()=>{
  await expect(createMentorProjectTask(context,{projectId},createInput))
   .rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.scopeCalls).toBe(1);
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expect(state.childReads+state.writes+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-220 prevents revoked Mentor from changing task details",async()=>{
  await expect(updateMentorTaskDetails(context,{projectId,taskId},detailInput))
   .rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.scopeCalls).toBe(1);
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expect(state.childReads+state.writes+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-221 rejects injected or malformed task identifiers before permission or DB reads",async()=>{
  await expect(createMentorProjectTask(context,{projectId,collegeId:"foreign"},createInput))
   .rejects.toThrow();
  await expect(updateMentorTaskDetails(context,{projectId,taskId:"../foreign"},detailInput))
   .rejects.toThrow();
  expect(state.scopeCalls).toBe(0);
  expect(state.projectLocks).toBe(0);
  expect(state.childReads+state.writes+state.audits).toBe(0);
 });
});
