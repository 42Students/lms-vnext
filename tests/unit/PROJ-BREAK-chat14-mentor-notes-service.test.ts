import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getMentorMeetingNotes,updateMentorMeetingNotes} from "@/modules/projects/mentor-meeting-notes-service";

const state=vi.hoisted(()=>({
 projectStatus:"ACTIVE",meetingStatus:"COMPLETED",access:"MENTOR",
 activeRole:"MENTOR",scopeCollegeId:"college-a",scopeOrganizationId:"org-a",
 activeMembership:true,moduleEnabled:true,meetingPresent:true,
 currentOutcome:"Initial",updatedAt:"2026-10-18T10:00:00.123Z",
 events:0,updates:0,projectLocks:0,meetingLocks:0,reads:0,lastReadConditions:"",
 persistedAllowed:true,persistedActorChecks:0,
}));
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 and:(...conditions:unknown[])=>conditions,
 eq:(left:unknown,right:unknown)=>[left,right],
 sql:(_l:TemplateStringsArray,...v:unknown[])=>v,
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.college_id",status:"project.status"},
 projectMeetings:{id:"meeting.id",projectId:"meeting.project_id",status:"meeting.status",
  updatedAt:"meeting.updated_at"},
}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.activeMembership,hasMembershipRole:(_:unknown,role:string)=>state.activeRole===role,
}));
vi.mock("@/modules/permissions/policy",()=>({
 can:(ctx:{membership?:{collegeId:string;organizationId:string}},_:unknown,resource:{collegeId:string;organizationId:string})=>
  ctx.membership?.collegeId===resource.collegeId&&ctx.membership?.organizationId===resource.organizationId,
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.moduleEnabled}}),
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async(_:unknown,id:string)=>({
  access:state.access,collegeId:state.scopeCollegeId,organizationId:state.scopeOrganizationId,
  project:{id,title:"Atlas",status:state.projectStatus},
 }),
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{
  state.persistedActorChecks++;
  if(!state.persistedAllowed)throw new Error("PROJECT_LIFECYCLE_ACCESS_DENIED");
 },
}));
vi.mock("@/modules/activity/taxonomy",()=>({
 ACTIVITY_EVENT_TYPES:{PROJECTS_MEETING_NOTES_UPDATED:"projects.meeting.notes_updated"},
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.events++;return {id:"event-id"};},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>({
   from:()=>({where:(conditions:unknown)=>({
    limit:async()=>{
     state.reads++;
     state.lastReadConditions=JSON.stringify(conditions);
     return state.meetingPresent?[{
      id:"22222222-2222-4222-8222-222222222222",
      projectId:"11111111-1111-4111-8111-111111111111",
      title:"Sprint checkpoint",status:state.meetingStatus,
      outcome:state.currentOutcome,updatedAt:new Date(state.updatedAt),
     }]:[];
    },
   })}),
  }),
  transaction:async(callback:(tx:unknown)=>Promise<unknown>)=>{
   const tx={
    select:(fields?:unknown)=>({
     from:()=>({where:()=>({
      for:(lock:string)=>({
       limit:async()=>{
        if(fields){
         if(lock==="update")state.projectLocks++;
         return [{status:state.projectStatus}];
        }
        if(lock==="update")state.meetingLocks++;
        return state.meetingPresent?[{
         id:"22222222-2222-4222-8222-222222222222",
         projectId:"11111111-1111-4111-8111-111111111111",
         title:"Sprint checkpoint",status:state.meetingStatus,
         outcome:state.currentOutcome,updatedAt:new Date(state.updatedAt),
        }]:[];
       },
      }),
     })}),
    }),
    update:()=>({
     set:(newValues:{outcome:string;updatedAt:Date})=>({
      where:()=>({returning:async()=>{
       state.updates++;
       return [{id:"22222222-2222-4222-8222-222222222222",
        projectId:"11111111-1111-4111-8111-111111111111",title:"Sprint checkpoint",
        status:state.meetingStatus,...newValues}];
      }}),
     }),
    }),
   };
   return callback(tx);
  },
 }),
}));

const context={
 user:{id:"mentor"},membership:{id:"membership",collegeId:"college-a",organizationId:"org-a"},
} as unknown as RequestContext;
const ids={
 projectId:"11111111-1111-4111-8111-111111111111",
 meetingId:"22222222-2222-4222-8222-222222222222",
};
const input={outcome:"Updated record",expectedUpdatedAt:"2026-10-18T10:00:00.123Z",confirmed:true};

beforeEach(()=>{
 state.projectStatus="ACTIVE";state.meetingStatus="COMPLETED";state.access="MENTOR";
 state.activeRole="MENTOR";state.scopeCollegeId="college-a";state.scopeOrganizationId="org-a";
 state.activeMembership=true;state.moduleEnabled=true;state.meetingPresent=true;
 state.currentOutcome="Initial";state.updatedAt=input.expectedUpdatedAt;
 state.events=0;state.updates=0;state.projectLocks=0;state.meetingLocks=0;state.reads=0;state.lastReadConditions="";
 state.persistedAllowed=true;state.persistedActorChecks=0;
});

