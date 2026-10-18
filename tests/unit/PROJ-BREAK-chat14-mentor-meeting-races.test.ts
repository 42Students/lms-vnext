import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {
 listProjectMeetings,requestProjectMeeting,scheduleProjectMeeting,
 transitionProjectMeeting,
} from "@/modules/projects/meeting-service";

const state=vi.hoisted(()=>({
 moduleEnabled:true,scopeCalls:0,projectLocks:0,meetingReads:0,
 persistedChecks:0,mentorDenied:true,learnerChecks:0,learnerDenied:true,
 access:"MENTOR",meetingStatus:"SCHEDULED",windowChecks:0,expiresAfterLock:false,
 supplyExisting:false,existingStatus:"SCHEDULED",advisoryLocks:0,
 writes:0,audits:0,notices:0,lockConditions:"",
}));
const projectId="11111111-1111-4111-8111-111111111111";
const meetingId="22222222-2222-4222-8222-222222222222";
const context={
 user:{id:"mentor",platformStatus:"ACTIVE"},
 membership:{id:"mentor-member",collegeId:"college-a",organizationId:"org-a",
  roles:["MENTOR"],status:"ACTIVE"},
} as unknown as RequestContext;
const scope={collegeId:"college-a",organizationId:"org-a",
 project:{id:projectId,status:"ACTIVE"}};
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...xs:unknown[])=>xs,eq:(...xs:unknown[])=>xs,
 asc:(x:unknown)=>x,desc:(x:unknown)=>x,
 inArray:(...xs:unknown[])=>xs,ne:(...xs:unknown[])=>xs,
 isNotNull:(x:unknown)=>x,or:(...xs:unknown[])=>xs,
 gt:(...xs:unknown[])=>xs,lt:(...xs:unknown[])=>xs,
 sql:(_part:TemplateStringsArray,...xs:unknown[])=>xs,
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.college_id",status:"project.status",
  updatedAt:"project.updated_at"},
 projectMeetings:{id:"meeting.id",projectId:"meeting.project_id",status:"meeting.status"},
 projectSprints:{id:"sprint.id"},projectTasks:{id:"task.id"},
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async()=>{state.scopeCalls++;return {...scope,access:state.access};},
 requireProjectLifecycleMutationAccess:async()=>{state.scopeCalls++;return {...scope,access:state.access};},
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.moduleEnabled}}),
}));
vi.mock("@/modules/projects/learner-mutation-guard",()=>({
 assertPersistedLearnerProjectMutation:async()=>{
  state.learnerChecks++;
  if(state.learnerDenied)throw new Error("PROJECT_ACCESS_DENIED");
 },
}));
vi.mock("@/modules/projects/meeting-window-policy",()=>({
 isFutureProjectMeetingWindow:()=>{
  state.windowChecks++;
  return !(state.expiresAfterLock&&state.windowChecks===2);
 },
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.persistedChecks++;
  if(state.mentorDenied)throw new Error("PROJECT_LIFECYCLE_ACCESS_DENIED");
 },
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.audits++;return {id:"event"};},
}));
vi.mock("@/modules/activity/taxonomy",()=>({ACTIVITY_EVENT_TYPES:{}}));
vi.mock("@/modules/projects/project-notification-service",()=>({
 notifyActiveProjectMembers:async()=>{state.notices++;},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>({
   from:()=>({
    where:()=>({limit:async()=>{
     state.meetingReads++;
     return [{id:meetingId,projectId,status:state.meetingStatus,title:"Mentor review",
      requestedByMembershipId:"learner-member",updatedAt:new Date("2099-01-01T00:00:00.000Z")}];
    }}),
   }),
  }),
  transaction:async(run:(tx:unknown)=>Promise<unknown>)=>{
   const tx={
    select:()=>({
     from:(table:unknown)=>({
      where:(conditions:unknown)=>({
       limit:async()=>{state.meetingReads++;return [];},
       for:()=>({
        limit:async()=>{
         if(table && typeof table==="object" && "collegeId" in table){
          state.projectLocks++;
          state.lockConditions=JSON.stringify(conditions);
          return [{status:"ACTIVE",updatedAt:new Date("2099-01-01T00:00:00.000Z")}];
         }
         state.meetingReads++;
         if(state.supplyExisting)return [{
          id:meetingId,projectId,status:state.existingStatus,
          updatedAt:new Date("2099-01-01T00:00:00.000Z"),
          title:"Mentor review",startsAt:new Date("2099-01-01T10:00:00.000Z"),
          endsAt:new Date("2099-01-01T10:30:00.000Z"),
          timeZone:"Asia/Kolkata",meetingType:"GENERAL",
          meetingUrl:"https://meet.example.org/review",
          scheduledByUserId:"mentor",scheduledByMembershipId:"mentor-member",
          linkedSprintId:null,linkedTaskId:null,facilitation:{},
          outcome:null,agenda:null,
         }];
         throw new Error("Read meeting after revoked grant");
        },
       }),
      }),
     }),
    }),
    execute:async()=>{state.advisoryLocks++;throw new Error("AFTER_STATE_GATE");},
    insert:()=>{state.writes++;throw new Error("Unexpected insert");},
    update:()=>{state.writes++;throw new Error("Unexpected update");},
   };
   return run(tx);
  },
 }),
}));
beforeEach(()=>{
 state.moduleEnabled=true;state.scopeCalls=0;state.projectLocks=0;
 state.meetingReads=0;state.persistedChecks=0;state.mentorDenied=true;
 state.learnerChecks=0;state.learnerDenied=true;
 state.access="MENTOR";state.meetingStatus="SCHEDULED";
 state.windowChecks=0;state.expiresAfterLock=false;
 state.supplyExisting=false;state.existingStatus="SCHEDULED";state.advisoryLocks=0;
 state.writes=0;state.audits=0;state.notices=0;state.lockConditions="";
});
const draft={
 title:"Mentor review",startsAt:"2099-01-01T10:00:00.000Z",
 endsAt:"2099-01-01T10:30:00.000Z",timeZone:"Asia/Kolkata",
 status:"DRAFT",expectedProjectUpdatedAt:"2099-01-01T00:00:00.000Z",
} as const;
describe("Mentor meeting writes and direct read permissions",()=>{
 it("PROJ-BREAK-MENTOR-280 disabled Projects denies list, request and transition before scope lookup",async()=>{
  state.moduleEnabled=false;
  await expect(listProjectMeetings(context,projectId))
   .rejects.toMatchObject({code:"PROJECT_MEETING_ACCESS_DENIED"});
  await expect(requestProjectMeeting(context,projectId,{
   title:"Review",startsAt:draft.startsAt,endsAt:draft.endsAt,timeZone:"Asia/Kolkata",
  })).rejects.toMatchObject({code:"PROJECT_MEETING_ACCESS_DENIED"});
  await expect(transitionProjectMeeting(context,projectId,meetingId,{
   action:"COMPLETE",
  })).rejects.toMatchObject({code:"PROJECT_MEETING_ACCESS_DENIED"});
  expect(state.scopeCalls).toBe(0);
  expect(state.meetingReads).toBe(0);
  expect(state.writes+state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-281 stale Mentor cannot schedule after parent row lock",async()=>{
  await expect(scheduleProjectMeeting(context,projectId,null,draft))
   .rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.scopeCalls).toBe(1);
  expect(state.projectLocks).toBe(1);
  expect(state.persistedChecks).toBe(1);
  expect(state.meetingReads).toBe(0);
  expect(state.lockConditions).toContain("project.college_id");
  expect(state.writes+state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-282 meeting completion rechecks persisted Mentor after parent row lock",async()=>{
  await expect(transitionProjectMeeting(context,projectId,meetingId,{
   action:"COMPLETE",outcome:"Reviewed plan",
  })).rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.scopeCalls).toBe(1);
  expect(state.projectLocks).toBe(1);
  expect(state.persistedChecks).toBe(1);
  expect(state.meetingReads).toBe(1);
  expect(state.writes+state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-283 meeting cancellation rechecks persisted Mentor before mutation",async()=>{
  await expect(transitionProjectMeeting(context,projectId,meetingId,{
   action:"CANCEL",note:"Moved to next week",
  })).rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.scopeCalls).toBe(1);
  expect(state.projectLocks).toBe(1);
  expect(state.persistedChecks).toBe(1);
  expect(state.meetingReads).toBe(1);
  expect(state.writes+state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-351 revoked learner cannot request a meeting after the project lock",async()=>{
  state.access="LEARNER";
  const learner={...context,membership:{...context.membership!,id:"learner-member",roles:["LEARNER"]}} as RequestContext;
  await expect(requestProjectMeeting(learner,projectId,{
   title:"Project check-in",startsAt:draft.startsAt,endsAt:draft.endsAt,timeZone:"Asia/Kolkata",
  })).rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.projectLocks).toBe(1);
  expect(state.lockConditions).toContain("project.college_id");
  expect(state.learnerChecks).toBe(1);
  expect(state.meetingReads).toBe(0);
  expect(state.writes+state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-352 revoked requester cannot cancel a meeting or notify others",async()=>{
  state.access="LEARNER";
  state.meetingStatus="REQUESTED";
  const learner={...context,membership:{...context.membership!,id:"learner-member",roles:["LEARNER"]}} as RequestContext;
  await expect(transitionProjectMeeting(learner,projectId,meetingId,{
   action:"CANCEL",note:"Not needed",
  })).rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.projectLocks).toBe(1);
  expect(state.learnerChecks).toBe(1);
  expect(state.meetingReads).toBe(1);
  expect(state.writes+state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-353 delayed meeting scheduling rechecks the future window under lock",async()=>{
  state.expiresAfterLock=true;
  state.mentorDenied=false;
  // The first window check passes before transaction entry; the second
  // simulates the clock crossing startsAt while a parent row lock is awaited.
  state.persistedChecks=0;
  await expect(scheduleProjectMeeting(context,projectId,null,draft))
   .rejects.toMatchObject({code:"PROJECT_MEETING_INVALID_STATE"});
  expect(state.windowChecks).toBe(2);
  expect(state.projectLocks).toBe(1);
  expect(state.writes+state.audits+state.notices).toBe(0);
 });

 it.each([
  ["SCHEDULED","SCHEDULED",true],
  ["DRAFT","RESCHEDULED",true],
  ["REQUESTED","RESCHEDULED",true],
  ["RESCHEDULED","SCHEDULED",true],
  ["SCHEDULED","RESCHEDULED",false],
 ] as const)("PROJ-BREAK-MENTOR-357 rejects forbidden %s to %s (changed %s) before side effects",async(
  current,next,changed,
 )=>{
  state.mentorDenied=false;state.supplyExisting=true;state.existingStatus=current;
  const startsAt=changed?"2099-01-01T11:00:00.000Z":"2099-01-01T10:00:00.000Z";
  const endsAt=changed?"2099-01-01T11:30:00.000Z":"2099-01-01T10:30:00.000Z";
  await expect(scheduleProjectMeeting(context,projectId,meetingId,{
   title:"Mentor review",startsAt,endsAt,timeZone:"Asia/Kolkata",
   status:next,expectedUpdatedAt:"2099-01-01T00:00:00.000Z",
   meetingUrl:"https://meet.example.org/review",
  })).rejects.toMatchObject({code:"PROJECT_MEETING_INVALID_STATE"});
  expect(state.persistedChecks).toBe(1);
  expect(state.projectLocks).toBe(1);
  expect(state.advisoryLocks+state.writes+state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-358 permits a changed SCHEDULED meeting only as RESCHEDULED",async()=>{
  state.mentorDenied=false;state.supplyExisting=true;state.existingStatus="SCHEDULED";
  await expect(scheduleProjectMeeting(context,projectId,meetingId,{
   title:"Mentor review",startsAt:"2099-01-01T11:00:00.000Z",
   endsAt:"2099-01-01T11:30:00.000Z",timeZone:"Asia/Kolkata",
   status:"RESCHEDULED",expectedUpdatedAt:"2099-01-01T00:00:00.000Z",
   meetingUrl:"https://meet.example.org/review",
  })).rejects.toThrow("AFTER_STATE_GATE");
  expect(state.advisoryLocks).toBe(1);
  expect(state.writes+state.audits+state.notices).toBe(0);
 });

});
