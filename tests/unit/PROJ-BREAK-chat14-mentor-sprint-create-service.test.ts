import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {createMentorProjectSprint} from "@/modules/projects/mentor-sprint-write-service";

const state=vi.hoisted(()=>({
 allowed:true,projectStatus:"ACTIVE",releaseStatus:"PLANNED",releasePresent:true,
 scopeCalls:0,projectLocks:0,actorChecks:0,releaseLocks:0,sequenceReads:0,
 writes:0,audits:0,lastWrite:{} as Record<string,unknown>,lastAudit:{} as Record<string,unknown>,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const releaseId="22222222-2222-4222-8222-222222222222";
const sprintId="33333333-3333-4333-8333-333333333333";
const context={user:{id:"mentor"},membership:{id:"member",collegeId:"college-a",
 organizationId:"org-a"}} as unknown as RequestContext;
const body={
 releaseId,title:"Sprint one",description:null,goal:"Build demo",definitionOfDone:"Demo accepted",
 startDate:"2099-01-01",endDate:"2099-01-10",dueDate:"2099-01-10",
};
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...v:unknown[])=>v,eq:(...v:unknown[])=>v,ne:(...v:unknown[])=>v,
 desc:(v:unknown)=>v,isNull:(v:unknown)=>v,
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.college_id",status:"project.status"},
 projectReleases:{id:"release.id",projectId:"release.project_id",
  status:"release.status",sequence:"release.sequence"},
 projectSprints:{id:"sprint.id",projectId:"sprint.project_id",
  releaseId:"sprint.release_id",sequence:"sprint.sequence"},
 projectTasks:{id:"task.id"},projectMembers:{id:"member.id"},
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleMutationAccess:async()=>{
  state.scopeCalls++;
  return {access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
   project:{id:projectId,status:state.projectStatus}};
 },
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.actorChecks++;
  if(!state.allowed)throw new Error("PROJECT_LIFECYCLE_ACCESS_DENIED");
 },
}));
vi.mock("@/modules/activity/taxonomy",()=>({
 ACTIVITY_EVENT_TYPES:{PROJECTS_SPRINT_UPDATED:"projects.sprint.updated"},
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async(_:unknown,__:unknown,event:Record<string,unknown>)=>{
  state.audits++;state.lastAudit=event;return {id:"event"};
 },
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(run:(tx:unknown)=>Promise<unknown>)=>{
   const tx={
    select:()=>({
     from:(table:unknown)=>({
      where:()=>({
       for:()=>({
        limit:async()=>{
         if(table && typeof table==="object" && "collegeId" in table){
          state.projectLocks++;
          return [{status:state.projectStatus}];
         }
         state.releaseLocks++;
         return state.releasePresent?[{id:releaseId,status:state.releaseStatus}]:[];
        },
       }),
       orderBy:()=>({
        limit:async()=>{state.sequenceReads++;return [{sequence:3}];},
       }),
      }),
     }),
    }),
    insert:()=>({
     values:(values:Record<string,unknown>)=>({
      returning:async()=>{
       state.lastWrite=values;state.writes++;
       return [{id:sprintId,...values}];
      },
     }),
    }),
   };
   return run(tx);
  },
 }),
}));
beforeEach(()=>{
 state.allowed=true;state.projectStatus="ACTIVE";state.releaseStatus="PLANNED";
 state.releasePresent=true;state.scopeCalls=0;state.projectLocks=0;
 state.actorChecks=0;state.releaseLocks=0;state.sequenceReads=0;
 state.writes=0;state.audits=0;state.lastWrite={};state.lastAudit={};
});
describe("IIT Dharwad Mentor Sprint creation state and access",()=>{
 it("PROJ-BREAK-MENTOR-308 creates exactly one planned sprint and audit in assigned project",async()=>{
  const sprint=await createMentorProjectSprint(context,{projectId},body);
  expect(sprint).toMatchObject({id:sprintId,projectId,releaseId,title:"Sprint one",
   status:"PLANNED",sequence:4});
  expect(state.scopeCalls).toBe(1);
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expect(state.releaseLocks).toBe(1);
  expect(state.writes).toBe(1);
  expect(state.audits).toBe(1);
  expect(state.lastAudit).toMatchObject({
   eventType:"projects.sprint.updated",collegeId:"college-a",
   metadata:{projectId,sprintId,action:"CREATE"},
  });
 });
 it("PROJ-BREAK-MENTOR-309 revoked Mentor grants abort before release lookup or creation",async()=>{
  state.allowed=false;
  await expect(createMentorProjectSprint(context,{projectId},body))
   .rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expect(state.releaseLocks).toBe(0);
  expect(state.writes+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-310 archived and completed projects cannot create new sprints",async()=>{
  for(const status of ["COMPLETED","ARCHIVED","UNKNOWN"]){
   state.projectStatus=status;
   await expect(createMentorProjectSprint(context,{projectId},body))
    .rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
  }
  expect(state.writes+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-311 shipped or missing releases deny before sequence reservation",async()=>{
  state.releaseStatus="SHIPPED";
  await expect(createMentorProjectSprint(context,{projectId},body))
   .rejects.toMatchObject({code:"PROJECT_RELEASE_INVALID_STATE"});
  state.releasePresent=false;
  await expect(createMentorProjectSprint(context,{projectId},body))
   .rejects.toMatchObject({code:"PROJECT_RELEASE_INVALID_STATE"});
  expect(state.sequenceReads).toBe(0);
  expect(state.writes+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-312 forged tenant and impossible Sprint dates fail strict parsing before scope",async()=>{
  for(const input of [
   {...body,collegeId:"foreign"},
   {...body,startDate:"2099-02-10",endDate:"2099-01-10"},
   {...body,releaseId:"wrong"},
  ]){
   await expect(createMentorProjectSprint(context,{projectId},input)).rejects.toThrow();
  }
  expect(state.scopeCalls).toBe(0);
  expect(state.writes+state.audits).toBe(0);
 });
});
