import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {
 startProjectSprint,completeProjectSprint,reopenProjectSprint,
 updateProjectTaskStatus,shipProjectRelease,unshipProjectRelease,
} from "@/modules/projects/lifecycle-service";

const state=vi.hoisted(()=>({
 accessCalls:0,projectLocks:0,persistedChecks:0,childReads:0,
 writes:0,audits:0,lockWhere:"",projectStatus:"ACTIVE",
}));
const projectId="11111111-1111-4111-8111-111111111111";
const sprintId="22222222-2222-4222-8222-222222222222";
const taskId="33333333-3333-4333-8333-333333333333";
const releaseId="44444444-4444-4444-8444-444444444444";
const version="2099-01-01T00:00:00.000Z";
const actor={user:{id:"mentor"},membership:{id:"member",collegeId:"college-a",
 organizationId:"org-a",roles:["MENTOR"]}} as unknown as RequestContext;
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...xs:unknown[])=>xs,eq:(...xs:unknown[])=>xs,
 ne:(...xs:unknown[])=>xs,isNull:(x:unknown)=>x,
 sql:(_part:TemplateStringsArray,...xs:unknown[])=>xs,
}));
vi.mock("node:crypto",()=>({randomUUID:()=>releaseId}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.college_id",status:"project.status"},
 projectReleases:{id:"release.id",projectId:"release.project_id"},
 projectSprints:{id:"sprint.id",projectId:"sprint.project_id"},
 projectTasks:{id:"task.id",projectId:"task.project_id"},
 projectMembers:{id:"member.id",projectId:"member.project_id"},
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleMutationAccess:async()=>{
  state.accessCalls++;
  return {access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
   project:{id:projectId,status:"ACTIVE"}};
 },
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.persistedChecks++;
  throw new Error("PROJECT_LIFECYCLE_ACCESS_DENIED");
 },
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.audits++;return {id:"event"};},
}));
vi.mock("@/modules/activity/taxonomy",()=>({ACTIVITY_EVENT_TYPES:{}}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(run:(tx:unknown)=>Promise<unknown>)=>{
   const tx={
    select:()=>({
     from:(table:unknown)=>({
      where:(conditions:unknown)=>({
       for:()=>({
        limit:async()=>{
         if(table && typeof table==="object" && "collegeId" in table){
          state.projectLocks++;
          state.lockWhere=JSON.stringify(conditions);
          return [{status:state.projectStatus}];
         }
         state.childReads++;
         throw new Error("Revoked actor accessed Sprint, task or Release");
        },
       }),
      }),
     }),
    }),
    update:()=>{state.writes++;throw new Error("Unexpected write");},
    insert:()=>{state.writes++;throw new Error("Unexpected insert");},
   };
   return run(tx);
  },
 }),
}));
beforeEach(()=>{
 state.accessCalls=0;state.projectLocks=0;state.persistedChecks=0;
 state.childReads=0;state.writes=0;state.audits=0;
 state.lockWhere="";state.projectStatus="ACTIVE";
});
const cases=[
 ["START Sprint",()=>startProjectSprint(actor,projectId,sprintId)],
 ["COMPLETE Sprint",()=>completeProjectSprint(actor,projectId,sprintId)],
 ["REOPEN Sprint",()=>reopenProjectSprint(actor,projectId,sprintId)],
 ["change task",()=>updateProjectTaskStatus(actor,projectId,taskId,{
  status:"IN_PROGRESS",expectedUpdatedAt:version,
 })],
 ["SHIP Release",()=>shipProjectRelease(actor,projectId,releaseId,{
  expectedUpdatedAt:version,
 })],
 ["UNSHIP Release",()=>unshipProjectRelease(actor,projectId,releaseId,{
  expectedUpdatedAt:version,
 })],
] as const;
describe("Shared Project lifecycle legacy route revocation guard",()=>{
 for(const [operation,invoke] of cases){
  it("PROJ-BREAK-MENTOR-338 "+operation+" locks scoped project and reauthorizes stale actor",async()=>{
   await expect(invoke()).rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
   expect(state.accessCalls).toBe(1);
   expect(state.projectLocks).toBe(1);
   expect(state.lockWhere).toContain("project.college_id");
   expect(state.lockWhere).toContain("college-a");
   expect(state.persistedChecks).toBe(1);
   expect(state.childReads).toBe(0);
   expect(state.writes).toBe(0);
   expect(state.audits).toBe(0);
  });
 }
});
