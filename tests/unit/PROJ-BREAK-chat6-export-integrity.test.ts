import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {csvSafeCell,mentorBoardReview,mentorBoardExportCsv} from "@/modules/projects/mentor-board-review-model";
import {learnerProjectActivityCsv} from "@/modules/projects/learner-project-activity-csv-model";
import {mentorPendingTaskReviewCsv} from "@/modules/projects/mentor-pending-task-review-export";
import {mentorCalendarCsv} from "@/modules/projects/mentor-calendar-export-model";
import {mentorReviewExportCsv} from "@/modules/projects/mentor-review-export-model";
import {exportClassTeamsCsv} from "@/modules/projects/class-team-csv-export";
import {resourceFilePreflight} from "@/modules/projects/resource-file-preflight-model";
import {createProjectEvaluationInputSchema} from "@/modules/projects/validation";
import type {MentorMeetingCalendarItem} from "@/modules/projects/mentor-calendar-view";

const src=(path:string)=>readFileSync(path,"utf8");
const id="11111111-1111-4111-8111-111111111111";
describe("IIT Dharwad Projects breaker — CSV security, performance, rubric and notifications",()=>{
 it("PROJ-BREAK-export-01 protects formulas hidden by BOM, zero-width and directional characters",()=>{
  for(const prefix of [""," ","\t","\uFEFF","\u200B","\u200F","\u202E","\u2060","\u2066","\u2069"]){
   for(const symbol of ["=","+","-","@"]){
    const payload=prefix+symbol+"SUM(1,1)";
    expect(csvSafeCell(payload)).toBe('"'+"'"+payload+'"');
   }
  }
  expect(csvSafeCell('a,b"c')).toBe('"a,b""c"');
 });
 it("PROJ-BREAK-export-02 learner CSV escapes hidden formulas and caps 100 authorized rows",()=>{
  const row={occurredAt:new Date("2026-10-18T23:59:59+05:30"),
   actorDisplayName:"\u200B=HYPERLINK(1)",summary:"\uFEFF+SUM(1,2)",subjectLabel:"\u202E@BAD"};
  const rows=Array.from({length:101},()=>row);
  const report=learnerProjectActivityCsv(rows);
  expect(report.truncated).toBe(true);
  expect(report.content).toContain('"\'\u200B=HYPERLINK(1)"');
  expect(report.content).toContain('"\'\uFEFF+SUM(1,2)"');
  expect(report.content).toContain('"\'\u202E@BAD"');
  expect(report.content.split("\r\n")).toHaveLength(102);
 });
 it("PROJ-BREAK-resilience-01 malformed historical timestamp cannot crash learner activity download",()=>{
  const out=learnerProjectActivityCsv([{occurredAt:new Date("invalid"),
   actorDisplayName:null,summary:"Old event",subjectLabel:null}]);
  expect(out.truncated).toBe(false);
  expect(out.content).toContain('"Unknown","System"');
 });
 it("PROJ-BREAK-export-03 task-review CSV caps oversized accidental response and reports omission",()=>{
  const row={id,projectTitle:"Project",taskTitle:"Task",priority:"HIGH",version:1,
   submittedAt:new Date("invalid")};
  const out=mentorPendingTaskReviewCsv(Array.from({length:503},()=>row),2);
  expect(out).toContain('"Unknown"');
  expect(out).toContain('5 additional matching reviews');
  expect(out.split("\r\n")).toHaveLength(503);
 });
 it("PROJ-BREAK-export-04 mentor meeting CSV caps 500 rows and handles invalid dates",()=>{
  const row={id,projectTitle:"Project",title:"Meeting",status:"SCHEDULED",
   startsAt:"invalid",endsAt:"invalid"} as MentorMeetingCalendarItem;
  const report=mentorCalendarCsv(Array.from({length:501},()=>row),0);
  expect(report).toContain('"Unknown","Unknown"');
  expect(report).toContain('1 additional matching meetings');
  expect(report.split("\r\n")).toHaveLength(503);
 });
 it("PROJ-BREAK-export-05 mentor review CSV retains already-enforced 200-row bound",()=>{
  const rows=Array.from({length:201},()=>({projectId:id,projectTitle:"Review",
   occurredAt:new Date("invalid")}));
  const report=mentorReviewExportCsv(rows,0);
  expect(report).toContain("Export capped");
  expect(report).toContain('1 more matching deliveries');
  expect(report).toContain('"Unknown"');
  expect(report.split("\r\n")).toHaveLength(203);
 });
 it("PROJ-BREAK-file-03 rejects path traversals, bidi filename spoofing and MIME/size abuse",()=>{
  const limits={maxBytes:100,maxPerResource:2,allowedContentTypes:["text/plain"]};
  const good={name:"notes.txt",type:"text/plain",size:50};
  expect(resourceFilePreflight(good,limits,0).allowed).toBe(true);
  for(const name of ["../secret","bad\\file.txt","\u202Eexe.txt","x\u0000.txt",""]){
   expect(resourceFilePreflight({...good,name},limits,0).allowed).toBe(false);
  }
  for(const candidate of [{...good,size:101},{...good,size:0},{...good,type:"application/x-msdownload"}])
   expect(resourceFilePreflight(candidate,limits,0).allowed).toBe(false);
  expect(resourceFilePreflight(good,limits,2).allowed).toBe(false);
 });
 it("PROJ-BREAK-grading-03 rejects over-max points, duplicate criteria and client-supplied totals",()=>{
  const valid={items:[{criterion:"Quality",score:1,maxScore:2}]};
  expect(createProjectEvaluationInputSchema.safeParse(valid).success).toBe(true);
  expect(createProjectEvaluationInputSchema.safeParse({items:[{criterion:"Quality",score:3,maxScore:2}]}).success).toBe(false);
  expect(createProjectEvaluationInputSchema.safeParse({items:[{criterion:"Quality",score:1,maxScore:2},
   {criterion:"QUALITY",score:1,maxScore:2}]}).success).toBe(false);
  expect(createProjectEvaluationInputSchema.safeParse({...valid,totalScore:10_000}).success).toBe(false);
 });
 it("PROJ-BREAK-scale-01 list of 1001 tasks never materializes unlimited page rows",()=>{
  const tasks=Array.from({length:1001},(_,i)=>({id:String(i).padStart(4,"0"),
   sprintId:null,title:"Task "+i,priority:"MEDIUM",status:"TODO",sequence:i}));
  const query={projectId:id,status:"ALL" as const,search:"",page:1};
  const page=mentorBoardReview(tasks,[],query);
  expect(page.count).toBe(1001);
  expect(page.items).toHaveLength(20);
  expect(page.exportItems).toHaveLength(500);
  expect(page.exportOmitted).toBe(501);
 });
 it("PROJ-BREAK-notification-01 no ended or other-college project member can be notified",()=>{
  const code=src("src/modules/projects/project-notification-service.ts");
  expect(code).toContain("isNull(projectMembers.endedAt)");
  expect(code).toContain('eq(collegeMemberships.collegeId, notice.collegeId)');
  expect(code).toContain('eq(collegeMemberships.status, "ACTIVE")');
  expect(code).toContain('eq(users.platformStatus, "ACTIVE")');
  expect(code).toContain("new Set(rows.map(row => row.userId))");
  const delivery=src("src/modules/activity/notification-service.ts");
  expect(delivery).toMatch(/dedupe|onConflict|unique/);
 });
 it("PROJ-BREAK-security-01 project mutating route requires same-origin and current server context",()=>{
  const api=src("src/app/api/projects/[projectId]/submissions/[submissionId]/evaluation/route.ts");
  expect(api).toContain("isSameOriginRequest(request)");
  expect(api).toContain("getCurrentRequestContext()");
  expect(api).toContain("apiErrorResponse(error)");
 });
 it("PROJ-BREAK-export-06 class team membership CSV defuses Unicode-hidden formulas",()=>{
  const team=[{name:"\u2066=HYPERLINK(1)",membershipIds:[id]}];
  const rolls=new Map([[id,"\u2069+SUM(1,2)"]]);
  const csv=exportClassTeamsCsv(team,rolls);
  expect(csv).toContain('"\'\u2066=HYPERLINK(1)"');
  expect(csv).toContain('"\'\u2069+SUM(1,2)"');
  expect(csv.split("\r\n")).toHaveLength(3);
 });

});
