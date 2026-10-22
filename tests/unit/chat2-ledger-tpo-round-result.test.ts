import { describe, expect, it } from "vitest";
import { roundReorderLockMessage, moveRound } from "@/modules/placements/tpo-round-reorder-model";
import { summarizeRoundApply, roundApplyPreviewToken, roundApplyInputSchema } from "@/modules/placements/tpo-round-apply-model";
import { roundApplyPreviewCsv, roundApplyReportCsv } from "@/modules/placements/tpo-round-apply-csv-model";
import { TPO_RESULT_LABELS, canEditTpoRoundResult, canApplyTpoRoundResult } from "@/modules/placements/tpo-confirmed-round-result-model";
import { tpoRoundResultEntryFormSchema } from "@/modules/placements/tpo-round-result-entry-model";

const a="00000000-0000-4000-8000-000000000001",b="00000000-0000-4000-8000-000000000002";
const rows=[
 {resultId:a,applicationId:b,student:"A",outcome:"PASS",status:"STAGED",version:1},
 {resultId:b,applicationId:a,student:"B",outcome:"HOLD",status:"APPLIED",version:2},
];

describe("TPO-drive-workspace-37/40/42 placement round lifecycle ledger",()=>{
 it("locks reordering for finished drives and every round with execution artifacts",()=>{
  expect(roundReorderLockMessage({jobStatus:"CLOSED",roundStatuses:["PENDING","PENDING"],hasExecutionArtifacts:false})).toContain("ended");
  expect(roundReorderLockMessage({jobStatus:"OPEN",roundStatuses:["PENDING"],hasExecutionArtifacts:false})).toContain("two rounds");
  expect(roundReorderLockMessage({jobStatus:"OPEN",roundStatuses:["PENDING","COMPLETED"],hasExecutionArtifacts:false})).toContain("locked");
  expect(roundReorderLockMessage({jobStatus:"OPEN",roundStatuses:["PENDING","PENDING"],hasExecutionArtifacts:true})).toContain("locked");
  expect(roundReorderLockMessage({jobStatus:"OPEN",roundStatuses:["PENDING","PENDING"],hasExecutionArtifacts:false})).toBeNull();
 });
 it("reorders only known rounds and does not mutate the caller's list",()=>{
  const original=["a","b","c"];
  expect(moveRound(original,"a",2)).toEqual(["b","c","a"]);
  expect(moveRound(original,"missing",1)).toEqual(original);
  expect(moveRound(original,"a",9)).toEqual(original);
  expect(original).toEqual(["a","b","c"]);
 });
 it("counts staged outcome categories separately from applied rows",()=>{
  expect(summarizeRoundApply(rows)).toEqual({staged:1,applied:1,outcomes:{PASS:1,FAIL:0,HOLD:0,ABSENT:0}});
 });
 it("preview tokens are stable under row order but change after edit, version or round identity change",()=>{
  const first=roundApplyPreviewToken("round",rows);
  expect(first).toMatch(/^[a-f0-9]{64}$/);
  expect(roundApplyPreviewToken("round",[...rows].reverse())).toBe(first);
  expect(roundApplyPreviewToken("other-round",rows)).not.toBe(first);
  expect(roundApplyPreviewToken("round",rows.map((row,i)=>i?{...row,version:3}:row))).not.toBe(first);
  expect(roundApplyPreviewToken("round",rows.map((row,i)=>i?{...row,outcome:"FAIL"}:row))).not.toBe(first);
 });
 it("requires explicit acknowledgement and full 64-character preview token",()=>{
  const token=roundApplyPreviewToken("round",rows);
  expect(roundApplyInputSchema.safeParse({confirmed:true,expectedPreviewToken:token}).success).toBe(true);
  expect(roundApplyInputSchema.safeParse({confirmed:false,expectedPreviewToken:token}).success).toBe(false);
  expect(roundApplyInputSchema.safeParse({confirmed:true,expectedPreviewToken:token.slice(1)}).success).toBe(false);
  expect(roundApplyInputSchema.safeParse({confirmed:true,expectedPreviewToken:token,tenantId:"other"}).success).toBe(false);
 });
 it("neutralizes spreadsheet formula payloads in preview and report CSV exports",()=>{
  const preview=roundApplyPreviewCsv([{student:"=CMD()",outcome:"PASS",destination:"+http",status:"STAGED"}]);
  expect(preview).toContain('"\'=CMD()"');
  expect(preview).toContain('"\'+http"');
  const report=roundApplyReportCsv([{student:"@call",outcome:"FAIL",status:"skipped",reason:"=bad"}]);
  expect(report).toContain('"\'@call"');
  expect(report).toContain('"\'=bad"');
 });
 it("preserves legacy outcome semantics and blocks premature application",()=>{
  expect(TPO_RESULT_LABELS.PASS).toBe("Pass");
  expect(TPO_RESULT_LABELS.HOLD).toBe("Waitlist");
  expect(canEditTpoRoundResult({kind:"INTERVIEW",status:"SCHEDULED"},{resultStatus:null})).toBe(true);
  expect(canEditTpoRoundResult({kind:"TALK",status:"COMPLETED"},{resultStatus:"STAGED"})).toBe(false);
  expect(canEditTpoRoundResult({kind:"INTERVIEW",status:"COMPLETED"},{resultStatus:"APPLIED"})).toBe(false);
  expect(canApplyTpoRoundResult({kind:"INTERVIEW",status:"COMPLETED"},{resultStatus:"STAGED"})).toBe(true);
  expect(canApplyTpoRoundResult({kind:"INTERVIEW",status:"SCHEDULED"},{resultStatus:"STAGED"})).toBe(false);
  expect(canApplyTpoRoundResult({kind:"INTERVIEW",status:"COMPLETED"},{resultStatus:"APPLIED"})).toBe(false);
 });
 it("rejects malformed result entry and requires explicit waitlist rank and note",()=>{
  const input={applicationId:a,expectedCurrentResultId:null,outcome:"PASS",note:"Good result",waitlistRank:""};
  expect(tpoRoundResultEntryFormSchema.safeParse(input).success).toBe(true);
  expect(tpoRoundResultEntryFormSchema.safeParse({...input,note:"  "}).success).toBe(false);
  expect(tpoRoundResultEntryFormSchema.safeParse({...input,outcome:"HOLD",waitlistRank:"0"}).success).toBe(false);
 });
});
