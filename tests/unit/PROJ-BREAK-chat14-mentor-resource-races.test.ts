import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {
 listProjectResources,createProjectResource,updateProjectResource,
 archiveProjectResource,reorderProjectResources,projectResourceReorderSchema,
} from "@/modules/projects/resource-service";

const state=vi.hoisted(()=>({
 enabled:true,persistedAllowed:false,scopeReads:0,projectLocks:0,actorChecks:0,
 resourceReads:0,updates:0,audits:0,notices:0,
 resources:[] as Array<{id:string;sequence:number;status:string}>,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const r1="22222222-2222-4222-8222-222222222222";
const r2="33333333-3333-4333-8333-333333333333";
const version="2099-01-01T00:00:00.000Z";
const context={
 user:{id:"mentor",platformStatus:"ACTIVE"},
 membership:{id:"mentor-member",collegeId:"college-a",organizationId:"org-a",
  roles:["MENTOR"],status:"ACTIVE"},
} as unknown as RequestContext;
const scope={access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
 project:{id:projectId,status:"ACTIVE"}};
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...xs:unknown[])=>xs,eq:(...xs:unknown[])=>xs,
 asc:(x:unknown)=>x,desc:(x:unknown)=>x,
 isNull:(x:unknown)=>["isNull",x],
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.college_id",status:"project.status"},
 projectResources:{id:"resource.id",projectId:"resource.project_id",
  status:"resource.status",sequence:"resource.sequence"},
 projectSprints:{id:"sprint.id"},projectTasks:{id:"task.id"},
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async()=>{state.scopeReads++;return scope;},
 requireProjectLifecycleMutationAccess:async()=>{state.scopeReads++;return scope;},
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.actorChecks++;
  if(!state.persistedAllowed)throw new Error("PROJECT_LIFECYCLE_ACCESS_DENIED");
 },
}));
vi.mock("@/modules/activity/taxonomy",()=>({
 ACTIVITY_EVENT_TYPES:{PROJECTS_RESOURCE_UPDATED:"projects.resource.updated"},
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.audits++;return {id:"event"};},
}));
vi.mock("@/modules/projects/project-notification-service",()=>({
 notifyActiveProjectMembers:async()=>{state.notices++;},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(run:(tx:unknown)=>Promise<unknown>)=>{
   const tx={
    select:()=>({
     from:(table:unknown)=>{
      const project=Boolean(table && typeof table==="object" && "collegeId" in table);
      const query={
       where:()=>query,
       orderBy:()=>query,
       for:()=>{
        if(project)return {limit:async()=>{
         state.projectLocks++;
         return [{status:"ACTIVE"}];
        }};
        state.resourceReads++;
        return Promise.resolve(state.resources);
       },
       limit:async()=>{
        state.resourceReads++;
        throw new Error("Unauthorized child lookup");
       },
      };
      return query;
     },
    }),
    update:()=>({
     set:()=>({
      where:async()=>{state.updates++;return [];},
     }),
    }),
   };
   return run(tx);
  },
  select:()=>{state.resourceReads++;throw new Error("Unlicensed resource lookup");},
 }),
}));
beforeEach(()=>{
 state.enabled=true;state.persistedAllowed=false;state.scopeReads=0;
 state.projectLocks=0;state.actorChecks=0;state.resourceReads=0;
 state.updates=0;state.audits=0;state.notices=0;state.resources=[
  {id:r1,status:"ACTIVE",sequence:0},{id:r2,status:"ACTIVE",sequence:1},
 ];
});
const resource={title:"Reference",description:"Documentation of APIs"};
const expected={expectedUpdatedAt:version};
function clean(){
 expect(state.resourceReads+state.updates+state.audits+state.notices).toBe(0);
}
describe("Mentor resource mutation and reorder permission matrix",()=>{
 it("PROJ-BREAK-MENTOR-274 disabled Projects prevents resource list and creation project enumeration",async()=>{
  state.enabled=false;
  await expect(listProjectResources(context,projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  await expect(createProjectResource(context,projectId,resource))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(state.scopeReads).toBe(0);
  expect(state.projectLocks).toBe(0);
  clean();
 });
 it("PROJ-BREAK-MENTOR-275 Mentor grant revocation aborts create before resource sequence read",async()=>{
  await expect(createProjectResource(context,projectId,resource))
   .rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  clean();
 });
 it("PROJ-BREAK-MENTOR-276 stale Mentor cannot edit, archive or reorder resources",async()=>{
  const operations=[
   ()=>updateProjectResource(context,projectId,r1,{title:"Rename",...expected}),
   ()=>archiveProjectResource(context,projectId,r1,expected),
   ()=>reorderProjectResources(context,projectId,{orderIds:[r2,r1],expectedOrderIds:[r1,r2]}),
  ];
  for(const operation of operations){
   await expect(operation()).rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  }
  expect(state.projectLocks).toBe(3);
  expect(state.actorChecks).toBe(3);
  clean();
 });
 it("PROJ-BREAK-MENTOR-277 resource reorder rejects duplicate, missing and forged identifiers",()=>{
  expect(projectResourceReorderSchema.safeParse({orderIds:[r1,r1]}).success).toBe(false);
  expect(projectResourceReorderSchema.safeParse({orderIds:[]}).success).toBe(false);
  expect(projectResourceReorderSchema.safeParse({orderIds:[r1],collegeId:"foreign"}).success).toBe(false);
  expect(projectResourceReorderSchema.safeParse({orderIds:[r1,"other"]}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-278 reorder produces one audit event after committed sequence moves",async()=>{
  state.persistedAllowed=true;
  const outcome=await reorderProjectResources(context,projectId,{orderIds:[r2,r1],expectedOrderIds:[r1,r2]});
  expect(outcome).toEqual({changed:true,count:2});
  expect(state.actorChecks).toBe(1);
  expect(state.projectLocks).toBe(1);
  expect(state.resourceReads).toBe(1);
  expect(state.updates).toBe(4);
  expect(state.audits).toBe(1);
  expect(state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-279 idempotent reorder records no change or duplicate audit event",async()=>{
  state.persistedAllowed=true;
  const outcome=await reorderProjectResources(context,projectId,{orderIds:[r1,r2]});
  expect(outcome).toEqual({changed:false,count:2});
  expect(state.actorChecks).toBe(1);
  expect(state.updates).toBe(0);
  expect(state.audits).toBe(0);
 });
});
