import {describe,expect,it} from "vitest";
import {meetingNotesEditable,mentorMeetingNotesParamsSchema,mentorMeetingNotesWriteSchema} from "@/modules/projects/mentor-meeting-notes-model";
import {mentorOverviewEditSchema} from "@/modules/projects/mentor-overview-edit-model";
import {mentorMeetingFacilitationSchema,emptyMentorMeetingFacilitation} from "@/modules/projects/mentor-meeting-facilitation-model";
import {currentPendingMentorSubmissions} from "@/modules/projects/mentor-latest-review-model";
import {resolveMentorActivityProjectId} from "@/modules/projects/mentor-project-event-attribution";
import {mentorProjectActivityPage,mentorProjectActivityQuerySchema} from "@/modules/projects/mentor-project-activity-model";
import {projectReviewCompleteness,reviewCompletenessPage,mentorReviewCompletenessQuerySchema} from "@/modules/projects/mentor-review-completeness-model";
import {mentorPendingTaskReviewCsv} from "@/modules/projects/mentor-pending-task-review-export";
import {mentorPortfolioActivityCsv,mentorPortfolioActivityExportHref} from "@/modules/projects/mentor-portfolio-activity-export-model";
import {mentorActivityQuerySchema} from "@/modules/projects/mentor-portfolio-model";
import {matchesMentorProjectAssignment} from "@/modules/projects/mentor-project-assignment-filter-model";
import {mentorReviewSubmissionHref,mentorAuthoredBrief} from "@/modules/projects/mentor-overview-presenter";

const projectId="11111111-1111-4111-8111-111111111111";
const meetingId="22222222-2222-4222-8222-222222222222";
const revision="2026-10-18T10:00:00.123Z";

