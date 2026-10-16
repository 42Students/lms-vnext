import {describe,it,expect} from "vitest";
import {resolveRecruiterLeadRelationship,tpoCompanyKey} from "@/modules/placements/tpo-company-memory-service";
describe("TPO-recruiters-08 relationship-safe manual lead stage fallback",()=>{
 const jobs=[
  {relationshipId:"acme-rel",companyName:"Acme Private Limited"},
  {relationshipId:"beta-rel",companyName:"Beta Systems"},
 ];
 it("uses unique normalized employer match for otherwise unlinked leads",()=>{
  expect(tpoCompanyKey("Acme Pvt Ltd")).toBe("acme");
  expect(resolveRecruiterLeadRelationship({companyRelationshipId:null,companyName:"Acme Pvt Ltd"},jobs))
   .toBe("acme-rel");
 });
 it("honors explicit relationship over guessed name",()=>{
  expect(resolveRecruiterLeadRelationship({companyRelationshipId:"beta-rel",companyName:"Acme"},jobs))
   .toBe("beta-rel");
 });
 it("rejects ambiguous employer and missing names",()=>{
  const ambiguous=[...jobs,{relationshipId:"other",companyName:"ACME LTD"}];
  expect(resolveRecruiterLeadRelationship({companyRelationshipId:null,companyName:"Acme"},ambiguous)).toBeNull();
  expect(resolveRecruiterLeadRelationship({companyRelationshipId:null,companyName:null},jobs)).toBeNull();
 });
});
