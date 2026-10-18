import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {updateMentorProjectOverview} from "@/modules/projects/mentor-overview-edit-service";
import {deleteMentorProjectSprint} from "@/modules/projects/mentor-sprint-delete-service";
import {deleteMentorProjectTask} from "@/modules/projects/mentor-task-delete-service";
import {lockMentorFinalDelivery} from "@/modules/projects/mentor-delivery-lock-service";
import {getMentorTaskFeedback} from "@/modules/projects/mentor-task-feedback-service";

const state=vi.hoisted(()=>({
 enabled:true,scopeCalls:0,projectLocks:0,actorChecks:0,
 childReads:0,writes:0,audits:0,notices:0,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const childId="22222222-2222-4222-8222-222222222222";
const time="2099-01-01T00:00:00.000Z";
const context={
 user:{id:"mentor-user",platformStatus:"ACTIVE"},
 membership:{id:"mentor-member",status:"ACTIVE",collegeId:"college-a",
  organizationId:"org-a",roles:["MENTOR"]},
} as unknown as RequestContext;
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...xs:unknown[])=>xs,eq:(...xs:unknown[])=>xs,
 or:(...xs:unknown[])=>xs,isNull:(x:unknown)=>x,
 desc:(x:unknown)=>x,isNotNull:(x:unknown)=>x,
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",status:"project.status",collegeId:"project.college_id"},
 projectTasks:{id:"task.id"},projectSprints:{id:"sprint.id"},
 projectReleases:{id:"release.id"},projectMeetings:{id:"meeting.id"},
 projectTaskSubmissions:{id:"submission.id"},projectTaskComments:{id:"comment.id"},
 projectSubmissions:{id:"final_delivery.id"},projectDeliveryEvents:{id:"final_event.id"},
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleMutationAccess:async()=>{
  state.scopeCalls++;
  return {access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
   project:{id:projectId,status:"ACTIVE"}};
 },
 requireProjectReadAccess:async()=>{
  state.scopeCalls++;
  return {access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
   project:{id:projectId,status:"ACTIVE"}};
 },
}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>true,hasMembershipRole:(_:unknown,role:string)=>role==="MENTOR",
}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>true}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.actorChecks++;
  throw new Error("PROJECT_LIFECYCLE_ACCESS_DENIED");
 },
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.audits++;return {id:"event"};},
}));
vi.mock("@/modules/activity/taxonomy",()=>({ACTIVITY_EVENT_TYPES:{}}));
vi.mock("@/modules/projects/project-notification-service",()=>({
 notifyActiveProjectMembers:async()=>{state.notices++;},
 notifyProjectMemberships:async()=>{state.notices++;},
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
          return [{id:projectId,status:"ACTIVE",updatedAt:new Date(time)}];
         }
         state.childReads++;
         throw new Error("Revoked actor read a child record");
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
  select:()=>{state.childReads++;throw new Error("Unauthorized feedback read");},
 }),
}));
beforeEach(()=>{
 state.enabled=true;state.scopeCalls=0;state.projectLocks=0;state.actorChecks=0;
 state.childReads=0;state.writes=0;state.audits=0;state.notices=0;
});
function expectNoSideEffects(){
 expect(state.childReads).toBe(0);
 expect(state.writes).toBe(0);
 expect(state.audits).toBe(0);
 expect(state.notices).toBe(0);
}
describe("Mentor destructive operations revoke stale session grants",()=>{
 it("PROJ-BREAK-MENTOR-230 refuses overview edits after persisted Mentor revocation",async()=>{
  await expect(updateMentorProjectOverview(context,projectId,{
   summary:"Summary",dueLabel:null,blocker:null,nextAction:null,expectedUpdatedAt:time,
  })).rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expectNoSideEffects();
 });
 it("PROJ-BREAK-MENTOR-231 rejects deleting sprint after project Mentor grant revocation",async()=>{
  await expect(deleteMentorProjectSprint(context,{projectId,sprintId:childId},{
   expectedUpdatedAt:time,confirmUnlink:true,
  })).rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expectNoSideEffects();
 });
 it("PROJ-BREAK-MENTOR-232 refuses task deletion after project Mentor grant revocation",async()=>{
  await expect(deleteMentorProjectTask(context,projectId,childId,{
   expectedUpdatedAt:time,confirm:true,
  })).rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expectNoSideEffects();
 });
 it("PROJ-BREAK-MENTOR-233 disallows locking final delivery after revoked project assignment",async()=>{
  await expect(lockMentorFinalDelivery(context,projectId,childId,{
   reason:"Approved demo",expectedUpdatedAt:time,
  })).rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expectNoSideEffects();
 });
 it("PROJ-BREAK-MENTOR-234 denies task feedback ID lookup if Projects is disabled",async()=>{
  state.enabled=false;
  await expect(getMentorTaskFeedback(context,{projectId,taskId:childId}))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.scopeCalls).toBe(0);
  expect(state.projectLocks).toBe(0);
  expectNoSideEffects();
 });
});
