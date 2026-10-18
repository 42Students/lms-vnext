import {describe,expect,it} from "vitest";
import {confirmedTpoRoundResultSchema,TPO_RESULT_LABELS,canApplyTpoRoundResult,canEditTpoRoundResult} from "@/modules/placements/tpo-confirmed-round-result-model";
import {tpoRoundResultEntryFormSchema} from "@/modules/placements/tpo-round-result-entry-model";
import {tpoLiveRoundSearchSchema,filterTpoLiveRoundSearch} from "@/modules/placements/tpo-live-round-search-model";
import {tpoLiveRoundTiming} from "@/modules/placements/tpo-live-round-timing-model";
import {tpoLiveRoundVenueLabel} from "@/modules/placements/tpo-live-round-venue-model";
import {tpoLiveRoundJobHref} from "@/modules/placements/tpo-live-round-job-link-model";

const applicationId="11111111-1111-4111-8111-111111111111";
const currentResultId="22222222-2222-4222-8222-222222222222";
const base={applicationId,expectedCurrentResultId:null,note:"Confirm with the cell before arrival",waitlistRank:""};

describe("TPO-BREAK-round-model-13: non-silent round results and live schedule projections",()=>{
 it("TPO-drive-workspace-40 stages PASS internally, but directs all non-pass notes to learners",()=>{
  const pass=tpoRoundResultEntryFormSchema.parse({...base,outcome:"PASS"});
  expect(pass).toMatchObject({confirmed:true,expectedCurrentResultId:null,
   result:{applicationId,outcome:"PASS",internalComment:base.note}});
  expect(pass.result).not.toHaveProperty("candidateMessage");
  for(const outcome of ["FAIL","ABSENT"] as const){
   const parsed=tpoRoundResultEntryFormSchema.parse({...base,outcome});
   expect(parsed.result).toMatchObject({applicationId,outcome,candidateMessage:base.note});
   expect(parsed.result).not.toHaveProperty("internalComment");
  }
  const hold=tpoRoundResultEntryFormSchema.parse({...base,outcome:"HOLD",waitlistRank:"100000"});
  expect(hold.result).toMatchObject({outcome:"HOLD",waitlistRank:100000,candidateMessage:base.note});
  expect(TPO_RESULT_LABELS.HOLD).toBe("On hold / waitlisted");
 });
 it("TPO-drive-workspace-40 never converts scientific, padded or overflow ranks into a valid stage",()=>{
  for(const rank of ["1e2","0x10","0001","1.5","0","-1","100001","999999","NaN"]){
   expect(tpoRoundResultEntryFormSchema.safeParse({...base,outcome:"HOLD",waitlistRank:rank}).success,rank).toBe(false);
  }
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,outcome:"HOLD",waitlistRank:""}).success).toBe(false);
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,outcome:"PASS",waitlistRank:"1"}).success).toBe(false);
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,outcome:"FAIL",note:""}).success).toBe(false);
  expect(tpoRoundResultEntryFormSchema.safeParse({...base,outcome:"HOLD",note:"ok",waitlistRank:"1",companyId:applicationId}).success).toBe(false);
 });
 it("TPO-drive-workspace-40 requires explicit confirmation and current result identity",()=>{
  const correct=confirmedTpoRoundResultSchema.safeParse({confirmed:true,expectedCurrentResultId:currentResultId,
   result:{applicationId,outcome:"PASS",internalComment:"Reviewed by the placement cell"}});
  expect(correct.success).toBe(true);
  expect(confirmedTpoRoundResultSchema.safeParse({confirmed:false,expectedCurrentResultId:null,
   result:{applicationId,outcome:"PASS"}}).success).toBe(false);
  expect(confirmedTpoRoundResultSchema.safeParse({confirmed:true,expectedCurrentResultId:undefined,
   result:{applicationId,outcome:"PASS"}}).success).toBe(false);
  expect(confirmedTpoRoundResultSchema.safeParse({confirmed:true,expectedCurrentResultId:null,
   result:{applicationId,outcome:"HOLD",waitlistRank:1,candidateMessage:"Waitlisted",collegeId:applicationId}}).success).toBe(false);
 });
 it("TPO-drive-workspace-42 forbids edits after applying and forbids applying an unfinished or talk round",()=>{
  const scheduled={kind:"INTERVIEW",status:"SCHEDULED"};
  const finished={kind:"INTERVIEW",status:"COMPLETED"};
  expect(canEditTpoRoundResult(scheduled,{resultStatus:null})).toBe(true);
  expect(canEditTpoRoundResult(finished,{resultStatus:"STAGED"})).toBe(true);
  expect(canEditTpoRoundResult(finished,{resultStatus:"APPLIED"})).toBe(false);
  expect(canEditTpoRoundResult({kind:"TALK",status:"COMPLETED"},{resultStatus:null})).toBe(false);
  expect(canApplyTpoRoundResult(finished,{resultStatus:"STAGED"})).toBe(true);
  for(const round of [scheduled,{kind:"TALK",status:"COMPLETED"},{kind:"INTERVIEW",status:"CANCELLED"}])
   expect(canApplyTpoRoundResult(round,{resultStatus:"STAGED"})).toBe(false);
  expect(canApplyTpoRoundResult(finished,{resultStatus:"APPLIED"})).toBe(false);
 });
 it("TPO-drive-workspace-44 bounds live round search and does not mutate the read-only source",()=>{
  const records=[{companyName:"Alpha",jobTitle:"Developer",name:"Technical"},{companyName:"Beta",jobTitle:"Analyst",name:"HR"}];
  expect(tpoLiveRoundSearchSchema.safeParse("X".repeat(101)).success).toBe(false);
  expect(tpoLiveRoundSearchSchema.parse(undefined)).toBe("");
  expect(filterTpoLiveRoundSearch(records,"   bEtA ")).toEqual([records[1]]);
  expect(filterTpoLiveRoundSearch(records,"techn")).toEqual([records[0]]);
  const all=filterTpoLiveRoundSearch(records," ");
  expect(all).toEqual(records);
  expect(all).not.toBe(records);
 });
 it("TPO-drive-workspace-44 refuses unknown or invalid meeting clocks without promising remaining time",()=>{
  const start="2099-10-20T04:00:00.000Z";
  expect(tpoLiveRoundTiming({scheduledAt:start,durationMinutes:30},"2099-10-20T04:10:50.000Z"))
   .toEqual({elapsedMinutes:10,remainingMinutes:20});
  expect(tpoLiveRoundTiming({scheduledAt:start,durationMinutes:30},"2099-10-20T04:40:00.000Z"))
   .toEqual({elapsedMinutes:40,remainingMinutes:0});
  for(const invalid of [null,0,-1,1.5,1441]){
   expect(tpoLiveRoundTiming({scheduledAt:start,durationMinutes:invalid},"2099-10-20T04:10:00.000Z"))
    .toEqual({elapsedMinutes:null,remainingMinutes:null});
  }
  expect(tpoLiveRoundTiming({scheduledAt:start,durationMinutes:30},"invalid"))
   .toEqual({elapsedMinutes:null,remainingMinutes:null});
  expect(tpoLiveRoundTiming({scheduledAt:start,durationMinutes:30},"2099-10-20T03:59:59.000Z"))
   .toEqual({elapsedMinutes:null,remainingMinutes:null});
 });
 it("TPO-drive-workspace-44 produces safe venue/drive navigation without exposing malformed tokens",()=>{
  expect(tpoLiveRoundVenueLabel(null)).toBe("Venue not recorded");
  expect(tpoLiveRoundVenueLabel("   ")).toBe("Venue not recorded");
  expect(tpoLiveRoundVenueLabel("  Main Hall  ")).toBe("Recorded venue: Main Hall");
  expect(tpoLiveRoundJobHref(applicationId)).toBe("/tpo/placements/jobs/"+applicationId);
  expect(tpoLiveRoundJobHref("../another-college")).toBe("/tpo/placements/jobs/..%2Fanother-college");
 });
});
