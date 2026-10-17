import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterDriveApprovalPolicy,trustedRecruiterDomain}
 from "@/modules/placements/recruiter-drive-autoapproval-policy";

const src=(p:string)=>readFileSync(p,"utf8");
const baseline={approvalRequired:true,grantVerified:true,
 recruiterEmail:"hiring@acme.example",companyDomain:"acme.example",
 trustedDomains:[] as string[],relationshipTrusted:false};

describe("REC-home-drives-33 recruiter formal request auto approval",()=>{
 it("REC-home-drives-33 defaults untrusted requests to placement-cell review",()=>{
  expect(recruiterDriveApprovalPolicy(baseline)).toEqual({
   autoApprove:false,reason:"REVIEW_REQUIRED",
  });
 });
 it("REC-home-drives-33 approves verified recruiter when college turns approval off",()=>{
  expect(recruiterDriveApprovalPolicy({...baseline,approvalRequired:false}))
   .toEqual({autoApprove:true,reason:"APPROVAL_OFF"});
 });
 it("REC-home-drives-33 trusted-domain match requires both employer ownership and exact email suffix",()=>{
  expect(trustedRecruiterDomain("hiring@acme.example","acme.example",["ACME.EXAMPLE"])).toBe(true);
  expect(trustedRecruiterDomain("hiring@notacme.example","acme.example",["acme.example"])).toBe(false);
  expect(trustedRecruiterDomain("hiring@evil-acme.example","acme.example",["acme.example"])).toBe(false);
  expect(trustedRecruiterDomain("hiring@acme.example","other.example",["acme.example"])).toBe(false);
  expect(recruiterDriveApprovalPolicy({...baseline,trustedDomains:["acme.example"]}))
   .toEqual({autoApprove:true,reason:"TRUSTED_DOMAIN"});
 });
 it("REC-home-drives-33 no recruiter auto-approval without verified persisted grant",()=>{
  expect(recruiterDriveApprovalPolicy({...baseline,approvalRequired:false,grantVerified:false}).autoApprove).toBe(false);
  expect(recruiterDriveApprovalPolicy({...baseline,trustedDomains:["acme.example"],grantVerified:false}).autoApprove).toBe(false);
 });
 it("REC-home-drives-33 creates DRAFT jobs and preserves TPO-only publication",()=>{
  const job=src("src/modules/placements/recruiter-approved-draft-job-service.ts");
  const tpo=src("src/modules/placements/tpo-drive-request-decision-service.ts");
  const recruiter=src("src/modules/placements/recruiter-drive-request-service.ts");
  expect(job).toContain('status:"DRAFT"');
  expect(job).toContain("placementJobEligibilityPolicies");
  expect(job).toContain("placementJobRoleOptions");
  expect(job).toContain("placementJobRounds");
  expect(job).toContain('throw new RecruiterDraftApprovalError("NO_ACTIVE_SEASON")');
  expect(tpo).toContain("createRecruiterApprovedDraftJob(tx,request,context.user.id)");
  expect(recruiter).toContain("createRecruiterApprovedDraftJob(tx,created,context.user.id)");
  expect(recruiter).toContain("placementTpoTrustedDomains");
  expect(recruiter).toContain("placementTpoCollegeSettings.recruiterDriveNeedsApproval");
  expect(recruiter).toContain('status:"DRAFT",approvedJobId');
  expect(recruiter).toContain('action==="AUTO_APPROVED"');
  expect(recruiter).toContain("onConflictDoNothing()");
 });
});
