import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {createMentorProjectSprint,transitionMentorProjectSprint}
 from "@/modules/projects/mentor-sprint-write-service";

const projectId="11111111-1111-4111-8111-111111111111";
const releaseId="22222222-2222-4222-8222-222222222222";
const sprintId="33333333-3333-4333-8333-333333333333";
const collegeId="44444444-4444-4444-8444-444444444444";
const organizationId="55555555-5555-4555-8555-555555555555";
const snapshot=vi.hoisted(()=>({
 actorChecks:0,projectReads:0,insertions:0,updates:0,activities:0,
 revoked:true,projectStatus:"ACTIVE",
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleMutationAccess:async()=>({
  project:{id:projectId,status:snapshot.projectStatus},
  collegeId,organizationId,access:"MENTOR",
 }),
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  snapshot.actorChecks++;
  if(snapshot.revoked)throw Object.assign(new Error("Revoked Mentor"),{
   code:"PROJECT_LIFECYCLE_ACCESS_DENIED",
  });
 },
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{snapshot.activities++;},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(run:(tx:unknown)=>Promise<unknown>)=>{
   const tx={
    select:()=>({from:()=>({where:()=>({for:()=>({
     limit:async()=>{snapshot.projectReads++;return [{status:snapshot.projectStatus,id:projectId}];},
    })})})}),
    insert:()=>{snapshot.insertions++;throw new Error("unexpected insert");},
    update:()=>{snapshot.updates++;throw new Error("unexpected update");},
   };
   return run(tx);
  },
 }),
}));
const mentor:RequestContext={
 user:{id:"66666666-6666-4666-8666-666666666666",
  identityUid:"faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"77777777-7777-4777-8777-777777777777",
  collegeId,organizationId,status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};
const create=()=>createMentorProjectSprint(mentor,{projectId},{
 releaseId,title:"Sprint title",description:null,goal:null,definitionOfDone:null,
 startDate:null,endDate:null,dueDate:null,
});
const change=()=>transitionMentorProjectSprint(mentor,{projectId,sprintId},{
 action:"START",expectedUpdatedAt:"2026-10-18T10:00:00.000Z",
});
describe("PROJ-BREAK-FACULTY-09 Sprint writes reject stale Mentor session under project row lock",()=>{
 beforeEach(()=>{
  snapshot.actorChecks=0;snapshot.projectReads=0;
  snapshot.insertions=0;snapshot.updates=0;snapshot.activities=0;
  snapshot.revoked=true;snapshot.projectStatus="ACTIVE";
 });
 it("Faculty Mentor who lost their project grant cannot create a new Sprint from a stale page",async()=>{
  await expect(create()).rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  expect(snapshot).toMatchObject({
   actorChecks:1,projectReads:1,insertions:0,updates:0,activities:0,
  });
 });
 it("Faculty Mentor who lost their platform role cannot start a planned Sprint",async()=>{
  await expect(change()).rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  expect(snapshot).toMatchObject({
   actorChecks:1,projectReads:1,insertions:0,updates:0,activities:0,
  });
 });
 it("Archive and completed projects reject Sprint mutations before authorization or writes",async()=>{
  for(const status of ["ARCHIVED","COMPLETED"]){
   snapshot.projectStatus=status;
   await expect(create()).rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
   await expect(change()).rejects.toMatchObject({code:"PROJECT_SPRINT_INVALID_STATE"});
  }
  expect(snapshot).toMatchObject({
   actorChecks:0,insertions:0,updates:0,activities:0,
  });
 });
});
