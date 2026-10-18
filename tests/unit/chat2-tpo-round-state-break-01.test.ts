import {describe,expect,it} from "vitest";
import {roundReorderLockMessage,moveRound} from "@/modules/placements/tpo-round-reorder-model";
import {roundApplyInputSchema,summarizeRoundApply,roundApplyPreviewToken,roundApplyFailureReason} from "@/modules/placements/tpo-round-apply-model";

const a={resultId:"a",applicationId:"learner-a",student:"Student A",
 outcome:"PASS",status:"STAGED",version:1};
const b={resultId:"b",applicationId:"learner-b",student:"Student B",
 outcome:"FAIL",status:"APPLIED",version:1};

describe("TPO-BREAK-round-01 outcome integrity and reorder guards",()=>{
 it("locks reorder after drive closure or any execution artifact even with pending status",()=>{
  for(const status of ["CLOSED","CANCELLED","ARCHIVED"])
   expect(roundReorderLockMessage({jobStatus:status,roundStatuses:["PENDING","PENDING"],
    hasExecutionArtifacts:false})).toMatch(/locked/);
  expect(roundReorderLockMessage({jobStatus:"PUBLISHED",roundStatuses:["PENDING","PENDING"],
   hasExecutionArtifacts:true})).toMatch(/locked/);
  expect(roundReorderLockMessage({jobStatus:"PUBLISHED",roundStatuses:["SCHEDULED","PENDING"],
   hasExecutionArtifacts:false})).toMatch(/locked/);
  expect(roundReorderLockMessage({jobStatus:"PUBLISHED",roundStatuses:["PENDING","PENDING"],
   hasExecutionArtifacts:false})).toBeNull();
 });
 it("does not mutate a round order or accept ambiguous/invalid indices",()=>{
  const ids=["one","two","three"];
  expect(moveRound(ids,"one",2)).toEqual(["two","three","one"]);
  for(const index of [-1,3,0.5,Number.NaN,Number.POSITIVE_INFINITY])
   expect(moveRound(ids,"one",index)).toEqual(ids);
  expect(moveRound(ids,"other",1)).toEqual(ids);
  expect(moveRound(["one","two","one"],"one",2)).toEqual(["one","two","one"]);
  expect(ids).toEqual(["one","two","three"]);
 });
 it("only counts known staged outcomes, never inherited object property names",()=>{
  const summary=summarizeRoundApply([
   a,b,{...a,resultId:"c",outcome:"HOLD"},
   {...a,resultId:"d",outcome:"constructor"},
   {...a,resultId:"e",outcome:"toString"},
   {...a,resultId:"f",outcome:"__proto__"},
   {...a,resultId:"g",outcome:"UNKNOWN"},
  ]);
  expect(summary.staged).toBe(6);
  expect(summary.applied).toBe(1);
  expect(summary.outcomes).toEqual({PASS:1,FAIL:0,HOLD:1,ABSENT:0});
  expect(Object.keys(summary.outcomes)).toEqual(["PASS","FAIL","HOLD","ABSENT"]);
 });
 it("round apply preview version token invalidates stale tabs and does not depend on row order",()=>{
  const token=roundApplyPreviewToken("round-1",[a,b]);
  expect(token).toMatch(/^[0-9a-f]{64}$/);
  expect(roundApplyPreviewToken("round-1",[b,a])).toBe(token);
  expect(roundApplyPreviewToken("round-2",[a,b])).not.toBe(token);
  expect(roundApplyPreviewToken("round-1",[{...a,version:2},b])).not.toBe(token);
  expect(roundApplyPreviewToken("round-1",[{...a,status:"APPLIED"},b])).not.toBe(token);
  expect(roundApplyPreviewToken("round-1",[{...a,outcome:"HOLD"},b])).not.toBe(token);
 });
 it("TPO-BREAK-round-42 masks SQL, provider and session secrets in skipped-result reports",()=>{
  const problems=[
    new Error("password=secret host=postgres.internal"),
    new Error("duplicate key violates unique constraint \"placement_result_application_key\""),
    "access_token=private",null,undefined,
  ];
  for(const error of problems){
    const message=roundApplyFailureReason(error);
    expect(message).toContain("Refresh this round");
    expect(message).not.toMatch(/password|postgres|secret|duplicate key|constraint|access_token/i);
  }
 });
 it("round apply requires exact 64-character preview token and an explicit confirm",()=>{
  expect(roundApplyInputSchema.safeParse({confirmed:true,expectedPreviewToken:"a".repeat(64)}).success).toBe(true);
  for(const body of [
   {confirmed:false,expectedPreviewToken:"a".repeat(64)},
   {confirmed:true,expectedPreviewToken:"x"},
   {confirmed:true,expectedPreviewToken:"a".repeat(64),collegeId:"other"},
  ])expect(roundApplyInputSchema.safeParse(body).success).toBe(false);
 });
});
