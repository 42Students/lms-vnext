import {describe,expect,it} from "vitest";
import {mentorReportsOverview,mentorReportsCsv,mentorReportsQuerySchema,mentorReportsHref} from "@/modules/projects/mentor-reports-model";
import {selectMentorAttention,mentorAttentionProjectOptions,mentorAttentionKindSchema,mentorAttentionOrderSchema,mentorAttentionProjectSchema} from "@/modules/projects/mentor-attention-kind-model";
import {mentorTaskReviewSummary,mentorTaskReviewAgeBoundary,mentorTaskReviewQuerySchema,mentorTaskReviewLiteralSearch,mentorTaskReviewTargetHref,mentorTaskReviewExportHref} from "@/modules/projects/mentor-task-review-model";
import {mentorMeetingCanReschedule,mentorMeetingRescheduleSchema,mentorMeetingRescheduleParamsSchema,toIstLocalInput,fromIstLocalInput} from "@/modules/projects/mentor-meeting-reschedule-model";
import type {MentorProjectAttention} from "@/modules/projects/mentor-attention";

const ID="11111111-1111-4111-8111-111111111111";
const ID2="22222222-2222-4222-8222-222222222222";
const ID3="33333333-3333-4333-8333-333333333333";
const instant=new Date("2026-10-18T10:00:00.000Z");
const projects=[
 {id:ID,title:"=Project A",status:"ACTIVE",isPrimaryMentor:true,updatedAt:instant},
 {id:ID2,title:"Project B",status:"COMPLETED",isPrimaryMentor:false,updatedAt:new Date("2026-10-17T10:00:00Z")},
 {id:ID3,title:"Project C",status:"ARCHIVED",isPrimaryMentor:true,updatedAt:new Date("2026-10-16T10:00:00Z")},
];
const alerts:MentorProjectAttention[]=[
 {key:"a",projectId:ID,title:"Review",description:"Review",kind:"REVIEW",href:"/mentor/projects/a",occurredAt:"2026-10-18T10:00:00Z"},
 {key:"b",projectId:ID,title:"Meeting",description:"Meeting",kind:"REQUESTED",href:"/mentor/projects/a",occurredAt:"2026-10-17T10:00:00Z"},
 {key:"c",projectId:ID2,title:"Stalled",description:"Stalled",kind:"STALLED",href:"/mentor/projects/b",occurredAt:"2026-10-16T10:00:00Z"},
 {key:"intruder",projectId:"other-college",title:"Foreign",description:"Private",kind:"REVIEW",href:"/mentor/projects/other",occurredAt:"2026-10-19T10:00:00Z"},
];