describe("PROJ-BREAK-MENTOR lead runtime regression: mutable state, privacy and bounded exports",()=>{
 it("PROJ-BREAK-MENTOR-05 edits meeting outcomes only for completed meetings of ACTIVE projects",()=>{
  for(const projectStatus of ["PLANNED","ACTIVE","COMPLETED","ARCHIVED","DELETED","UNKNOWN"]){
   for(const meetingStatus of ["DRAFT","REQUESTED","SCHEDULED","RESCHEDULED","COMPLETED","CANCELLED","UNKNOWN"]){
    expect(meetingNotesEditable(projectStatus,meetingStatus),
      projectStatus+" / "+meetingStatus).toBe(projectStatus==="ACTIVE"&&meetingStatus==="COMPLETED");
   }
  }
  const valid={outcome:"  Recorded handover  ",expectedUpdatedAt:revision,confirmed:true};
  expect(mentorMeetingNotesWriteSchema.parse(valid).outcome).toBe("Recorded handover");
  for(const invalid of [
   {...valid,confirmed:false},{...valid,outcome:"  "},
   {...valid,expectedUpdatedAt:"2026-10-18"},
   {...valid,actorMembershipId:projectId},{...valid,outcome:"x".repeat(4001)},
  ])expect(mentorMeetingNotesWriteSchema.safeParse(invalid).success).toBe(false);
  expect(mentorMeetingNotesParamsSchema.parse({projectId,meetingId}).projectId).toBe(projectId);
  expect(mentorMeetingNotesParamsSchema.safeParse({projectId,meetingId:"someone-else"}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-06 pagination helpers never expose an invalid negative offset",()=>{
  expect(mentorProjectActivityPage(0,-1)).toMatchObject({page:1,totalPages:1});
  expect(mentorProjectActivityPage(40,0)).toMatchObject({page:1,totalPages:2});
  expect(mentorProjectActivityPage(41,Number.NaN)).toMatchObject({page:1,totalPages:3});
  expect(mentorProjectActivityPage(41,Number.POSITIVE_INFINITY)).toMatchObject({page:1,totalPages:3});
  expect(mentorProjectActivityPage(41,99999)).toMatchObject({page:3,totalPages:3});
  expect(()=>mentorProjectActivityPage(41,1,19)).toThrow("Invalid mentor activity page size");
  for(const invalid of [{projectId,page:"0"},{projectId,page:"10001"},{projectId,pageSize:"1000"},
    {projectId,actorId:projectId},{projectId,view:"UNRECOGNIZED"}]){
   expect(mentorProjectActivityQuerySchema.safeParse(invalid).success).toBe(false);
  }
 });
 it("PROJ-BREAK-MENTOR-07 CSV caps 200 recorded events, preserves IST and formula neutralization",()=>{
  const row={id:"event-1",projectTitle:"=HYPERLINK(\"https://evil\")",
    label:"+cmd",importance:"HIGH",occurredAt:new Date("2026-10-18T18:29:00.000Z")};
  const csv=mentorPortfolioActivityCsv(Array.from({length:203},(_,i)=>({...row,id:"event-"+i})),7);
  const lines=csv.replace(/^\uFEFF/,"").trim().split("\r\n");
  expect(lines).toHaveLength(202); // heading + 200 entries + truncation notice
  expect(csv).toContain("10 additional matching events");
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain("'+cmd");
  expect(csv).toContain("IST");
  expect(csv).not.toContain("event-202");
  expect(csv).not.toContain("actorMembershipId");
  expect(mentorPortfolioActivityCsv([{...row,occurredAt:new Date(NaN)}],-9))
    .toContain("Unknown");
 });
 it("PROJ-BREAK-MENTOR-08 review queue ignores historical SUBMITTED versions after newer DRAFT/APPROVED versions",()=>{
  const date=new Date("2026-10-18T10:00:00.000Z");
  const rows=[
   {id:"p1-1",projectId:"p1",version:1,status:"SUBMITTED",submittedAt:date},
   {id:"p1-2",projectId:"p1",version:2,status:"APPROVED",submittedAt:date},
   {id:"p2-1",projectId:"p2",version:1,status:"SUBMITTED",submittedAt:date},
   {id:"p2-2",projectId:"p2",version:2,status:"DRAFT",submittedAt:null},
   {id:"p3-2",projectId:"p3",version:2,status:"SUBMITTED",submittedAt:date},
   {id:"p3-1",projectId:"p3",version:1,status:"SUBMITTED",submittedAt:date},
   {id:"p4-1",projectId:"p4",version:1,status:"SUBMITTED",submittedAt:null},
  ];
  for(const order of [rows,[...rows].reverse()]){
   const pending=currentPendingMentorSubmissions(order);
   expect([...pending.keys()]).toEqual(["p3"]);
   expect(pending.get("p3")?.version).toBe(2);
  }
  expect(mentorReviewSubmissionHref(projectId,[{status:"DRAFT"},{status:"APPROVED"}])).toBeNull();
  expect(mentorReviewSubmissionHref(projectId,[{status:"SUBMITTED"}]))
    .toBe("/mentor/projects/"+projectId+"?tab=delivery");
  expect(mentorAuthoredBrief(null)).toEqual({goal:null,description:null,deliverables:[]});
 });
 it("PROJ-BREAK-MENTOR-09 project subject ID takes precedence over attacker-controlled metadata",()=>{
  const allowed=new Set(["correct"]);
  expect(resolveMentorActivityProjectId({
   subjectType:"project",subjectId:"foreign",metadataProjectId:"correct"},allowed)).toBeNull();
  expect(resolveMentorActivityProjectId({
   subjectType:"project",subjectId:"correct",metadataProjectId:"foreign"},allowed)).toBe("correct");
  expect(resolveMentorActivityProjectId({
   subjectType:"project_task",subjectId:"task",metadataProjectId:"foreign"},allowed)).toBeNull();
  expect(resolveMentorActivityProjectId({
   subjectType:"project_task",subjectId:"task",metadataProjectId:"correct"},allowed)).toBe("correct");
 });
 it("PROJ-BREAK-MENTOR-10 review completeness relies on persisted decisions and never guesses approval",()=>{
  const basic={id:"submission",version:1,submittedAt:new Date(),reviewedAt:null};
  const output=projectReviewCompleteness([
   {...basic,status:"SUBMITTED",decision:null,feedback:null},
   {...basic,id:"approved",status:"SUBMITTED",decision:"APPROVED",feedback:"   "},
   {...basic,id:"changes",status:"SUBMITTED",decision:"CHANGES_REQUESTED",feedback:"Rewrite test"},
   {...basic,id:"draft",status:"DRAFT",decision:null,feedback:null},
  ]);
  expect(output.map(v=>[v.reviewRecorded,v.writtenFeedbackRecorded,v.reviewLabel])).toEqual([
   [false,false,"No persisted review recorded"],
   [true,false,"Approved"],
   [true,true,"Changes requested"],
   [false,false,"Not submitted"],
  ]);
  expect(reviewCompletenessPage(11,100)).toMatchObject({page:2,pageSize:10,totalPages:2});
  expect(mentorReviewCompletenessQuerySchema.safeParse({projectId,impersonate:"other"}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-11 write schemas fail closed on injected actors and preserve required concurrency tokens",()=>{
  const valid={summary:"Plan",dueLabel:null,blocker:null,nextAction:null,expectedUpdatedAt:revision};
  expect(mentorOverviewEditSchema.parse(valid).summary).toBe("Plan");
  for(const invalid of [
   {...valid,expectedUpdatedAt:undefined},{...valid,summary:"x".repeat(4001)},
   {...valid,overrideTenantId:projectId},{...valid,nextAction:123},
  ])expect(mentorOverviewEditSchema.safeParse(invalid).success).toBe(false);
  expect(mentorMeetingFacilitationSchema.parse({})).toEqual(emptyMentorMeetingFacilitation);
  for(const invalid of [{notes:"x".repeat(4001)},{followUpAt:"yesterday"},
    {followUpStatus:"ARCHIVED"},{collegeId:projectId}])
    expect(mentorMeetingFacilitationSchema.safeParse(invalid).success).toBe(false);
  expect(matchesMentorProjectAssignment("PRIMARY",true)).toBe(true);
  expect(matchesMentorProjectAssignment("PRIMARY",false)).toBe(false);
  expect(matchesMentorProjectAssignment("SUPPORTING",true)).toBe(false);
  expect(matchesMentorProjectAssignment("SUPPORTING",false)).toBe(true);
 });
 it("PROJ-BREAK-MENTOR-12 exports carry only scoped filter fields and bounded privacy-safe columns",()=>{
  const query=mentorActivityQuerySchema.parse({
    projectId,importance:"CRITICAL",view:"REVIEWS",window:"PAST_30_DAYS",page:55,
  });
  const href=mentorPortfolioActivityExportHref(query);
  expect(href).toContain("/api/mentor/activity/export?");
  expect(href).toContain("projectId="+projectId);
  expect(href).toContain("importance=CRITICAL");
  expect(href).toContain("view=REVIEWS");
  expect(href).not.toContain("page=55");
  const csv=mentorPendingTaskReviewCsv([{
   id:"id",projectTitle:"@sum(1)",taskTitle:"=1+1",priority:"HIGH",version:2,
   submittedAt:new Date("2026-10-18T18:29:00Z"),
  }],0);
  expect(csv).toContain("'@sum(1)");
  expect(csv).toContain("'=1+1");
  expect(csv).not.toContain("learnerEmail");
 });
});
