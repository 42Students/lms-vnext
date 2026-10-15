import {describe,it,expect} from "vitest";
import {verificationAttentionShortcutPatch} from "@/modules/verification/attention-shortcuts";
import {parseCollegeVerificationPageQuery} from "@/modules/verification/page-query";
describe("Verification attention shortcuts against stale filters",()=>{
 it("switches Identity to valid Education for missing evidence triage",()=>{
  const patch=verificationAttentionShortcutPatch("MISSING_MARKSHEET");
  expect(patch).toMatchObject({kind:"EDUCATION",marksheets:"ANY",tab:"WAITING"});
  expect(parseCollegeVerificationPageQuery(patch).success).toBe(true);
 });
 it("clears conflicting age and state filters for updated details",()=>{
  const patch=verificationAttentionShortcutPatch("VERIFIED_DETAILS_CHANGED");
  expect(patch).toMatchObject({waitingState:"ALL",ageBand:"ANY"});
  expect(parseCollegeVerificationPageQuery(patch).success).toBe(true);
 });
});
