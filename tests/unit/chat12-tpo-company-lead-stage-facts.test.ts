import {describe,expect,it} from "vitest";
import {
 deriveOwnRecruiterLeadStage,resolveRecruiterLeadRelationship,tpoCompanyKey,
} from "@/modules/placements/tpo-company-memory-service";
import {deriveTpoRecruiterLeadStage,RECRUITER_STAGE_LEGACY_LABELS}
 from "@/modules/placements/tpo-recruiter-lead-policy";
import type {DriveFactRow} from "@/modules/placements/company-drive-facts-policy";

const ACTOR="11111111-1111-4111-8111-111111111111";
const R1="22222222-2222-4222-8222-222222222222";
const R2="33333333-3333-4333-8333-333333333333";
const job=(jobId:string,offerStatus:string|null,archivedAt:Date|null=null):DriveFactRow=>({
 jobId,jobStatus:"PUBLISHED",offerStatus,archivedAt,joiningStatus:null,
});
const lead={manualStage:"NEW",recruiterUserId:null,inviteSentAt:null,
 inviteClickedAt:null,companyRelationshipId:R1,companyName:"Acme Pvt Ltd"};

describe("TPO-companies-lead-facts-01 source-bound placement evidence",()=>{
 it("never associates unrelated employer relationships merely because their job has an accepted offer",()=>{
  expect(deriveOwnRecruiterLeadStage(lead,[
   {jobId:"foreign",relationshipId:R2,companyName:"Different"},
  ],[job("foreign","ACCEPTED")])).toBe("NEW");
  expect(deriveOwnRecruiterLeadStage(lead,[
   {jobId:"ours",relationshipId:R1,companyName:"Acme"},
   {jobId:"foreign",relationshipId:R2,companyName:"Different"},
  ],[job("foreign","ACCEPTED"),job("ours",null)])).toBe("DRIVE_PLANNED");
 });
 it("counts an accepted, unarchived drive but refuses draft or archived offer evidence",()=>{
  const jobs=[{jobId:"ours",relationshipId:R1,companyName:"Acme"}];
  expect(deriveOwnRecruiterLeadStage(lead,jobs,[job("ours","ACCEPTED")])).toBe("RECRUITED");
  expect(deriveOwnRecruiterLeadStage(lead,jobs,[job("ours","ACCEPTED",new Date("2099-01-01"))])).toBe("NEW");
  expect(deriveOwnRecruiterLeadStage(lead,jobs,[{...job("ours","ACCEPTED"),jobStatus:"DRAFT"}])).toBe("NEW");
 });
 it("TPO-companies-lead-facts-02 does not borrow offers from ambiguous same-name relationships",()=>{
  const unlinked={...lead,companyRelationshipId:null,companyName:"Acme Pvt Ltd"};
  const names=[
   {jobId:"one",relationshipId:R1,companyName:"Acme Inc"},
   {jobId:"two",relationshipId:R2,companyName:"ACME Private Ltd"},
  ];
  expect(deriveOwnRecruiterLeadStage(unlinked,names,[job("one","ACCEPTED"),job("two",null)])).toBe("NEW");
  expect(deriveOwnRecruiterLeadStage(unlinked,[names[0]],[job("one","ACCEPTED")])).toBe("RECRUITED");
  const owned={...unlinked,recruiterUserId:ACTOR};
  expect(deriveOwnRecruiterLeadStage(owned,[{...names[0],createdByUserId:ACTOR},names[1]],
   [job("one","ACCEPTED")])).toBe("RECRUITED");
 });
 it("resolves an unlinked normalized name only when it uniquely maps to a relationship",()=>{
  const unnamed={companyRelationshipId:null,companyName:"Acme Pvt. Ltd."};
  expect(tpoCompanyKey(unnamed.companyName)).toBe(tpoCompanyKey("Acme"));
  expect(resolveRecruiterLeadRelationship(unnamed,[{relationshipId:R1,companyName:"Acme Inc"}])).toBe(R1);
  expect(resolveRecruiterLeadRelationship(unnamed,[
   {relationshipId:R1,companyName:"Acme Inc"},
   {relationshipId:R2,companyName:"ACME Private Limited"},
  ])).toBeNull();
  expect(resolveRecruiterLeadRelationship({companyRelationshipId:null,companyName:null},[])).toBeNull();
 });
 it("preserves manual Not now precedence and exact legacy labels without persisting a derived stage",()=>{
  expect(deriveTpoRecruiterLeadStage({manualStage:"NOT_NOW",hasRecruitedFact:true,
   hasPlannedDriveFact:true,recruiterUserId:ACTOR,inviteSentAt:new Date("2099-01-01")})).toBe("NOT_NOW");
  expect(RECRUITER_STAGE_LEGACY_LABELS.RECRUITED).toBe("Recruited");
  expect(RECRUITER_STAGE_LEGACY_LABELS.DRIVE_PLANNED).toBe("Drive planned");
  expect(RECRUITER_STAGE_LEGACY_LABELS.NOT_NOW).toBe("Not now");
 });
});
