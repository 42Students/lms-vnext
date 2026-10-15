import {describe,it,expect} from "vitest";
import {verificationFilterDraftError} from "@/modules/verification/filter-draft-validation";
describe("verification form and server share filter refusal rules",()=>{
 it("rejects impossible decided-tab and waiting-only filters",()=>{
  expect(verificationFilterDraftError({tab:"VERIFIED",waitingState:"UPDATE_PENDING"})).toMatch(/Waiting/);
  expect(verificationFilterDraftError({tab:"SENT_BACK",attention:"WAITING_OVER_WEEK"})).toMatch(/Waiting/);
 });
 it("rejects identity with education document requirements",()=>{
  expect(verificationFilterDraftError({kind:"IDENTITY",marksheets:"MISSING"})).toMatch(/Identity/);
  expect(verificationFilterDraftError({kind:"IDENTITY",attention:"MISSING_MARKSHEET"})).toMatch(/Identity/);
 });
 it("rejects impossible enrollment and elapsed-age intersections",()=>{
  expect(verificationFilterDraftError({enrollment:"NONE",programId:"022a400d-47d5-4574-8b79-c98cba999000"})).toMatch(/enrollment/);
  expect(verificationFilterDraftError({attention:"WAITING_OVER_WEEK",ageBand:"WITHIN_48_HOURS"})).toMatch(/conflict/);
 });
 it("normalizes optional blank date and academic selectors from the form",()=>{
  expect(verificationFilterDraftError({waitingSince:"",submittedFrom:"",programId:"",sectionId:"",kind:"",q:""})).toBeNull();
 });
 it("permits a valid updated-details waiting request",()=>{
  expect(verificationFilterDraftError({tab:"WAITING",waitingState:"UPDATE_PENDING",attention:"VERIFIED_DETAILS_CHANGED"})).toBeNull();
 });
});
