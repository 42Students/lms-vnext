import {describe,it,expect} from "vitest";
import {tpoGeneralRequestInputSchema,tpoGeneralRequestTarget} from "@/modules/placements/tpo-general-request-model";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Five distinct learner requests",()=>{
 it("TPO-requests-verification-01 validates each payload discriminator and ignores unauthenticated HTTP proof",()=>{
  const samples=[
   {kind:"OFF_CAMPUS_OFFER",companyName:"Sample Corp",ctcLpa:"7.50",proofUrl:"https://example.org/proof"},
   {kind:"REGISTRATION_CHANGE",cohortId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",choice:"HIGHER_STUDIES",consentConfirmed:false},
   {kind:"ABSENCE_DISPUTE",roundId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",applicationId:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",proofUrl:"https://example.org/proof"},
   {kind:"CORRECTION_WITH_PROOF",section:"EDUCATION",field:"cgpa",proposedValue:"8.6",proofUrl:"https://example.org/proof"},
   {kind:"PLACEMENT_AFTER_PLACEMENT",requestedJobId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",justification:"I want to continue."},
  ];
  for(const sample of samples){
   expect(tpoGeneralRequestInputSchema.safeParse({...sample,reason:"Please review my request"}).success).toBe(true);
  }
  expect(tpoGeneralRequestInputSchema.safeParse({...samples[0],reason:"Please review",proofUrl:"http://evil.test"}).success).toBe(false);
  expect(tpoGeneralRequestTarget(tpoGeneralRequestInputSchema.parse({...samples[1],reason:"Please review"}))).toBe(samples[1].cohortId);
 });
 it("TPO-requests-verification-01 records a proposed tenant-scoped, unique pending request table with immutable events",()=>{
  const sql=src("drizzle/0134_lanes_round_2.sql");
  expect(sql).toContain("unique index");
  expect(sql).toContain("foreign key(membership_id,college_id)");
  expect(sql).toContain("placement_learner_general_request_events");
  expect(sql).toContain("placement_general_request_events_parent_idx");
 });
});