describe("PROJ-BREAK-MENTOR-32..40 reports, attention, calendar decision and exports",()=>{
 it("PROJ-BREAK-MENTOR-32 unknown status never grants a Mentor reschedule mutation",()=>{
  for(const status of ["SCHEDULED","RESCHEDULED","REQUESTED","CANCELLED","COMPLETED","FORGED"]){
   for(const projectStatus of ["PLANNED","ACTIVE","COMPLETED","ARCHIVED","DELETED","FORGED"]){
    expect(mentorMeetingCanReschedule(status,projectStatus),
      status+" in "+projectStatus).toBe(["SCHEDULED","RESCHEDULED"].includes(status)&&
      ["PLANNED","ACTIVE"].includes(projectStatus));
   }
  }
  const payload={startsAt:"2026-10-19T08:00:00.000Z",endsAt:"2026-10-19T09:00:00.000Z",
   expectedUpdatedAt:"2026-10-18T10:00:00.000Z",confirmed:true};
  expect(mentorMeetingRescheduleSchema.safeParse(payload).success).toBe(true);
  for(const bad of [
   {...payload,confirmed:false},{...payload,endsAt:payload.startsAt},
   {...payload,endsAt:"2026-10-20T08:00:00.000Z"},
   {...payload,actorId:ID},{...payload,startsAt:"yesterday"},
  ])expect(mentorMeetingRescheduleSchema.safeParse(bad).success).toBe(false);
  expect(mentorMeetingRescheduleParamsSchema.safeParse({projectId:ID,meetingId:ID2}).success).toBe(true);
  expect(mentorMeetingRescheduleParamsSchema.safeParse({projectId:ID,meetingId:"wrong"}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-33 direct-call pagination cannot expose negative/huge offsets",()=>{
  expect(mentorTaskReviewSummary({total:0,page:Infinity,pageSize:0})).toEqual({
   total:0,page:1,pageSize:20,totalPages:1,first:0,last:0,
  });
  expect(mentorTaskReviewSummary({total:101,page:-3,pageSize:50})).toMatchObject({
   total:101,page:1,totalPages:3,first:1,last:50,
  });
  expect(mentorTaskReviewSummary({total:101,page:999,pageSize:50})).toMatchObject({
   page:3,totalPages:3,first:101,last:101,
  });
  expect(mentorTaskReviewSummary({total:NaN,page:NaN,pageSize:999})).toMatchObject({
   page:1,total:0,pageSize:20,
  });
  expect(mentorTaskReviewQuerySchema.safeParse({page:0}).success).toBe(false);
  expect(mentorTaskReviewQuerySchema.safeParse({pageSize:51}).success).toBe(false);
  expect(mentorTaskReviewQuerySchema.safeParse({userId:ID}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-34 reports CSV caps all direct callers at 100, safely displays invalid dates",()=>{
  const reportRows=Array.from({length:103},(_,i)=>({
   id:"project-"+i,title:i===0?"=IMPORTDATA(\"https://bad\")":"Project",
   status:"ACTIVE",isPrimaryMentor:true,attention:["REVIEW"],
   updatedAt:i===0?new Date(NaN):instant,
  }));
  const csv=mentorReportsCsv(reportRows,5);
  expect(csv.replace(/^\uFEFF/,"").trim().split("\r\n")).toHaveLength(102);
  expect(csv).toContain("8 additional matching projects");
  expect(csv).toContain("'=IMPORTDATA");
  expect(csv).toContain("Unknown");
  expect(csv).not.toContain("project-102");
  expect(csv).not.toContain("learnerEmail");
  expect(mentorReportsCsv([],Number.NaN)).not.toContain("Truncated");
 });
 it("PROJ-BREAK-MENTOR-35 counts active authorized projects, never leaked other-tenant alerts",()=>{
  const query=mentorReportsQuerySchema.parse({});
  const result=mentorReportsOverview(projects,alerts.map(({projectId,kind})=>({projectId,kind})),query);
  expect(result.projectCount).toBe(3);
  expect(result.primaryMentorCount).toBe(2);
  expect(result.statusCounts).toMatchObject({ACTIVE:1,COMPLETED:1,ARCHIVED:1});
  expect(result.attentionCounts).toMatchObject({REVIEW:1,STALLED:1,REQUESTED:1});
  expect(result.total).toBe(3);
  expect(result.exportItems).toHaveLength(3);
  expect(result.items.map(p=>p.id)).toEqual([ID,ID2,ID3]);
  expect(mentorReportsQuerySchema.safeParse({collegeId:"another"}).success).toBe(false);
  expect(mentorReportsQuerySchema.safeParse({search:"x".repeat(121)}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-36 report filters count persisted work only and keep tenant from request context",()=>{
  const work=new Map([[ID,{total:3,open:2}],[ID2,{total:1,open:0}],[ID3,{total:0,open:0}]]);
  const query=mentorReportsQuerySchema.parse({taskCoverage:"ALL_DONE",assignment:"SUPPORTING"});
  const selected=mentorReportsOverview(projects,alerts,query,work);
  expect(selected.items.map(p=>p.id)).toEqual([ID2]);
  expect(selected.projectCount).toBe(3);
  expect(mentorReportsOverview(projects,alerts,mentorReportsQuerySchema.parse({attention:"NONE"}),work)
    .items.map(p=>p.id)).toEqual([ID3]);
  const href=mentorReportsHref(mentorReportsQuerySchema.parse({status:"ACTIVE",page:4,search:"B"}));
  expect(href).toContain("status=ACTIVE");
  expect(href).toContain("page=4");
  expect(href).not.toMatch(/collegeId|actorId|organizationId/);
 });
 it("PROJ-BREAK-MENTOR-37 Attention list never accepts foreign project labels or attributes",()=>{
  const filtered=selectMentorAttention(alerts,"REVIEW");
  expect(filtered.map(a=>a.key)).toEqual(["intruder","a"]);
  const scoped=selectMentorAttention(alerts,"ALL",ID,"REVIEW_FIRST");
  expect(scoped.map(a=>a.key)).toEqual(["a","b"]);
  const projectOptions=mentorAttentionProjectOptions(alerts,[
   {id:ID,title:"A on roster"},{id:ID2,title:"B on roster"},{id:ID3,title:"No alert"},
  ]);
  expect(projectOptions).toEqual([{id:ID,title:"A on roster"},{id:ID2,title:"B on roster"}]);
  expect(projectOptions.some(p=>p.id==="other-college")).toBe(false);
  expect(mentorAttentionKindSchema.safeParse("IMPERSONATE").success).toBe(false);
  expect(mentorAttentionOrderSchema.safeParse("ADMIN").success).toBe(false);
  expect(mentorAttentionProjectSchema.safeParse(ID).success).toBe(true);
  expect(mentorAttentionProjectSchema.safeParse("../../../admin").success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-38 history search escapes SQL LIKE wildcard characters",()=>{
  expect(mentorTaskReviewLiteralSearch("100%_\\")).toBe("100\\%\\_\\\\");
  expect(mentorTaskReviewTargetHref(ID,ID2)).toBe(
   "/mentor/projects/"+ID+"?tab=board#mentor-task-"+ID2);
  expect(()=>mentorTaskReviewTargetHref(ID,"../../other")).toThrow();
  const href=mentorTaskReviewExportHref({projectId:ID,search:"100%",page:5} as never);
  expect(href).toContain("projectId="+ID);
  expect(href).toContain("search=100%25");
  expect(href).not.toContain("page=5");
  expect(mentorTaskReviewAgeBoundary("ALL",instant)).toBeNull();
  expect(mentorTaskReviewAgeBoundary("OLDER_THAN_30_DAYS",instant)?.cutoff.toISOString())
   .toBe("2026-09-18T10:00:00.000Z");
  expect(mentorTaskReviewAgeBoundary("OLDER_THAN_30_DAYS",instant)?.older).toBe(true);
 });
 it("PROJ-BREAK-MENTOR-39 IST localization rejects impossible reschedule dates",()=>{
  expect(fromIstLocalInput("2026-02-30T14:10")).toBeNull();
  expect(fromIstLocalInput("2026-10-18T24:00")).toBeNull();
  expect(fromIstLocalInput("2026-10-18T18:60")).toBeNull();
  expect(fromIstLocalInput("2028-02-29T23:59"))
   .toBe("2028-02-29T18:29:00.000Z");
  expect(toIstLocalInput("2028-02-29T18:29:00.000Z")).toBe("2028-02-29T23:59");
  expect(toIstLocalInput("not-a-date")).toBe("");
 });
});
