import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {writeMentorProjectRelease} from "@/modules/projects/mentor-release-write-service";
import {decideMentorProjectMeeting} from "@/modules/projects/mentor-meeting-decision-service";

const state=vi.hoisted(()=>({
 moduleEnabled:true,actorAllowed:false,readScopeCalls:0,
 projectLocks:0,actorChecks:0,releaseReads:0,meetingReads:0,writes:0,events:0,
}));
const projectId="11111111-1111-4111-8111-111111111111";
const meetingId="22222222-2222-4222-8222-222222222222";
const context={
 user:{id:"mentor-user"},
 membership:{id:"mentor-membership",collegeId:"college-a",organizationId:"org-a"},
} as unknown as RequestContext;

vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...items:unknown[])=>items,eq:(...items:unknown[])=>items,
 desc:(column:unknown)=>column,
 sql:(_strings:TemplateStringsArray,...values:unknown[])=>values,
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.college_id",status:"project.status"},
 projectReleases:{id:"release.id",projectId:"release.project_id"},
 projectSprints:{id:"sprint.id"},
 projectMeetings:{id:"meeting.id",projectId:"meeting.project_id"},
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectLifecycleMutationAccess:async()=>({
  access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
  project:{id:projectId,status:"ACTIVE"},
 }),
 requireProjectReadAccess:async()=>{
  state.readScopeCalls++;
  return {access:"MENTOR",collegeId:"college-a",organizationId:"org-a",
   project:{id:projectId,status:"ACTIVE"}};
 },
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.moduleEnabled}}),
}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>true,hasMembershipRole:(_:unknown,role:string)=>role==="MENTOR",
}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>true}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.actorChecks++;
  if(!state.actorAllowed)throw new Error("PROJECT_LIFECYCLE_ACCESS_DENIED");
 },
}));
vi.mock("@/modules/activity/taxonomy",()=>({
 ACTIVITY_EVENT_TYPES:{PROJECTS_RELEASE_CREATED:"projects.release.created",
  PROJECTS_RELEASE_UPDATED:"projects.release.updated",
  PROJECTS_RELEASE_DELETED:"projects.release.deleted",
  PROJECTS_MEETING_DECIDED:"projects.meeting.decided"},
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.events++;return {id:"event"};},
}));
vi.mock("@/modules/projects/project-notification-service",()=>({
 notifyActiveProjectMembers:async()=>{throw new Error("Unexpected notification");},
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
          return [{status:"ACTIVE"}];
         }
         if(table && typeof table==="object" && "projectId" in table)state.releaseReads++;
         else state.meetingReads++;
         throw new Error("Revoked transaction continued after persisted authorization failed");
        },
       }),
      }),
     }),
    }),
    update:()=>{state.writes++;throw new Error("Unexpected write");},
    insert:()=>{state.writes++;throw new Error("Unexpected insert");},
    delete:()=>{state.writes++;throw new Error("Unexpected delete");},
   };
   return run(tx);
  },
 }),
}));

beforeEach(()=>{
 state.moduleEnabled=true;state.actorAllowed=false;state.readScopeCalls=0;
 state.projectLocks=0;state.actorChecks=0;state.releaseReads=0;
 state.meetingReads=0;state.writes=0;state.events=0;
});
describe("Mentor release and meeting authorization regression",()=>{
 it("PROJ-BREAK-MENTOR-210 aborts release creation after Mentor role revocation under parent lock",async()=>{
  await expect(writeMentorProjectRelease(context,projectId,null,"POST",{title:"First release"}))
   .rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.projectLocks).toBe(1);
  expect(state.actorChecks).toBe(1);
  expect(state.releaseReads).toBe(0);
  expect(state.writes).toBe(0);
  expect(state.events).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-211 disallows meeting decisions before foreign project scope resolution when module is off",async()=>{
  state.moduleEnabled=false;
  await expect(decideMentorProjectMeeting(context,projectId,meetingId,{
   action:"COMPLETE",confirmed:true,expectedUpdatedAt:"2099-01-01T00:00:00.000Z",
  })).rejects.toThrow("PROJECT_MEETING_ACCESS_DENIED");
  expect(state.readScopeCalls).toBe(0);
  expect(state.projectLocks).toBe(0);
  expect(state.meetingReads).toBe(0);
  expect(state.writes).toBe(0);
  expect(state.events).toBe(0);
 });
});