describe("PROJ-BREAK-MENTOR-164..167 read-only meeting notes scope",()=>{
 it("PROJ-BREAK-MENTOR-164 reads exactly the requested meeting inside the scoped project",async()=>{
  const result=await getMentorMeetingNotes(context,ids);
  expect(result.projectTitle).toBe("Atlas");
  expect(result.projectStatus).toBe("ACTIVE");
  expect(result.meeting).toMatchObject({id:ids.meetingId,status:"COMPLETED",outcome:"Initial"});
  expect(state.reads).toBe(1);
  expect(state.lastReadConditions).toContain(ids.projectId);
  expect(state.lastReadConditions).toContain(ids.meetingId);
  expect(state.updates).toBe(0);
  expect(state.events).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-165 returns not found without leaking a foreign meeting",async()=>{
  state.meetingPresent=false;
  await expect(getMentorMeetingNotes(context,ids))
   .rejects.toMatchObject({code:"PROJECT_MEETING_NOT_FOUND"});
  expect(state.reads).toBe(1);
  expect(state.events).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-166 refuses revoked mentor role, tenant scope and module before reading",async()=>{
  const reject=async()=>{
   await expect(getMentorMeetingNotes(context,ids))
    .rejects.toMatchObject({code:"PROJECT_MEETING_ACCESS_DENIED"});
   expect(state.reads).toBe(0);
  };
  state.activeMembership=false;await reject();
  state.activeMembership=true;state.activeRole="LEARNER";await reject();
  state.activeRole="MENTOR";state.access="LEARNER";await reject();
  state.access="MENTOR";state.scopeOrganizationId="foreign-org";await reject();
  state.scopeOrganizationId="org-a";state.moduleEnabled=false;await reject();
 });
 it("PROJ-BREAK-MENTOR-167 rejects malformed meeting identifiers before any data read",async()=>{
  for(const path of [{...ids,meetingId:"../../../other"},{...ids,organizationId:"foreign"},
   {...ids,projectId:"not-uuid"}]){
   await expect(getMentorMeetingNotes(context,path)).rejects.toThrow();
  }
  expect(state.reads).toBe(0);
 });
});

describe("PROJ-BREAK-MENTOR meeting notes service transactional authorization",()=>{
 it("PROJ-BREAK-MENTOR-16 verifies project and meeting row locks before accepting an update",async()=>{
  const updated=await updateMentorMeetingNotes(context,ids,input);
  expect(updated.outcome).toBe("Updated record");
  expect(state.projectLocks).toBe(1);
  expect(state.meetingLocks).toBe(1);
  expect(state.updates).toBe(1);
  expect(state.events).toBe(1);
 });
 it("PROJ-BREAK-MENTOR-17 prohibits all non-active project and non-completed meeting combinations",async()=>{
  for(const status of ["PLANNED","COMPLETED","ARCHIVED","UNKNOWN"]){
   state.projectStatus=status;
   await expect(updateMentorMeetingNotes(context,ids,input))
    .rejects.toThrow("PROJECT_MEETING_INVALID_STATE");
  }
  state.projectStatus="ACTIVE";
  for(const status of ["DRAFT","REQUESTED","SCHEDULED","CANCELLED","UNKNOWN"]){
   state.meetingStatus=status;
   await expect(updateMentorMeetingNotes(context,ids,input))
    .rejects.toThrow("PROJECT_MEETING_INVALID_STATE");
  }
  expect(state.updates).toBe(0);
  expect(state.events).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-18 enforces expectedUpdatedAt and never records an audit event on conflict",async()=>{
  state.updatedAt="2026-10-18T10:00:00.124Z";
  await expect(updateMentorMeetingNotes(context,ids,input))
   .rejects.toThrow("PROJECT_MEETING_STALE_VERSION");
  expect(state.updates).toBe(0);
  expect(state.events).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-19 rejects removed membership, wrong role or disabled module before entering transaction",async()=>{
  state.activeMembership=false;
  await expect(updateMentorMeetingNotes(context,ids,input))
   .rejects.toThrow("PROJECT_MEETING_ACCESS_DENIED");
  state.activeMembership=true;state.activeRole="FACULTY";
 await expect(updateMentorMeetingNotes(context,ids,input))
  .rejects.toThrow("PROJECT_MEETING_ACCESS_DENIED");
 state.activeRole="MENTOR";state.access="LEARNER";
  await expect(updateMentorMeetingNotes(context,ids,input))
   .rejects.toThrow("PROJECT_MEETING_ACCESS_DENIED");
  state.access="MENTOR";state.scopeCollegeId="college-b";
 await expect(updateMentorMeetingNotes(context,ids,input))
  .rejects.toThrow("PROJECT_MEETING_ACCESS_DENIED");
 state.scopeCollegeId="college-a";state.scopeOrganizationId="org-b";
 await expect(updateMentorMeetingNotes(context,ids,input))
  .rejects.toThrow("PROJECT_MEETING_ACCESS_DENIED");
 state.scopeOrganizationId="org-a";state.moduleEnabled=false;
  await expect(updateMentorMeetingNotes(context,ids,input))
   .rejects.toThrow("PROJECT_MEETING_ACCESS_DENIED");
  expect(state.meetingLocks).toBe(0);
  expect(state.updates).toBe(0);
  expect(state.events).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-201 revocation after page access but inside transaction aborts note writes",async()=>{
  state.persistedAllowed=false;
  await expect(updateMentorMeetingNotes(context,ids,input))
   .rejects.toThrow("PROJECT_LIFECYCLE_ACCESS_DENIED");
  expect(state.projectLocks).toBe(1);
  expect(state.persistedActorChecks).toBe(1);
  expect(state.meetingLocks).toBe(0);
  expect(state.updates).toBe(0);
  expect(state.events).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-20 rejects forged cross-project/invalid meeting IDs before persistence",async()=>{
  await expect(updateMentorMeetingNotes(context,{
   ...ids,meetingId:"forged",
  },input)).rejects.toThrow();
  expect(state.updates).toBe(0);
  expect(state.events).toBe(0);
  state.meetingPresent=false;
  await expect(updateMentorMeetingNotes(context,ids,input))
   .rejects.toThrow("PROJECT_MEETING_NOT_FOUND");
  expect(state.events).toBe(0);
 });
});
