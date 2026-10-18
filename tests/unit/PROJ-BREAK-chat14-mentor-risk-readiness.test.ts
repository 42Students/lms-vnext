import {describe,expect,it} from "vitest";
import {
 mentorRiskReadiness,mentorRiskReadinessHref,mentorRiskReadinessQuerySchema,
 type MentorRiskReadinessFacts,
} from "@/modules/projects/mentor-risk-readiness-model";

const projectId="11111111-1111-4111-8111-111111111111";
const blockedId="22222222-2222-4222-8222-222222222222";
const reviewId="33333333-3333-4333-8333-333333333333";
const now=new Date("2026-10-18T18:30:00.000Z"); // 19 October 00:00 IST
const query=(extra:Record<string,unknown>={})=>
 mentorRiskReadinessQuerySchema.parse({projectId,...extra});
const facts=():MentorRiskReadinessFacts=>({
 projectId,projectStatus:"ACTIVE",
 releases:[{id:"release-1",title:"Phase I",status:"IN_PROGRESS"}],
 sprints:[{id:"sprint-1",title:"Sprint I",status:"ACTIVE"}],
 tasks:[
  {id:blockedId,title:"Blocked deployment",status:"BLOCKED",priority:"HIGH",sprintId:"sprint-1"},
  {id:reviewId,title:"Pending code review",status:"IN_REVIEW",priority:"CRITICAL",sprintId:"sprint-1"},
  {id:"done",title:"Completed docs",status:"DONE",priority:"LOW",sprintId:"sprint-1"},
 ],
 meetings:[
  {id:"meeting-past",title:"Yesterday IST",status:"SCHEDULED",startsAt:new Date("2026-10-18T18:29:00.000Z")},
  {id:"meeting-today",title:"Just after IST midnight",status:"SCHEDULED",startsAt:new Date("2026-10-18T18:30:00.000Z")},
  {id:"meeting-request",title:"Requested check-in",status:"REQUESTED",startsAt:new Date("2026-10-19T10:00:00.000Z")},
 ],
 latestSubmissionStatus:"SUBMITTED",finalApproved:false,evaluationRecorded:false,
});

describe("PROJ-BREAK-MENTOR-122..129 persisted risk and readiness classifier",()=>{
 it("PROJ-BREAK-MENTOR-122 validates project UUID, priority, focus, page and hostile tenant query",()=>{
  expect(mentorRiskReadinessQuerySchema.safeParse({projectId}).success).toBe(true);
  for(const bad of [
   {projectId:"../../other"},{projectId,focus:"INFERRED"},
   {projectId,taskPriority:"HIGHER"},{projectId,page:0},
   {projectId,page:10001},{projectId,collegeId:"foreign"},{projectId,role:"ADMIN"},
  ])expect(mentorRiskReadinessQuerySchema.safeParse(bad).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-123 reports only persisted task, meeting and delivery signals",()=>{
  const data=mentorRiskReadiness(facts(),query(),now);
  expect(data.projectStatus).toBe("ACTIVE");
  expect(data.riskCount).toBe(5);
  expect(data.counts).toMatchObject({
   blockedTasks:1,reviewTasks:1,pendingMeetings:1,scheduledPastDay:1,incompleteTasks:2,totalTasks:3,
   unshippedReleases:1,incompleteSprints:1,
  });
  const risk=data.items.filter(i=>i.category==="RISK");
  expect(risk.map(i=>i.key).sort()).toEqual([
   "blocked:"+blockedId,"review:"+reviewId,"scheduled-past:meeting-past",
   "meeting:meeting-request","final-review",
  ].sort());
  expect(risk.every(i=>i.href.startsWith("/mentor/projects/"+projectId))).toBe(true);
 });
 it("PROJ-BREAK-MENTOR-124 IST 23:59 vs midnight is exact, not UTC-day comparison",()=>{
  const data=mentorRiskReadiness(facts(),query({focus:"RISK"}),now);
  expect(data.counts.scheduledPastDay).toBe(1);
  expect(data.items.some(i=>i.key==="scheduled-past:meeting-past")).toBe(true);
  expect(data.items.some(i=>i.key==="scheduled-past:meeting-today")).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-125 inactive/unknown workspaces never advertise actionable risk cards",()=>{
  for(const projectStatus of ["ARCHIVED","COMPLETED","GARBAGE"]){
   const snapshot=mentorRiskReadiness({...facts(),projectStatus},
    query({focus:"RISK"}),now);
   expect(snapshot.riskCount,projectStatus).toBe(0);
   expect(snapshot.total,projectStatus).toBe(0);
   expect(snapshot.items,projectStatus).toEqual([]);
  }
 });
 it("PROJ-BREAK-MENTOR-126 priority limits task drilldowns only, not independent meeting risks",()=>{
  const onlyCritical=mentorRiskReadiness(facts(),query({focus:"RISK",taskPriority:"CRITICAL"}),now);
  expect(onlyCritical.items.some(i=>i.key==="review:"+reviewId)).toBe(true);
  expect(onlyCritical.items.some(i=>i.key==="blocked:"+blockedId)).toBe(false);
  expect(onlyCritical.items.some(i=>i.key==="meeting:meeting-request")).toBe(true);
  expect(onlyCritical.counts.blockedTasks).toBe(1); // Counters describe persisted whole-project facts
 });
 it("PROJ-BREAK-MENTOR-127 absent work is unknown, not invented 0% success",()=>{
  const empty={...facts(),releases:[],sprints:[],tasks:[],meetings:[],
   latestSubmissionStatus:null,finalApproved:false,evaluationRecorded:false};
  const data=mentorRiskReadiness(empty,query({focus:"READINESS"}),now);
  expect(data.items.map(i=>i.key)).toEqual(["release-none","sprint-none","tasks-none","delivery"]);
  expect(data.items.find(i=>i.key==="tasks-none")?.detail).toContain("unknown");
  expect(data.riskCount).toBe(0);
  expect(data.readinessGapCount).toBe(4);
 });
 it("PROJ-BREAK-MENTOR-128 fully persisted completion yields no inferred residual gaps",()=>{
  const finished:MentorRiskReadinessFacts={
   ...facts(),releases:[{id:"release-1",title:"Done",status:"SHIPPED"}],
   sprints:[{id:"sprint-1",title:"Done",status:"COMPLETED"}],
   tasks:[{id:"done",title:"Done",status:"DONE",priority:"LOW",sprintId:"sprint-1"}],
   meetings:[],latestSubmissionStatus:"APPROVED",finalApproved:true,evaluationRecorded:true,
  };
  const data=mentorRiskReadiness(finished,query(),now);
  expect(data.riskCount).toBe(0);
  expect(data.readinessGapCount).toBe(0);
  expect(data.total).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-129 direct model callers cannot create negative or nonfinite pages",()=>{
  const data=facts();
  for(const raw of [-100,NaN,Infinity]){
   expect(mentorRiskReadiness(data,{...query(),page:raw},now).page).toBe(1);
  }
  expect(mentorRiskReadiness(data,{...query(),page:999},now).page).toBe(1);
  const href=mentorRiskReadinessHref(query({focus:"READINESS",taskPriority:"HIGH",page:2}));
  expect(href).toContain("/mentor/projects/"+projectId+"/risk-readiness?");
  expect(href).toContain("focus=READINESS");
  expect(href).toContain("taskPriority=HIGH");
  expect(href).toContain("page=2");
  expect(href).not.toContain("collegeId=");
 });
});
