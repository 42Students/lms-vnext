import {describe,it,expect} from "vitest";
import {verificationQueueFilters,verificationWaitingStateValid} from "@/modules/verification/queue-filters";
import {parseCollegeVerificationPageQuery} from "@/modules/verification/page-query";
describe("College verification pending-state triage",()=>{
 it("accepts only submitted or updated waiting states",()=>{
  for(const waitingState of ["SUBMITTED","UPDATE_PENDING"] as const){
   const input=verificationQueueFilters.parse({waitingState});
   expect(verificationWaitingStateValid(input)).toBe(true);
   expect(parseCollegeVerificationPageQuery({waitingState}).success).toBe(true);
  }
  expect(verificationQueueFilters.safeParse({waitingState:"DRAFT"}).success).toBe(false);
 });
 it("does not silently apply a pending status to verified/sent-back tabs",()=>{
  expect(parseCollegeVerificationPageQuery({tab:"VERIFIED",waitingState:"SUBMITTED"}).success).toBe(false);
  expect(parseCollegeVerificationPageQuery({tab:"SENT_BACK",waitingState:"UPDATE_PENDING"}).success).toBe(false);
  expect(parseCollegeVerificationPageQuery({tab:"VERIFIED",waitingState:"ALL"}).success).toBe(true);
 });
});
