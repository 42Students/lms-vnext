import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {autoAssignProjectTasks} from "@/modules/projects/mentor-auto-assign-service";
import {moveMentorBacklogTask,createMentorBacklogTask} from "@/modules/projects/mentor-backlog-service";

const state=vi.hoisted(()=>({
 persistedAllowed:false,scopeChecks:0,persistedChecks:0,
 selects:0,projectLocks:0,events:0,notifications:0,writes:0,
}));
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...items:unknown[])=>items,
 eq:(left:unknown,right:unknown)=>[left,right],
 isNull:(column:unknown)=>["null",column],
 desc:(column:unknown)=>["desc",column],
 sql:(_parts:TemplateStringsArray,...expr:unknown[])=>expr,
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.collegeId",status:"project.status"},
 projectMembers:{membershipId:"member.membershipId"},
 projectTasks:{id:"task.id",projectId:"task.projectId"},
 projectReleases:{id:"release.id"},
 projectSprints:{id:"sprint.id"},
 collegeMemberships:{id:"college.id"},
 membershipRoles:{id:"role.id"},
 users:{id:"user.id"},
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleMutationAccess:async(_:unknown,projectId:string)=>{
  state.scopeChecks++;
  return {access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
   project:{id:projectId,status:"ACTIVE",title:"Atlas"}};
 },
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.persistedChecks++;
  if(!state.persistedAllowed)throw new Error("PROJECT_LIFECYCLE_ACCESS_DENIED");
 },
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.events++;return {id:"event"};},
}));
vi.mock("@/modules/projects/project-notification-service",()=>({
 notifyProjectMemberships:async()=>{state.notifications++;},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({transaction:async(callback:(tx:unknown)=>Promise<unknown>)=>{
  const tx={
   select:()=>{
    state.selects++;
    if(state.selects>1)throw new Error("AFTER_PERSISTED_ACTOR_QUERY");
    return {from:()=>({where:()=>({
     for:(lock:string)=>({limit:async()=>{
      if(lock==="update")state.projectLocks++;
      return [{status:"ACTIVE"}];
     }}),
    })})};
   },
   update:()=>{state.writes++;throw new Error("MUTATION_BYPASS");},
   insert:()=>{state.writes++;throw new Error("MUTATION_BYPASS");},
  };
  return callback(tx);
 }}),
}));
const ctx={user:{id:"mentor",platformStatus:"ACTIVE"},
 membership:{id:"membership",roles:["MENTOR"],collegeId:"college-a",
  organizationId:"org-a",status:"ACTIVE"}} as unknown as RequestContext;
const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const expectedUpdatedAt="2099-01-01T00:00:00.000Z";
const commands=[
 ()=>autoAssignProjectTasks(ctx,projectId),
 ()=>moveMentorBacklogTask(ctx,projectId,{taskId,targetSprintId:null,expectedUpdatedAt}),
 ()=>createMentorBacklogTask(ctx,projectId,{title:"Architecture task"}),
];
beforeEach(()=>{
 state.persistedAllowed=false;state.scopeChecks=0;state.persistedChecks=0;
 state.selects=0;state.projectLocks=0;state.events=0;
 state.notifications=0;state.writes=0;
});

describe("PROJ-BREAK-MENTOR-202..203 transaction-local persisted actor safety",()=>{
 it("PROJ-BREAK-MENTOR-202 rescinded mentor membership blocks auto-assign and both backlog commands under row lock",async()=>{
  for(const command of commands){
   state.selects=0;
   await expect(command()).rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
   expect(state.selects).toBe(1);
  }
  expect(state.scopeChecks).toBe(3);
  expect(state.persistedChecks).toBe(3);
  expect(state.projectLocks).toBe(3);
  expect(state.writes).toBe(0);
  expect(state.events).toBe(0);
  expect(state.notifications).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-203 authorized actor gets past the transaction-local guard into registered queries",async()=>{
  state.persistedAllowed=true;
  for(const command of commands){
   state.selects=0;
   await expect(command()).rejects.toThrow("AFTER_PERSISTED_ACTOR_QUERY");
   expect(state.selects).toBe(2);
  }
  expect(state.persistedChecks).toBe(3);
  expect(state.events).toBe(0);
 });
});
