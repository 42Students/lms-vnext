import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseTpoRoundImport, roundImportActionSchema, ROUND_IMPORT_TEMPLATE, matchTpoRoundImportRoster, uniqueTpoRoundImportRoster } from "@/modules/placements/tpo-round-import-model";
import {tpoRoundImportPreviewToken} from "@/modules/placements/tpo-round-import-preview-token";
import { parseIstRoundLocalTime, tpoRoundCalendarMutationSchema } from "@/modules/placements/tpo-round-calendar-model";
import { tpoInterviewRescheduleSchema, validInterviewWindow, overlappingInterviewVenue } from "@/modules/placements/tpo-interview-reschedule-model";

const uuid="00000000-0000-4000-8000-000000000001";
const other="00000000-0000-4000-8000-000000000002";
const token="a".repeat(64);
const csv=(body:string)=>Buffer.from(body,"utf8");

describe("TPO-drive-workspace-40/44 round import and scheduling ledger",()=>{
 it("reads approved CSV result synonyms with exact line provenance",()=>{
  const parsed=parseTpoRoundImport(csv("Application ID,Result,Waitlist rank,Student message\n"+uuid+",Shortlisted,,Great work\n"+other+",Waitlisted,2,Please prepare\n"),"round.csv");
  expect(parsed).toHaveLength(2);
  expect(parsed[0]).toMatchObject({line:2,applicationId:uuid,outcome:"PASS",message:"Great work",invalidRank:false});
  expect(parsed[1]).toMatchObject({line:3,applicationId:other,outcome:"HOLD",rank:2,invalidRank:false});
  expect(ROUND_IMPORT_TEMPLATE).toContain("Application ID");
 });
 it("does not mistake an unsupported company portal ID for the applicant's internal identity",()=>{
  expect(()=>parseTpoRoundImport(csv("Company ID,Result\nexternal-123,PASS\n"),"round.csv")).toThrow("Application ID, Email or Roll");
 });
 it("rejects same-meaning duplicate CSV headers and malformed blank data rows",()=>{
  expect(()=>parseTpoRoundImport(csv("Application ID,Email,Student Email,Result\n"+uuid+",a@x.test,b@x.test,PASS\n"),"round.csv")).toThrow("more than one column");
  expect(()=>parseTpoRoundImport(csv("Application ID,Result\n"+uuid+",PASS\n\n"),"round.csv")).toThrow("blank data rows");
  expect(()=>parseTpoRoundImport(csv("Application ID,Result\n"+uuid+",PASS\n"),"round.txt")).toThrow(".xlsx or a .csv");
 });
 it("flags ranks for non-HOLD statuses and rank bounds",()=>{
  const result=parseTpoRoundImport(csv("Application ID,Result,Rank\n"+uuid+",PASS,1\n"+other+",HOLD,0\n"),"round.csv");
  expect(result[0]).toMatchObject({invalidRank:true,rank:null});
  expect(result[1]).toMatchObject({invalidRank:true,rank:null});
 });
 it("rejects spreadsheet-notated or out-of-range waitlist ranks without silently normalizing them",()=>{
  for(const rank of ["1e2","0x10","1.5","0","100001","001","-1"]){
   const rows=parseTpoRoundImport(csv("Application ID,Result,Rank\n"+uuid+",HOLD,"+rank+"\n"),"results.csv");
   expect(rows[0]).toMatchObject({invalidRank:true,rank:null});
  }
  const valid=parseTpoRoundImport(csv("Application ID,Result,Rank\n"+uuid+",HOLD,100\n"),"results.csv");
  expect(valid[0]).toMatchObject({invalidRank:false,rank:100});
 });
 it("TPO-drive-workspace-40 refuses a stale review when the file, roster, or persisted result changes",()=>{
  const learner={applicationId:uuid,currentResultId:null,currentStatus:null,
   name:"Ada",email:"ada@example.test",roll:"42"};
  const another={...learner,applicationId:other,name:"Bob",email:"bob@example.test",roll:"43"};
  const file=csv("Application ID,Result\n"+uuid+",HOLD\n");
  const preview=tpoRoundImportPreviewToken(uuid,file,[learner,another]);
  expect(preview).toMatch(/^[a-f0-9]{64}$/);
  expect(tpoRoundImportPreviewToken(uuid,file,[another,learner])).toBe(preview);
  expect(tpoRoundImportPreviewToken(other,file,[learner,another])).not.toBe(preview);
  expect(tpoRoundImportPreviewToken(uuid,csv("different result"),[learner,another])).not.toBe(preview);
  expect(tpoRoundImportPreviewToken(uuid,file,[learner])).not.toBe(preview);
  expect(tpoRoundImportPreviewToken(uuid,file,[{...learner,currentStatus:"APPLIED"},another])).not.toBe(preview);
  expect(tpoRoundImportPreviewToken(uuid,file,[{...learner,currentResultId:other},another])).not.toBe(preview);
  const service=readFileSync("src/modules/placements/tpo-round-import-service.ts","utf8");
  expect(service).toContain("tpoRoundImportPreviewToken(scoped.roundId,bytes,scoped.roster)");
  expect(service).toContain("tpoRoundImportPreviewToken(roster.roundId,bytes,roster.roster)!==input.previewToken");
  expect(service).toContain('throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE")');
 });
 it("never stages a guessed identity when import roster JOIN evidence is duplicated or contradictory",()=>{
  const source=[
   {applicationId:uuid,name:"Ada",email:"ada@example.test",roll:"1",currentResultId:null,currentStatus:null},
   {applicationId:uuid,name:"Ada",email:"ada@example.test",roll:"1",currentResultId:null,currentStatus:null},
   {applicationId:other,name:"Bob",email:"bob@example.test",roll:"2",currentResultId:null,currentStatus:null},
  ];
  const original=JSON.stringify(source);
  const deduped=uniqueTpoRoundImportRoster(source);
  expect(deduped).toHaveLength(2);
  expect(deduped.map(row=>row.applicationId)).toEqual([uuid,other]);
  expect(JSON.stringify(source)).toBe(original);
  const contradictory=[...source,{...source[0]!,currentResultId:other}];
  expect(uniqueTpoRoundImportRoster(contradictory).map(row=>row.applicationId)).toEqual([other]);
  const forged=[...source,{...source[2]!,roll:"other-learner"}];
  expect(uniqueTpoRoundImportRoster(forged).map(row=>row.applicationId)).toEqual([uuid]);
  expect(uniqueTpoRoundImportRoster([])).toEqual([]);
 });
 it("TPO-drive-workspace-40 never stages a learner from contradictory ID, email or roll identities",()=>{
  const roster=[
   {applicationId:uuid,email:"ada@example.test",roll:"A001"},
   {applicationId:other,email:"bob@example.test",roll:"B002"},
  ];
  expect(matchTpoRoundImportRoster({applicationId:uuid,email:"ada@example.test",roll:"A001"},roster))
   .toEqual([roster[0]]);
  expect(matchTpoRoundImportRoster({applicationId:uuid,email:"bob@example.test",roll:"A001"},roster))
   .toEqual([]);
  expect(matchTpoRoundImportRoster({applicationId:uuid,email:"ada@example.test",roll:"B002"},roster))
   .toEqual([]);
  expect(matchTpoRoundImportRoster({applicationId:"",email:"",roll:""},roster))
   .toEqual([]);
  expect(matchTpoRoundImportRoster({applicationId:"",email:"BOB@EXAMPLE.TEST",roll:""},roster))
   .toEqual([roster[1]]);
  const duplicate=[...roster,{applicationId:other+"-forged",email:"bob@example.test",roll:"B003"}];
  expect(matchTpoRoundImportRoster({applicationId:"",email:"bob@example.test",roll:""},duplicate))
   .toHaveLength(2);
  const source=readFileSync("src/modules/placements/tpo-round-import-service.ts","utf8");
  expect(source).toContain("const matchSource=matchTpoRoundImportRoster;");
 });
 it("review command requires one explicit decision per source line and unique student identity",()=>{
  const action={action:"STAGE_IMPORT",confirmed:true,previewToken:token,missingPolicy:"LEAVE_PENDING",overrides:[{line:2,applicationId:uuid}],skippedLines:[3]};
  expect(roundImportActionSchema.safeParse(action).success).toBe(true);
  expect(roundImportActionSchema.safeParse({...action,confirmed:false}).success).toBe(false);
  expect(roundImportActionSchema.safeParse({...action,overrides:[{line:2,applicationId:uuid},{line:2,applicationId:other}]}).success).toBe(false);
  expect(roundImportActionSchema.safeParse({...action,skippedLines:[2]}).success).toBe(false);
  expect(roundImportActionSchema.safeParse({...action,skippedLines:[3,3]}).success).toBe(false);
 });
 it("converts local IST wall time without depending on host timezone",()=>{
  expect(parseIstRoundLocalTime("2026-10-20T09:30").toISOString()).toBe("2026-10-20T04:00:00.000Z");
  expect(()=>parseIstRoundLocalTime("2026-02-30T09:30")).toThrow("Invalid IST");
 });
 it("requires valid scheduled locations and cancellation reasons",()=>{
  const base={confirmed:true,roundId:uuid,expectedUpdatedAt:"2026-10-19T09:00:00+05:30",action:"SCHEDULE",localDateTime:"2026-10-20T09:30",mode:"ON_CAMPUS",venue:"Main hall"};
  expect(tpoRoundCalendarMutationSchema.safeParse(base).success).toBe(true);
  expect(tpoRoundCalendarMutationSchema.safeParse({...base,venue:""}).success).toBe(false);
  expect(tpoRoundCalendarMutationSchema.safeParse({...base,action:"CANCEL",reason:"x"}).success).toBe(false);
  expect(tpoRoundCalendarMutationSchema.safeParse({...base,action:"CANCEL",reason:"No room available"}).success).toBe(true);
 });
 it("rescheduling validates mode, reason and positive future slot",()=>{
  const base={confirmed:true,expectedUpdatedAt:"2026-10-19T09:00:00+05:30",localDateTime:"2026-10-20T10:00",mode:"VIRTUAL",meetingUrl:"https://meeting.example.org/room",reason:"Panel member unavailable"};
  expect(tpoInterviewRescheduleSchema.safeParse(base).success).toBe(true);
  expect(tpoInterviewRescheduleSchema.safeParse({...base,meetingUrl:"javascript:alert(1)"}).success).toBe(false);
  expect(tpoInterviewRescheduleSchema.safeParse({...base,reason:"short"}).success).toBe(false);
  expect(validInterviewWindow(new Date("2026-10-20T10:00:00Z"),new Date("2026-10-20T09:00:00Z"),30)).toBe(true);
  expect(validInterviewWindow(new Date("2026-10-20T08:00:00Z"),new Date("2026-10-20T09:00:00Z"),30)).toBe(false);
  expect(validInterviewWindow(new Date("2026-10-20T10:00:00Z"),new Date("2026-10-20T09:00:00Z"),0)).toBe(false);
 });
 it("allows touching interviews but conservatively blocks unknown-duration bookings",()=>{
  const start=new Date("2026-10-20T04:00:00Z");
  expect(overlappingInterviewVenue(start,30,[{start:new Date("2026-10-20T03:30:00Z"),durationMinutes:30}])).toBe(false);
  expect(overlappingInterviewVenue(start,30,[{start:new Date("2026-10-20T03:50:00Z"),durationMinutes:30}])).toBe(true);
  expect(overlappingInterviewVenue(start,30,[{start:new Date("2026-10-20T03:30:00Z"),durationMinutes:null}])).toBe(true);
 });
});
