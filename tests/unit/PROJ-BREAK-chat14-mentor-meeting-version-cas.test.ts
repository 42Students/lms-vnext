import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {transitionProjectMeeting} from "@/modules/projects/meeting-service";
import {projectMeetingTransitionInputSchema} from "@/modules/projects/validation";

const projectId="11111111-1111-4111-8111-111111111111";
const meetingId="22222222-2222-4222-8222-222222222222";
const version="2099-01-01T00:00:00.000Z";
const state=vi.hoisted(()=>({
 access:"MENTOR",status:"SCHEDULED",requestedBy:"learner-member",
 versionChangedDuringTransaction:false,
 txStarts:0,persistedMentor:0,persistedLearner:0,updates:0,audits:0,notices:0,
 whereClause:null as unknown,updateValues:null as unknown,
}));
vi.mock("server-only",()=>({}));
vi.mock("drizzle-orm",()=>({
 eq:(field:unknown,value:unknown)=>["EQ",field,value],
 and:(...conditions:unknown[])=>["AND",...conditions],
 inArray:(field:unknown,values:unknown[])=>["IN",field,values],
 asc:(v:unknown)=>v,desc:(v:unknown)=>v,ne:(...v:unknown[])=>v,
 or:(...v:unknown[])=>v,gt:(...v:unknown[])=>v,lt:(...v:unknown[])=>v,
 isNotNull:(v:unknown)=>v,
 sql:(parts:TemplateStringsArray,...exprs:unknown[])=>parts.reduce(
  (text:string,part:string,i:number)=>text+part+
   (i<exprs.length?String(exprs[i]):""),""),
}));
vi.mock("@/db/schema",()=>({
 projectInstances:{id:"project.id",collegeId:"project.college_id",
  status:"project.status"},
 projectMeetings:{id:"meeting.id",projectId:"meeting.project_id",
  status:"meeting.status",requestedByMembershipId:"meeting.requested_by_membership_id",
  updatedAt:"meeting.updated_at"},
 projectSprints:{id:"sprint.id"},projectTasks:{id:"task.id"},
}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:true}}),
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async()=>({
  collegeId:"college-a",organizationId:"org-a",access:state.access,
  project:{id:projectId,status:"ACTIVE",title:"Atlas"},
 }),
}));
vi.mock("@/modules/projects/persisted-mentor-mutation",()=>({
 assertPersistedProjectMutationActor:async()=>{state.persistedMentor++;},
}));
vi.mock("@/modules/projects/learner-mutation-guard",()=>({
 assertPersistedLearnerProjectMutation:async()=>{state.persistedLearner++;},
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.audits++;return {id:"event"};},
}));
vi.mock("@/modules/activity/taxonomy",()=>({
 ACTIVITY_EVENT_TYPES:{PROJECTS_MEETING_DECIDED:"PROJECTS_MEETING_DECIDED"},
}));
vi.mock("@/modules/projects/project-notification-service",()=>({
 notifyActiveProjectMembers:async()=>{state.notices++;},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>({
   from:()=>({
    where:()=>({
     limit:async()=>[{
      id:meetingId,projectId,status:state.status,title:"Team review",
      updatedAt:new Date(version),outcome:null,
      requestedByMembershipId:state.requestedBy,
     }],
    }),
   }),
  }),
  transaction:async(run:(tx:unknown)=>Promise<unknown>)=>{
   state.txStarts++;
   const tx={
    select:()=>({
     from:()=>({
      where:()=>({for:()=>({
       limit:async()=>[{status:"ACTIVE"}],
      })}),
     }),
    }),
    update:()=>({
     set:(values:unknown)=>{
      state.updateValues=values;
      return {where:(where:unknown)=>{
       state.whereClause=where;
       return {returning:async()=>{
        state.updates++;
        return state.versionChangedDuringTransaction?[]:[{
         id:meetingId,projectId,title:"Team review",
         status:state.status==="DRAFT"||state.status==="REQUESTED"?"CANCELLED":
          "COMPLETED",
        }];
       }};
      }};
     },
    }),
   };
   return run(tx);
  },
 }),
}));
const mentor={user:{id:"mentor",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"mentor-member",collegeId:"college-a",organizationId:"org-a",
  status:"ACTIVE",roles:["MENTOR"]}} as unknown as RequestContext;
const learner={...mentor,
 membership:{...mentor.membership!,id:"learner-member",roles:["LEARNER"]}} as RequestContext;

