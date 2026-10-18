import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getMentorProjectCloseout,completeMentorProject}
 from "@/modules/projects/mentor-closeout-service";
import {closeoutChecklist} from "@/modules/projects/mentor-closeout-model";

const state=vi.hoisted(()=>({
 enabled:true,scopeCalls:0,projectLocks:0,actorChecks:0,
 childReads:0,writes:0,audits:0,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const iso="2099-01-01T00:00:00.000Z";
const context={
 user:{id:"mentor-user",platformStatus:"ACTIVE"},
 membership:{id:"mentor-member",status:"ACTIVE",collegeId:"college-a",
  organizationId:"org-a",roles:["MENTOR"]},
} as unknown as RequestContext;
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...v:unknown[])=>v,eq:(...v:unknown[])=>v,
 desc:(x:unknown)=>x,ne:(...v:unknown[])=>v,
 count:()=>1,
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.college_id",status:"project.status"},
 projectSubmissions:{},projectTasks:{},projectSprints:{},projectReleases:{},
}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>true,hasMembershipRole:(_:unknown,role:string)=>role==="MENTOR",
}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>true}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleAccess:async()=>{
  state.scopeCalls++;
  return {access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
   project:{id:projectId,title:"Demo",status:"ACTIVE",updatedAt:new Date(iso)}};
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
          return [{id:projectId,status:"ACTIVE",updatedAt:new Date(iso)}];
         }
         state.childReads++;
         throw new Error("Child queried after Mentor revocation");
        },
       }),
      }),
     }),
    }),
    update:()=>{state.writes++;throw new Error("Unexpected mutation");},
   };
   return callback(tx);
  },
  select:()=>{state.childReads++;throw new Error("Disabled tenant read");},
 }),
}));
beforeEach(()=>{
 state.enabled=true;state.scopeCalls=0;state.projectLocks=0;
 state.actorChecks=0;state.childReads=0;state.writes=0;state.audits=0;
});
const body={
 expectedUpdatedAt:iso,confirmDeliveryReviewed:true,
 confirmTeamNotified:true,confirmCloseout:true,
};
describe("Mentor closeout authorization and checklist",()=>{
 it("PROJ-BREAK-MENTOR-235 denies disabled Projects before resolving closeout identity",async()=>{
  state.enabled=false;
  await expect(getMentorProjectCloseout(context,{projectId}))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  await expect(completeMentorProject(context,{projectId},body))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.scopeCalls).toBe(0);
  expect(state.projectLocks).toBe(0);
  expect(state.childReads+state.writes+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-236 rescinded project grant prevents closeout facts or completion",async()=>{
  await expect(completeMentorProject(context,{projectId},body))
   .rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.scopeCalls).toBe(1);
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expect(state.childReads+state.writes+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-237 refuses every incomplete closeout state even with approved delivery",()=>{
  const baseline={projectStatus:"ACTIVE",approved:true,openTasks:0,
   openSprints:0,openReleases:0};
  expect(closeoutChecklist(baseline).canComplete).toBe(true);
  for(const patch of [
   {projectStatus:"PLANNED"},{projectStatus:"COMPLETED"},{projectStatus:"ARCHIVED"},
   {approved:false},{openTasks:1},{openSprints:1},{openReleases:1},
  ]){
   expect(closeoutChecklist({...baseline,...patch}).canComplete).toBe(false);
  }
 });
 it("PROJ-BREAK-MENTOR-238 rejects missing confirmation and forged tenant closeout input",async()=>{
  await expect(completeMentorProject(context,{projectId},{
   ...body,confirmTeamNotified:false,
  })).rejects.toThrow();
  await expect(completeMentorProject(context,{projectId,collegeId:"foreign"},body))
   .rejects.toThrow();
  expect(state.scopeCalls).toBe(0);
  expect(state.projectLocks).toBe(0);
 });
});
