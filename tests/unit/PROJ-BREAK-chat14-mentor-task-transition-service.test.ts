import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {transitionMentorProjectTask} from "@/modules/projects/mentor-task-transition-service";

const state=vi.hoisted(()=>({
 actorAllowed:true,projectStatus:"ACTIVE",taskPresent:true,taskStatus:"IN_PROGRESS",
 sprintStatus:"ACTIVE",releaseStatus:"IN_PROGRESS",taskUpdatedAt:"2099-01-01T00:00:00.000Z",
 actorChecks:0,projectLocks:0,taskLocks:0,sprintLocks:0,releaseReads:0,
 writes:0,audits:0,lastUpdate:{} as Record<string,unknown>,lastAudit:{} as Record<string,unknown>,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const sprintId="33333333-3333-4333-8333-333333333333";
const releaseId="44444444-4444-4444-8444-444444444444";
const version="2099-01-01T00:00:00.000Z";
const context={user:{id:"mentor"},membership:{id:"member",collegeId:"college-a",
 organizationId:"org-a"}} as unknown as RequestContext;
const path={projectId,taskId};
const blocked={status:"BLOCKED",expectedUpdatedAt:version,confirmed:true,
 blockerReason:"Waiting for lab"};
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...xs:unknown[])=>xs,eq:(...xs:unknown[])=>xs,
 sql:(_parts:TemplateStringsArray,...xs:unknown[])=>xs,
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.college_id",status:"project.status"},
 projectTasks:{id:"task.id",projectId:"task.project_id",
  sprintId:"task.sprint_id",status:"task.status",updatedAt:"task.updated_at"},
 projectSprints:{id:"sprint.id",projectId:"sprint.project_id",
  status:"sprint.status",releaseId:"sprint.release_id"},
 projectReleases:{id:"release.id",projectId:"release.project_id",status:"release.status"},
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleMutationAccess:async()=>({
  access:"MENTOR",collegeId:"college-a",organizationId:"org-a",project:{id:projectId},
 }),
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.actorChecks++;
  if(!state.actorAllowed)throw new Error("PROJECT_LIFECYCLE_ACCESS_DENIED");
 },
}));
vi.mock("@/modules/activity/taxonomy",()=>({
 ACTIVITY_EVENT_TYPES:{PROJECTS_TASK_STATUS_CHANGED:"projects.task.status_changed"},
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
     from:(table:unknown)=>{
      const project=Boolean(table && typeof table==="object" && "collegeId" in table);
      const task=Boolean(table && typeof table==="object" && "updatedAt" in table);
      const sprint=Boolean(table && typeof table==="object" && "releaseId" in table);
      const query={
       where:()=>query,
       for:()=>({
        limit:async()=>{
         if(project){state.projectLocks++;return [{status:state.projectStatus}];}
         if(task){state.taskLocks++;return state.taskPresent?[{
          id:taskId,projectId,sprintId,status:state.taskStatus,
          updatedAt:new Date(state.taskUpdatedAt),title:"Build demo",blockerReason:null,
         }]:[];}
         if(sprint){state.sprintLocks++;return [{status:state.sprintStatus,releaseId}];}
         return [];
        },
       }),
       limit:async()=>{state.releaseReads++;return [{status:state.releaseStatus}];},
      };
      return query;
     },
    }),
    update:()=>({
     set:(values:Record<string,unknown>)=>({
      where:()=>({
       returning:async()=>{
        state.lastUpdate=values;state.writes++;
        return [{id:taskId,projectId,title:"Build demo",...values}];
       },
      }),
     }),
    }),
   };
   return run(tx);
  },
 }),
}));
beforeEach(()=>{
 state.actorAllowed=true;state.projectStatus="ACTIVE";state.taskPresent=true;
 state.taskStatus="IN_PROGRESS";state.sprintStatus="ACTIVE";state.releaseStatus="IN_PROGRESS";
 state.taskUpdatedAt=version;state.actorChecks=0;state.projectLocks=0;
 state.taskLocks=0;state.sprintLocks=0;state.releaseReads=0;
 state.writes=0;state.audits=0;state.lastUpdate={};state.lastAudit={};
});
describe("Mentor task transition persisted workflow",()=>{
 it("PROJ-BREAK-MENTOR-313 blocks an active task with one audit and recorded reason",async()=>{
  const task=await transitionMentorProjectTask(context,path,blocked);
  expect(task).toMatchObject({id:taskId,status:"BLOCKED",blockerReason:"Waiting for lab"});
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expect(state.taskLocks).toBe(1);
  expect(state.sprintLocks).toBe(1);
  expect(state.releaseReads).toBe(1);
  expect(state.writes).toBe(1);
  expect(state.audits).toBe(1);
  expect(state.lastAudit).toMatchObject({
   eventType:"projects.task.status_changed",
   metadata:{projectId,taskId,previousStatus:"IN_PROGRESS",nextStatus:"BLOCKED"},
  });
 });
 it("PROJ-BREAK-MENTOR-314 unblocking clears stale blocker text",async()=>{
  state.taskStatus="BLOCKED";
  const task=await transitionMentorProjectTask(context,path,{
   status:"TODO",expectedUpdatedAt:version,confirmed:true,
  });
  expect(task).toMatchObject({status:"TODO",blockerReason:null});
  expect(state.lastUpdate.blockerReason).toBeNull();
  expect(state.audits).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-315 revoked Mentor cannot read task or write audit after parent lock",async()=>{
  state.actorAllowed=false;
  await expect(transitionMentorProjectTask(context,path,blocked))
   .rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.projectLocks).toBe(1);
  expect(state.taskLocks).toBe(0);
  expect(state.writes+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-316 terminal/invalid task states and stale versions abort before mutation",async()=>{
  for(const status of ["IN_REVIEW","DONE"]){
   state.taskStatus=status;
   await expect(transitionMentorProjectTask(context,path,blocked))
    .rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
  }
  state.taskStatus="IN_PROGRESS";state.taskUpdatedAt="2099-01-01T00:00:00.001Z";
  await expect(transitionMentorProjectTask(context,path,blocked))
   .rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
  expect(state.writes+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-317 inactive sprint or shipped release cannot advance task",async()=>{
  state.sprintStatus="COMPLETED";
  await expect(transitionMentorProjectTask(context,path,blocked))
   .rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
  state.sprintStatus="ACTIVE";state.releaseStatus="SHIPPED";
  await expect(transitionMentorProjectTask(context,path,blocked))
   .rejects.toMatchObject({code:"PROJECT_TASK_INVALID_STATE"});
  expect(state.writes+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-318 cannot fake DONE or BLOCKED without explanation",async()=>{
  for(const input of [
   {status:"DONE",expectedUpdatedAt:version,confirmed:true},
   {status:"BLOCKED",expectedUpdatedAt:version,confirmed:true},
   {status:"TODO",expectedUpdatedAt:version,confirmed:false},
  ]){
   await expect(transitionMentorProjectTask(context,path,input)).rejects.toThrow();
  }
  expect(state.projectLocks).toBe(0);
  expect(state.writes+state.audits).toBe(0);
 });
});
