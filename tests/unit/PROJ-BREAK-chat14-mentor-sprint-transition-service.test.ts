import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {transitionMentorProjectSprint} from "@/modules/projects/mentor-sprint-write-service";

const state=vi.hoisted(()=>({
 persistedAllowed:true,projectStatus:"ACTIVE",sprintStatus:"PLANNED",
 releaseStatus:"PLANNED",primaryPresent:true,activeSibling:false,openTask:false,
 token:"2099-01-01T00:00:00.000Z",actorChecks:0,projectLocks:0,
 sprintLocks:0,releaseLocks:0,primaryReads:0,activeReads:0,taskReads:0,
 updates:0,audits:0,lastAudit:{} as Record<string,unknown>,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const sprintId="22222222-2222-4222-8222-222222222222";
const releaseId="33333333-3333-4333-8333-333333333333";
const token="2099-01-01T00:00:00.000Z";
const context={user:{id:"mentor"},membership:{id:"member",collegeId:"college-a",
 organizationId:"org-a"}} as unknown as RequestContext;
const path={projectId,sprintId};
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...v:unknown[])=>v,eq:(...v:unknown[])=>v,
 ne:(...v:unknown[])=>v,isNull:(x:unknown)=>x,desc:(x:unknown)=>x,
 sql:(parts:TemplateStringsArray,...values:unknown[])=>
  parts.reduce((s,p,i)=>s+p+(i<values.length?String(values[i]):""),""),
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.college_id",status:"project.status"},
 projectReleases:{id:"release.id",projectId:"release.project_id",
  status:"release.status",releaseId:"release.release_id"},
 projectSprints:{id:"sprint.id",projectId:"sprint.project_id",
  status:"sprint.status",releaseId:"sprint.release_id",updatedAt:"sprint.updated_at"},
 projectTasks:{id:"task.id",projectId:"task.project_id",
  sprintId:"task.sprint_id",status:"task.status"},
 projectMembers:{id:"member.id",projectId:"member.project_id",
  role:"member.role",isPrimary:"member.primary",endedAt:"member.ended_at"},
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleMutationAccess:async()=>({
  access:"MENTOR",collegeId:"college-a",organizationId:"org-a",project:{id:projectId},
 }),
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.actorChecks++;
  if(!state.persistedAllowed)throw new Error("PROJECT_LIFECYCLE_ACCESS_DENIED");
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
     from:(table:unknown)=>{
      const project=Boolean(table&&typeof table==="object"&&"collegeId" in table);
      const member=Boolean(table&&typeof table==="object"&&"isPrimary" in table);
      const sprint=Boolean(table&&typeof table==="object"&&"updatedAt" in table);
      const release=Boolean(table&&typeof table==="object"&&"releaseId" in table&&!sprint);
      const task=Boolean(table&&typeof table==="object"&&"sprintId" in table&&!sprint);
      const query={
       where:()=>query,
       for:()=>({
        limit:async()=>{
         if(project){state.projectLocks++;return [{id:projectId,status:state.projectStatus}];}
         if(sprint){state.sprintLocks++;return [{
          id:sprintId,projectId,releaseId,title:"Sprint",status:state.sprintStatus,
          updatedAt:new Date(state.token),
         }];}
         if(release){state.releaseLocks++;return [{id:releaseId,status:state.releaseStatus}];}
         return [];
        },
       }),
       limit:async()=>{
        if(member){state.primaryReads++;return state.primaryPresent?[{id:"primary"}]:[];}
        if(task){state.taskReads++;return state.openTask?[{id:"open-task"}]:[];}
        if(sprint){state.activeReads++;return state.activeSibling?[{id:"other-sprint"}]:[];}
        return [];
       },
      };
      return query;
     },
    }),
    update:(_table:unknown)=>({
     set:(values:Record<string,unknown>)=>({
      where:()=>{
       state.updates++;
       return {
        returning:async()=>[{id:sprintId,projectId,title:"Sprint",
          status:values.status??state.sprintStatus,updatedAt:values.updatedAt??new Date(state.token)}],
       };
      },
     }),
    }),
   };
   return run(tx);
  },
 }),
}));
beforeEach(()=>{
 state.persistedAllowed=true;state.projectStatus="ACTIVE";
 state.sprintStatus="PLANNED";state.releaseStatus="PLANNED";
 state.primaryPresent=true;state.activeSibling=false;state.openTask=false;
 state.token=token;state.actorChecks=0;state.projectLocks=0;
 state.sprintLocks=0;state.releaseLocks=0;state.primaryReads=0;
 state.activeReads=0;state.taskReads=0;state.updates=0;state.audits=0;state.lastAudit={};
});
const change=async(action:"START"|"COMPLETE"|"REOPEN")=>
 transitionMentorProjectSprint(context,path,{action,expectedUpdatedAt:token});
describe("Mentor Sprint locked lifecycle transitions",()=>{
 it("PROJ-BREAK-MENTOR-319 START records an active Sprint and exactly one activity",async()=>{
  const result=await change("START");
  expect(result.status).toBe("ACTIVE");
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expect(state.primaryReads).toBe(1);
  expect(state.sprintLocks).toBe(1);
  expect(state.releaseLocks).toBe(1);
  expect(state.activeReads).toBe(1);
  expect(state.updates).toBe(2);
  expect(state.audits).toBe(1);
  expect(state.lastAudit).toMatchObject({eventType:"projects.sprint.updated",
   metadata:{projectId,sprintId,action:"START",from:"PLANNED",to:"ACTIVE"}});
 });
 it("PROJ-BREAK-MENTOR-320 COMPLETE requires no open tasks and records status",async()=>{
  state.sprintStatus="ACTIVE";
  const result=await change("COMPLETE");
  expect(result.status).toBe("COMPLETED");
  expect(state.primaryReads).toBe(0);
  expect(state.taskReads).toBe(1);
  expect(state.updates).toBe(1);
  expect(state.audits).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-321 REOPEN returns a completed Sprint to active",async()=>{
  state.sprintStatus="COMPLETED";
  const result=await change("REOPEN");
  expect(result.status).toBe("ACTIVE");
  expect(state.audits).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-322 revoked Mentor denies before reading primary or Sprint",async()=>{
  state.persistedAllowed=false;
  await expect(change("START")).rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expect(state.primaryReads+state.sprintLocks+state.updates+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-323 missing primary or another active Sprint prevents START",async()=>{
  state.primaryPresent=false;
  await expect(change("START")).rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
  state.primaryPresent=true;state.activeSibling=true;
  await expect(change("START")).rejects.toMatchObject({code:"PROJECT_SPRINT_ALREADY_ACTIVE"});
  expect(state.updates+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-324 open tasks and shipped Release block completion or reopening",async()=>{
  state.sprintStatus="ACTIVE";state.openTask=true;
  await expect(change("COMPLETE")).rejects.toMatchObject({code:"PROJECT_SPRINT_HAS_OPEN_TASKS"});
  state.sprintStatus="COMPLETED";state.releaseStatus="SHIPPED";
  await expect(change("REOPEN")).rejects.toMatchObject({code:"PROJECT_RELEASE_INVALID_STATE"});
  expect(state.updates+state.audits).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-325 mismatched status and stale version do not mutate",async()=>{
  await expect(change("COMPLETE")).rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
  state.token="2099-01-01T00:00:00.001Z";
  await expect(change("START")).rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
  expect(state.updates+state.audits).toBe(0);
 });
});