beforeEach(()=>{
 state.access="MENTOR";state.status="SCHEDULED";state.requestedBy="learner-member";
 state.versionChangedDuringTransaction=false;
 state.txStarts=0;state.persistedMentor=0;state.persistedLearner=0;
 state.updates=0;state.audits=0;state.notices=0;
 state.whereClause=null;state.updateValues=null;
});

describe("Legacy meeting transition optimistic concurrency, side effects and actors",()=>{
 it("PROJ-BREAK-MENTOR-389 stale client version is refused before project lock or notification",async()=>{
  await expect(transitionProjectMeeting(mentor,projectId,meetingId,{
   action:"COMPLETE",expectedUpdatedAt:"2098-01-01T00:00:00.000Z",
  })).rejects.toMatchObject({code:"PROJECT_MEETING_STALE_VERSION"});
  expect(state.txStarts+state.updates+state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-390 completion CAS pins the exact loaded status and millisecond revision",async()=>{
  const result=await transitionProjectMeeting(mentor,projectId,meetingId,{
   action:"COMPLETE",expectedUpdatedAt:version,outcome:"Reviewed",
  });
  expect(result.status).toBe("COMPLETED");
  expect(state.txStarts).toBe(1);
  expect(state.persistedMentor).toBe(1);
  const where=JSON.stringify(state.whereClause);
  expect(where).toContain('"EQ","meeting.status","SCHEDULED"');
  expect(where).toContain("date_trunc");
  expect(where).toContain("meeting.updated_at");
  expect(where).toContain(version);
  expect((state.updateValues as {updatedAt:Date}).updatedAt.getTime())
   .toBeGreaterThan(new Date(version).getTime());
  expect(state.updates).toBe(1);
  expect(state.audits).toBe(1);
  expect(state.notices).toBe(2);
 });
 it.each(["COMPLETE","CANCEL"] as const)(
  "PROJ-BREAK-MENTOR-391 concurrent version change rejects %s and rolls back event and notifications",
  async action=>{
   state.versionChangedDuringTransaction=true;
   await expect(transitionProjectMeeting(mentor,projectId,meetingId,{action}))
    .rejects.toMatchObject({code:"PROJECT_MEETING_STALE_VERSION"});
   expect(state.txStarts).toBe(1);
   expect(state.updates).toBe(1);
   expect(state.audits+state.notices).toBe(0);
   expect(JSON.stringify(state.whereClause)).toContain("meeting.updated_at");
  });
 it("PROJ-BREAK-MENTOR-392 cancelling a draft never broadcasts to other project members",async()=>{
  state.status="DRAFT";
  const cancelled=await transitionProjectMeeting(mentor,projectId,meetingId,{action:"CANCEL"});
  expect(cancelled.status).toBe("CANCELLED");
  expect(state.updates).toBe(1);
  expect(state.audits+state.notices).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-393 learner cancellation pins requester, live grant and REQUESTED status",async()=>{
  state.access="LEARNER";state.status="REQUESTED";
  const cancelled=await transitionProjectMeeting(learner,projectId,meetingId,{
   action:"CANCEL",expectedUpdatedAt:version,note:"Timing change",
  });
  expect(cancelled.status).toBe("CANCELLED");
  expect(state.persistedLearner).toBe(1);
  expect(state.persistedMentor).toBe(0);
  const where=JSON.stringify(state.whereClause);
  expect(where).toContain('"EQ","meeting.status","REQUESTED"');
  expect(where).toContain("meeting.requested_by_membership_id");
  expect(where).toContain("learner-member");
  expect(state.audits).toBe(1);
  expect(state.notices).toBe(2);
 });
 it("PROJ-BREAK-MENTOR-394 equivalent IST offsets pass and forged version fields fail strict parsing",async()=>{
  const iso="2099-01-01T05:30:00.000+05:30";
  expect(projectMeetingTransitionInputSchema.safeParse({
   action:"COMPLETE",expectedUpdatedAt:iso,outcome:"Reviewed",
  }).success).toBe(true);
  for(const raw of [
   {action:"COMPLETE",expectedUpdatedAt:"2099-01-01"},
   {action:"CANCEL",expectedUpdatedAt:"not a date"},
   {action:"CANCEL",expectedUpdatedAt:version,actorMembershipId:"forged"},
   {action:"COMPLETE",expectedUpdatedAt:version,collegeId:"foreign"},
  ])expect(projectMeetingTransitionInputSchema.safeParse(raw).success).toBe(false);
  await transitionProjectMeeting(mentor,projectId,meetingId,{
   action:"COMPLETE",expectedUpdatedAt:iso,outcome:"Reviewed",
  });
  expect(state.updates).toBe(1);
  expect(state.audits).toBe(1);
 });

});
