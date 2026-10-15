import {describe,expect,it} from "vitest";
import {parseVerificationExportQuery} from "@/modules/verification/export-query";
describe("College verification CSV typed filter boundary",()=>{
 it("rejects ambiguous or mutually incompatible date and status queries",()=>{
  for(const search of [
   "tab=WAITING&tab=VERIFIED",
   "tab=VERIFIED&waitingState=SUBMITTED",
   "tab=WAITING&submittedFrom=2026-10-16&waitingSince=2026-10-15",
   "collegeId=00000000-0000-4000-8000-000000000001",
  ]){
   expect(()=>parseVerificationExportQuery(new URLSearchParams(search))).toThrow();
  }
 });
 it("accepts the same valid filters as the interactive queue",()=>{
  const filter=parseVerificationExportQuery(new URLSearchParams("tab=WAITING&waitingState=UPDATE_PENDING&submittedFrom=2026-10-14"));
  expect(filter).toMatchObject({tab:"WAITING",waitingState:"UPDATE_PENDING",submittedFrom:"2026-10-14"});
 });
});
