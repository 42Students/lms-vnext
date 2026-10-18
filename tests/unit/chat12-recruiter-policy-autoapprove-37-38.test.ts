import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterAutoApprovalReason} from "@/modules/placements/recruiter-request-autoapproval-policy";
import {initialRecruiterRequestStatus} from "@/modules/placements/recruiter-drive-request-model";
import {recruiterDriveApprovalPolicy} from "@/modules/placements/recruiter-drive-autoapproval-policy";
const src=(s:string)=>readFileSync(new URL("../../"+s,import.meta.url),"utf8");
describe("Trust-policy recruiter REQUEST autoapproval",()=>{
 it("TPO-requests-verification-37 prevents pending verification from taking any autoapprove shortcut",()=>{
  expect(recruiterAutoApprovalReason({verificationPending:true,trustedCompany:true,trustedDomain:true,approvalRequired:false})).toBe(null);
  expect(initialRecruiterRequestStatus({verificationPending:true,trusted:true,approvalRequired:false})).toBe("REQUEST");
 });
 it("TPO-requests-verification-37 gives deterministic reasons for trusted company, domain and college opt-out",()=>{
  const base={verificationPending:false,trustedCompany:false,trustedDomain:false,approvalRequired:true};
  expect(recruiterAutoApprovalReason({...base,trustedCompany:true})).toBe("TRUSTED_COMPANY");
  expect(recruiterAutoApprovalReason({...base,trustedDomain:true})).toBe("TRUSTED_DOMAIN");
  expect(recruiterAutoApprovalReason({...base,approvalRequired:false})).toBe("COLLEGE_APPROVAL_DISABLED");
  expect(recruiterAutoApprovalReason(base)).toBe(null);
 });
 it("TPO-requests-verification-37 separately honors persisted company trust without requiring matching email domain",()=>{
  const decision=(overrides:Partial<Parameters<typeof recruiterDriveApprovalPolicy>[0]>={})=>
   recruiterDriveApprovalPolicy({
    approvalRequired:true,grantVerified:true,relationshipTrusted:false,
    recruiterEmail:"recruiter@agency.example",companyDomain:"employer.example",
    trustedDomains:[],...overrides,
   });
  expect(decision({relationshipTrusted:true})).toEqual({
   autoApprove:true,reason:"TRUSTED_COMPANY",
  });
  expect(decision({trustedDomains:["employer.example"]})).toMatchObject({
   autoApprove:false,reason:"REVIEW_REQUIRED",
  });
  expect(decision({relationshipTrusted:true,grantVerified:false})).toMatchObject({
   autoApprove:false,reason:"REVIEW_REQUIRED",
  });
  expect(decision({recruiterEmail:"recruiter@employer.example",trustedDomains:["employer.example"]}))
   .toEqual({autoApprove:true,reason:"TRUSTED_DOMAIN"});
  expect(decision({approvalRequired:false})).toEqual({autoApprove:true,reason:"APPROVAL_OFF"});
 });
 it("TPO-requests-verification-37 saves the real draft in the same transaction as the request, not a decorative status",()=>{
  const code=src("src/modules/placements/recruiter-drive-request-service.ts");
  expect(code).toContain("createRecruiterApprovedDraftJob(tx,created,context.user.id)");
  expect(code).toContain('status:"REQUEST",draft:input.draft');
  expect(code).toContain('status:"DRAFT",approvedJobId');
  expect(code).toContain('grantVerified:scope.grant.verificationStatus==="VERIFIED"');
  expect(code).toContain("recruiterDriveNeedsApproval");
  expect(code).toContain("placementTpoTrustedDomains");
  expect(code).toContain("pg_advisory_xact_lock");
 });
 it("TPO-requests-verification-38 emits distinct new-request and autoapproved TPO signals and recruiter confirmation",()=>{
  const code=src("src/modules/placements/recruiter-drive-request-service.ts");
  expect(code).toContain('eventType:action==="AUTO_APPROVED"?"placements.recruiter.drive.auto_approved"');
  expect(code).toContain('approvedJobId?"AUTO_APPROVED":"NEW"');
  expect(code).toContain("A verified recruiter request met this college");
  expect(code).toContain("Your request is approved as a draft.");
  expect(code).toContain("onConflictDoNothing()");
 });
});
