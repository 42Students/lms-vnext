import {describe,it,expect} from "vitest";
import {verificationDecisionHistory} from "@/modules/verification/review-decision-history";
describe("College verification past decisions",()=>{
 it("labels no decision or note explicitly",()=>{
  expect(verificationDecisionHistory({decidedAt:null,note:null})).toEqual({decidedAt:null,note:null});
  expect(verificationDecisionHistory({decidedAt:"invalid",note:"   "}).note).toBeNull();
 });
 it("shows a recorded IST time and stored correction text without inferring current status",()=>{
  const summary=verificationDecisionHistory({decidedAt:"2026-10-15T04:30:00.000Z",note:"  Missing second-year marksheet  "});
  expect(summary.decidedAt).toBeTruthy();
  expect(summary.note).toBe("Missing second-year marksheet");
 });
});
