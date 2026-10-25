import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {listMyMentorProjectAttention} from "@/modules/projects/mentor-attention-service";

const ownId="11111111-1111-4111-8111-111111111111";
const otherId="22222222-2222-4222-8222-222222222222";
const state=vi.hoisted(()=>({
 queries:[] as Array<{table:string;where:unknown;groupBy:unknown;orderBy:boolean}>,
 active:true,enabled:true,role:true,allowed:true,
 activityRows:[] as Array<{projectId:string;occurredAt:Date|null}>,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/identity/context",()=>({
 hasActiveMembership:()=>state.active,
 hasMembershipRole:(_:unknown,role:string)=>role==="MENTOR"&&state.role,
}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>state.allowed}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/modules/projects/member-service",()=>({
 listMyProjectInstances:async()=>{throw new Error("unexpected unscoped roster lookup");},
}));
vi.mock("@/modules/projects/mentor-latest-review-model",()=>({
 currentPendingMentorSubmissions:()=>new Map(),
}));
vi.mock("@/modules/projects/mentor-attention",()=>({
 deriveMentorProjectAttention:(rows:unknown)=>rows,
}));
vi.mock("@/db/schema",()=>({
 activityEvents:{__table:"activity",groupKey:"activity.group_key",module:"activity.module",
  collegeId:"activity.college_id",organizationId:"activity.organization_id",
  occurredAt:"activity.occurred_at"},
 projectMeetings:{id:"meeting.id",projectId:"meeting.project_id",status:"meeting.status",
  title:"meeting.title",startsAt:"meeting.starts_at",updatedAt:"meeting.updated_at"},
 projectSubmissions:{id:"submission.id",projectId:"submission.project_id",
  status:"submission.status",submittedAt:"submission.submitted_at",
  version:"submission.version",updatedAt:"submission.updated_at",reopenedAt:"submission.reopened_at"},
 projectSubmissionReviews:{submissionId:"review.submission_id",reviewedAt:"review.reviewed_at"},
 projectTaskSubmissions:{projectId:"task_submission.project_id",updatedAt:"task_submission.updated_at"},
 projectTasks:{id:"task.id",projectId:"task.project_id",title:"task.title",
  status:"task.status",sprintId:"task.sprint_id",
  assigneeMembershipId:"task.assignee_membership_id",updatedAt:"task.updated_at",
  deletedAt:"task.deleted_at"},
 projectSprints:{id:"sprint.id",projectId:"sprint.project_id",title:"sprint.title",
  status:"sprint.status",sequence:"sprint.sequence",updatedAt:"sprint.updated_at",
  deletedAt:"sprint.deleted_at"},
}));
vi.mock("drizzle-orm",()=>({
 and:(...args:unknown[])=>["AND",...args],
 eq:(...args:unknown[])=>["EQ",...args],
 isNull:(col:unknown)=>["IS_NULL",col],
 inArray:(...args:unknown[])=>["IN",...args],
 desc:(x:unknown)=>["DESC",x],
 max:(x:unknown)=>["MAX",x],
 sql:(parts:TemplateStringsArray,...expressions:unknown[])=>parts.reduce(
  (out:string,part:string,i:number)=>out+part+
   (i<expressions.length?String(expressions[i]):""),""),
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>{
   const record:{table:string;where:unknown;groupBy:unknown;orderBy:boolean}={
    table:"",where:null,groupBy:null,orderBy:false,
   };
   state.queries.push(record);
   const result=()=>record.table==="activity"?state.activityRows:[];
   const q={
    from:(table:unknown)=>{
     record.table=table&&typeof table==="object"&&"__table" in table
      ?String(table.__table):String(table);
     return q;
    },
    leftJoin:()=>q,
    where:(condition:unknown)=>{record.where=condition;return q;},
    groupBy:(group:unknown)=>{record.groupBy=group;return Promise.resolve(result());},
    orderBy:()=>{record.orderBy=true;return Promise.resolve(result());},
    then:(ok:(items:unknown[])=>unknown,fail:(e:unknown)=>unknown)=>
     Promise.resolve(result()).then(ok,fail),
   };
   return q;
  },
 }),
}));
const actor={
 user:{id:"mentor",identityUid:"id",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"mentor-1",collegeId:"college-a",organizationId:"org-a",
  status:"ACTIVE",roles:["MENTOR"]},
} as unknown as RequestContext;
const roster=(id:string,collegeId="college-a")=>({
 memberRole:"MENTOR",
 project:{id,title:"Project "+id,status:"ACTIVE",collegeId,
  updatedAt:new Date("2099-01-01T00:00:00.000Z")},
});
beforeEach(()=>{
 state.queries=[];state.active=true;state.enabled=true;state.role=true;state.allowed=true;
 state.activityRows=[];
});

describe("Mentor activity aggregation and tenancy at scale",()=>{
 it("PROJ-BREAK-MENTOR-354 aggregates the latest event per project in SQL, not an unbounded history",async()=>{
  state.activityRows=[
   {projectId:ownId,occurredAt:new Date("2099-01-02T06:30:00.000Z")},
   {projectId:otherId,occurredAt:new Date("2099-01-03T06:30:00.000Z")},
  ];
  const data=await listMyMentorProjectAttention(actor,new Date("2099-01-04T00:00:00.000Z"),
   [roster(ownId),roster(otherId,"college-b")] as never);
  expect(data).toHaveLength(1);
  expect(data[0]).toMatchObject({projectId:ownId,
   lastActivityAt:new Date("2099-01-02T06:30:00.000Z")});
  const query=state.queries.find(row=>row.table==="activity");
  expect(query).toBeDefined();
  expect(String(query?.groupBy)).toContain("split_part(activity.group_key, ':', 2)");
  expect(JSON.stringify(query?.where)).toContain("activity.college_id");
  expect(JSON.stringify(query?.where)).toContain("activity.organization_id");
  expect(JSON.stringify(query?.where)).toContain(ownId);
  expect(JSON.stringify(query?.where)).not.toContain(otherId);
  expect(query?.orderBy).toBe(false);
  expect(state.queries).toHaveLength(8);
 });
 it("PROJ-BREAK-MENTOR-355 keeps a 1,200-project activity feed bounded to 1,200 grouped rows",async()=>{
  const rows=Array.from({length:1200},(_,i)=>roster(
   "11111111-1111-4111-8111-"+String(i).padStart(12,"0")));
  const data=await listMyMentorProjectAttention(actor,new Date("2099-01-04T00:00:00.000Z"),
   rows as never);
  expect(data).toHaveLength(1200);
  const query=state.queries.find(row=>row.table==="activity");
  expect(query?.groupBy).toBeTruthy();
  const serialized=JSON.stringify(query?.where);
  expect(serialized).toContain(rows[0].project.id);
  expect(serialized).toContain(rows[1199].project.id);
  expect(serialized).not.toContain("LIKE");
 });
 it("PROJ-BREAK-MENTOR-356 unauthorized or disabled context causes no activity query",async()=>{
  for(const fail of ["module","role","inactive","permission"]){
   state.enabled=fail!=="module";state.role=fail!=="role";
   state.active=fail!=="inactive";state.allowed=fail!=="permission";
   await expect(listMyMentorProjectAttention(actor,new Date("2099-01-04T00:00:00.000Z"),
    [roster(ownId)] as never)).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
   expect(state.queries).toHaveLength(0);
  }
 });
});
