import {describe,expect,it} from "vitest";
import {verificationWaitingAttentionValid} from "@/modules/verification/queue-filters";
import {parseCollegeVerificationPageQuery} from "@/modules/verification/page-query";
import {parseVerificationExportQuery} from "@/modules/verification/export-query";
describe("Verification attention is status scoped",()=>{
 it("rejects decided-tab overdue and verified-update triage",()=>{
  for(const attention of ["WAITING_OVER_WEEK","VERIFIED_DETAILS_CHANGED"]){
   expect(verificationWaitingAttentionValid({tab:"VERIFIED",attention})).toBe(false);
   expect(parseCollegeVerificationPageQuery({tab:"SENT_BACK",attention}).success).toBe(false);
   expect(()=>parseVerificationExportQuery(new URLSearchParams({tab:"VERIFIED",attention}))).toThrow();
  }
 });
 it("permits waiting triage and the separate Education document cue",()=>{
  expect(parseCollegeVerificationPageQuery({tab:"WAITING",attention:"WAITING_OVER_WEEK"}).success).toBe(true);
  expect(parseCollegeVerificationPageQuery({tab:"VERIFIED",attention:"MISSING_MARKSHEET"}).success).toBe(true);
 });
});
