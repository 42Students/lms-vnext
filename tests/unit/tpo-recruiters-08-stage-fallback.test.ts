import {describe,it,expect} from "vitest";
import {resolveRecruiterLeadRelationship,deriveOwnRecruiterLeadStage,tpoCompanyKey} from "@/modules/placements/tpo-company-memory-service";
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

describe("TPO-recruiters-08 legacy inferred execution stages",()=>{
 const lead={manualStage:"NEW",recruiterUserId:null,inviteSentAt:null,inviteClickedAt:null,
  companyRelationshipId:null,companyName:"Acme Pvt Ltd"};
 const jobs=[
  {jobId:"drive-a",relationshipId:"rel-a",companyName:"Acme Private Limited",createdByUserId:"tpo"},
  {jobId:"drive-b",relationshipId:"rel-b",companyName:"ACME LTD",createdByUserId:"tpo"},
  {jobId:"drive-other",relationshipId:"rel-other",companyName:"Other Ltd",createdByUserId:"tpo"},
 ];
 const facts=[
  {jobId:"drive-a",jobStatus:"PUBLISHED",archivedAt:null,offerStatus:null,joiningStatus:null},
  {jobId:"drive-b",jobStatus:"CLOSED",archivedAt:null,offerStatus:"ACCEPTED",joiningStatus:null},
  {jobId:"drive-other",jobStatus:"CLOSED",archivedAt:null,offerStatus:"ACCEPTED",joiningStatus:null},
 ];
 it("does not borrow hiring evidence from ambiguous company-name matches",()=>{
  expect(deriveOwnRecruiterLeadStage(lead,jobs,facts)).toBe("NEW");
  expect(deriveOwnRecruiterLeadStage(lead,jobs,[facts[0]])).toBe("NEW");
  const linked={...lead,companyRelationshipId:"rel-b"};
  expect(deriveOwnRecruiterLeadStage(linked,jobs,facts)).toBe("RECRUITED");
 });
 it("includes the recruiter's own drive and excludes unrelated employer drives",()=>{
  const personal={...lead,companyName:"Unknown employer",recruiterUserId:"recruiter-one"};
  const owned=[{...jobs[0],createdByUserId:"recruiter-one"},jobs[2]];
  expect(deriveOwnRecruiterLeadStage(personal,owned,[facts[0]])).toBe("DRIVE_PLANNED");
  expect(deriveOwnRecruiterLeadStage(lead,jobs,[facts[2]])).toBe("NEW");
 });
 it("an explicit relationship limits company-name matching, but not owned drives",()=>{
  const linked={...lead,companyRelationshipId:"rel-a"};
  expect(deriveOwnRecruiterLeadStage(linked,jobs,[facts[1]])).toBe("NEW");
  expect(deriveOwnRecruiterLeadStage(linked,jobs,[facts[0]])).toBe("DRIVE_PLANNED");
 });
});
