import {describe,expect,it} from "vitest";
import {roundImportActionSchema,uniqueTpoRoundImportRoster,matchTpoRoundImportRoster,parseTpoRoundImport,tpoRoundImportStageFailureReason,ROUND_IMPORT_TEMPLATE} from "@/modules/placements/tpo-round-import-model";
import {tpoRoundImportPreviewToken} from "@/modules/placements/tpo-round-import-preview-token";
import {tpoRoundCalendarMutationSchema,parseIstRoundLocalTime} from "@/modules/placements/tpo-round-calendar-model";
import {tpoInterviewRescheduleSchema,validInterviewWindow,overlappingInterviewVenue} from "@/modules/placements/tpo-interview-reschedule-model";
import {buildTpoRoundDriveDayRoster} from "@/modules/placements/tpo-round-drive-day-model";
import {projectTpoRoundFacts} from "@/modules/placements/tpo-round-facts-model";
import {roundApplyPreviewCsv,roundApplyReportCsv} from "@/modules/placements/tpo-round-apply-csv-model";

const uuid=(i:number)=>"00000000-0000-4000-8000-"+String(i).padStart(12,"0");
const now=new Date("2099-01-01T08:00:00Z");
const roster=[
 {applicationId:uuid(1),email:"a@example.test",roll:"A01",currentResultId:null,currentStatus:null,name:"Ada"},
 {applicationId:uuid(2),email:"b@example.test",roll:"B02",currentResultId:null,currentStatus:null,name:"Bob"},
];
describe("chat-2 round import, calendar, roster and privacy behavioural coverage",()=>{
 it("TPO-drive-workspace-40 import confirmation requires SHA-256 and forbids conflicting row choices",()=>{
  const valid={action:"STAGE_IMPORT",confirmed:true,previewToken:"a".repeat(64),
   missingPolicy:"LEAVE_PENDING",overrides:[{line:2,applicationId:uuid(1)}],skippedLines:[3]};
  expect(roundImportActionSchema.safeParse(valid).success).toBe(true);
  for(const bad of [
   {...valid,confirmed:false},{...valid,previewToken:"z".repeat(64)},
   {...valid,previewToken:"A".repeat(64)},
   {...valid,missingPolicy:"IGNORE"},
   {...valid,overrides:[{line:2,applicationId:uuid(1)},{line:2,applicationId:uuid(2)}]},
   {...valid,overrides:[{line:2,applicationId:uuid(1)},{line:4,applicationId:uuid(1)}]},
   {...valid,skippedLines:[3,3]},{...valid,skippedLines:[2]},
   {...valid,collegeId:uuid(8)}
  ])expect(roundImportActionSchema.safeParse(bad).success).toBe(false);
 });
 it("TPO-drive-workspace-40 never returns raw SQL, credentials or tenant IDs as row errors",()=>{
  const raw="password=secret; select * from placement_round_results; 42Students internal key";
  for(const cause of [new Error(raw),raw,{message:raw},null]){
   const safe=tpoRoundImportStageFailureReason(cause);
   expect(safe).toContain("Refresh the round");
   expect(safe).not.toContain("password");
   expect(safe).not.toContain("placement_round_results");
   expect(safe).not.toContain("secret");
  }
 });
 it("TPO-drive-workspace-40 resolves duplicates without guessing between different JOIN evidence",()=>{
  expect(uniqueTpoRoundImportRoster([roster[0],{...roster[0]},roster[1]])).toEqual(roster);
  expect(uniqueTpoRoundImportRoster([roster[0],{...roster[0],email:"forged@example.test"},roster[1]])).toEqual([roster[1]]);
  expect(matchTpoRoundImportRoster({applicationId:uuid(1),email:"a@example.test",roll:"A01"},roster)).toEqual([roster[0]]);
  expect(matchTpoRoundImportRoster({applicationId:uuid(1),email:"b@example.test",roll:"A01"},roster)).toEqual([]);
  expect(matchTpoRoundImportRoster({applicationId:"",email:"",roll:""},roster)).toEqual([]);
  expect(matchTpoRoundImportRoster({applicationId:"",email:"B@EXAMPLE.TEST",roll:"B02"},roster)).toEqual([roster[1]]);
 });
 it("TPO-drive-workspace-40 import preview fingerprint changes on file, audience, status or round",()=>{
  const bytes=Buffer.from("one","utf8");
  const original=tpoRoundImportPreviewToken(uuid(9),bytes,roster);
  expect(original).toMatch(/^[0-9a-f]{64}$/);
  expect(original).toBe(tpoRoundImportPreviewToken(uuid(9),bytes,[...roster].reverse()));
  expect(original).not.toBe(tpoRoundImportPreviewToken(uuid(8),bytes,roster));
  expect(original).not.toBe(tpoRoundImportPreviewToken(uuid(9),Buffer.from("two"),roster));
  expect(original).not.toBe(tpoRoundImportPreviewToken(uuid(9),bytes,roster.map((r,i)=>i?{...r,currentStatus:"APPLIED"}:r)));
 });
 it("TPO-drive-workspace-40 CSV result template accepts a valid outcome and rejects ambiguous columns",()=>{
  expect(ROUND_IMPORT_TEMPLATE).toContain("Application ID,Email,Roll number,Result");
  const csv=ROUND_IMPORT_TEMPLATE+uuid(1)+",a@example.test,A01,Waitlisted,2,Awaiting review\n";
  const rows=parseTpoRoundImport(Buffer.from(csv,"utf8"),"results.csv");
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({applicationId:uuid(1),outcome:"HOLD",rank:2,invalidRank:false});
  expect(()=>parseTpoRoundImport(Buffer.from("Email,Student email,Result\na@example.test,a@example.test,PASS\n"),"results.csv")).toThrow();
  expect(()=>parseTpoRoundImport(Buffer.from("Company ID,Result\nACME,PASS\n"),"results.csv")).toThrow();
  expect(()=>parseTpoRoundImport(Buffer.from(csv),"results.txt")).toThrow();
  expect(()=>parseTpoRoundImport(Buffer.alloc(3_000_001),"results.csv")).toThrow();
 });
 it("TPO-calendar-reports-R07 schedules valid IST wall times and rejects impossible calendar days",()=>{
  expect(parseIstRoundLocalTime("2099-01-01T09:15").toISOString()).toBe("2099-01-01T03:45:00.000Z");
  expect(()=>parseIstRoundLocalTime("2099-02-29T12:00")).toThrow();
  expect(()=>parseIstRoundLocalTime("2099-01-01T25:00")).toThrow();
  const base={action:"SCHEDULE",confirmed:true,roundId:uuid(1),expectedUpdatedAt:"2099-01-01T08:00:00Z",
   localDateTime:"2099-01-01T09:15",mode:"ON_CAMPUS",venue:"Block B"};
  expect(tpoRoundCalendarMutationSchema.safeParse(base).success).toBe(true);
  for(const bad of [
   {...base,confirmed:false},{...base,venue:""},
   {...base,mode:"VIRTUAL",venue:undefined},
   {...base,action:"CANCEL",reason:""},
   {...base,jobId:uuid(2)}
  ])expect(tpoRoundCalendarMutationSchema.safeParse(bad).success).toBe(false);
 });
 it("TPO-drive-workspace-44 reschedule requires a secure meeting link, reason and optimistic version",()=>{
  const base={confirmed:true,expectedUpdatedAt:"2099-01-01T08:00:00Z",
   localDateTime:"2099-01-02T12:00",mode:"ON_CAMPUS",venue:"Hall A",reason:"Company requested a new time"};
  expect(tpoInterviewRescheduleSchema.safeParse(base).success).toBe(true);
  expect(tpoInterviewRescheduleSchema.safeParse({...base,mode:"VIRTUAL",venue:undefined,
   meetingUrl:"https://meet.example.test/session"}).success).toBe(true);
  for(const bad of [
   {...base,confirmed:false},{...base,reason:"late"},
   {...base,expectedUpdatedAt:"not-a-date"},
   {...base,mode:"VIRTUAL",venue:undefined},
   {...base,mode:"VIRTUAL",meetingUrl:"http://meet.example.test/session"},
   {...base,mode:"VIRTUAL",meetingUrl:"https://name:password@meet.example.test/session"},
  ])expect(tpoInterviewRescheduleSchema.safeParse(bad).success).toBe(false);
 });
 it("TPO-drive-workspace-44 venue conflict policy rejects corrupt dates and impossible durations",()=>{
  const future=new Date("2099-01-01T09:00:00Z");
  expect(validInterviewWindow(future,now,30)).toBe(true);
  expect(validInterviewWindow(now,now,30)).toBe(false);
  expect(validInterviewWindow(future,now,1441)).toBe(false);
  expect(overlappingInterviewVenue(future,30,[{start:new Date("2099-01-01T09:30:00Z"),durationMinutes:30}])).toBe(false);
  expect(overlappingInterviewVenue(future,30,[{start:new Date("2099-01-01T09:29:00Z"),durationMinutes:30}])).toBe(true);
  expect(overlappingInterviewVenue(future,1441,[])).toBe(true);
  expect(overlappingInterviewVenue(future,30,[{start:future,durationMinutes:1441}])).toBe(true);
  expect(overlappingInterviewVenue(new Date("bad"),30,[])).toBe(true);
 });
 it("TPO-drive-workspace-40 roster strips ambiguous application details and never invents a result",()=>{
  const students=[
   {applicationId:uuid(1),displayName:"Ada",rollNumber:"A01",attendance:"WAITING"},
   {applicationId:uuid(2),displayName:"Bob",rollNumber:"B02",attendance:"DONE"},
   {applicationId:uuid(3),displayName:"No detail",rollNumber:null,attendance:"PRESENT"}
  ];
  const details=[
   {applicationId:uuid(1),applicationStatus:"SUBMITTED",resultStatus:null,resultOutcome:"PASS"},
   {applicationId:uuid(2),applicationStatus:"SUBMITTED",resultStatus:"STAGED",resultOutcome:"HOLD"},
  ];
  const projected=buildTpoRoundDriveDayRoster(students,details);
  expect(projected.rows.map(x=>x.applicationId)).toEqual([uuid(1),uuid(2)]);
  expect(projected.rows[0]?.resultOutcome).toBeNull();
  expect(projected.counts).toMatchObject({total:2,waiting:1,done:1,stagedResults:1,noResult:1});
  expect(buildTpoRoundDriveDayRoster(students,[details[0],{...details[0],resultStatus:"APPLIED"},details[1]]).rows.map(x=>x.applicationId)).toEqual([uuid(2)]);
  expect(buildTpoRoundDriveDayRoster([...students,students[0]],details).rows).toHaveLength(2);
 });
 it("TPO-drive-workspace-62 projects honest round counts and only mapped legacy states",()=>{
  const projected=projectTpoRoundFacts({id:uuid(1),name:"Technical",status:"COMPLETED",sequence:1,
   mode:"ON_CAMPUS",scheduledAt:"2099-01-01T09:00:00Z",resultsDueAt:null,venue:"Hall A",
   meetingUrl:null,platform:null,testUrl:null,durationMinutes:30,whatToBring:null,
   participants:[{result:{status:"STAGED"}},{result:{status:"APPLIED"}},{result:null}]});
  expect(projected.status).toBe("Done");
  expect(projected.results).toBe("1 waiting to apply");
  expect(projected.students).toBe(3);
  expect(projected.when).toContain("IST");
  expect(projected.due).toBe("Not set");
  expect(projected.place).toBe("Hall A");
 });
 it("TPO-drive-workspace-42 preview and result CSV neutralize spreadsheet injection",()=>{
  const preview=roundApplyPreviewCsv([{student:'=HYPERLINK("https://bad.test")',outcome:"PASS",destination:"+cmd",status:"STAGED"}]);
  expect(preview).toContain("'=HYPERLINK");
  expect(preview).toContain("'+cmd");
  const report=roundApplyReportCsv([{student:"Ada",outcome:"FAIL",status:"skipped",reason:"@SUM(1,2)"}]);
  expect(report).toContain("'@SUM");
  expect(report).toContain("Learner");
 });
});
