import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterRequestLegacyLabel} from "@/modules/placements/recruiter-drive-request-model";
import {recruiterDriveApprovalPolicy,trustedRecruiterDomain}
 from "@/modules/placements/recruiter-drive-autoapproval-policy";

const src=(p:string)=>readFileSync(p,"utf8");
const baseline={approvalRequired:true,grantVerified:true,
 recruiterEmail:"hiring@acme.example",companyDomain:"acme.example",
 trustedDomains:[] as string[],relationshipTrusted:false};

describe("REC-home-drives-33 recruiter formal request auto approval",()=>{
 it("REC-home-drives-33 inserts only REQUEST before the approved job exists",()=>{
  const code=src("src/modules/placements/recruiter-drive-request-service.ts");
  expect(code).toContain('sourceJobId:input.sourceJobId??null,status:"REQUEST",draft:input.draft');
  expect(code).toContain('let approvedJobId:string|null=null');
  expect(code).toContain('approvedJobId=await createRecruiterApprovedDraftJob(tx,created,context.user.id)');
  expect(code).toContain('status:"DRAFT",approvedJobId,updatedAt:new Date()');
  expect(code).not.toContain('status:approvedJobId?"DRAFT":"REQUEST"');
 });
 it("REC-home-drives-33 records the exact persisted approval reason and linked job",()=>{
  const code=src("src/modules/placements/recruiter-drive-request-service.ts");
  expect(code).toContain('autoReason:autoApproval?.reason??null');
  expect(code).toContain('approvedJobId:autoApproval?.jobId??null');
  expect(code).toContain('approvedJobId?{reason:policy.reason,jobId:approvedJobId}:undefined');
 });
 it("REC-home-drives-33 safeguards request replay against duplicate job creation",()=>{
  const code=src("src/modules/placements/recruiter-drive-request-service.ts");
  expect(code).toContain('pg_advisory_xact_lock(hashtext(');
  expect(code.indexOf('if(existing){')).toBeLessThan(code.indexOf('if(policy.autoApprove){'));
  expect(code).toContain('return {request:existing,replayed:true}');
 });
 it("REC-home-drives-33 preserves TPO manual review if trusted draft is ambiguous",()=>{
  const code=src("src/modules/placements/recruiter-drive-request-service.ts");
  expect(code).toContain('if(!(error instanceof RecruiterDraftApprovalError))throw error');
  expect(code).toContain('created.id,input.draft.title,approvedJobId?"AUTO_APPROVED":"NEW"');
  expect(code).toContain('status:"REQUEST",draft:input.draft');
 });
 it("REC-home-drives-33 handles legacy mixed internship/fulltime before job SQL constraints",()=>{
  const writer=src("src/modules/placements/recruiter-approved-draft-job-service.ts");
  const tpo=src("src/modules/placements/tpo-drive-request-decision-service.ts");
  expect(writer).toContain('draft.employmentType==="INTERNSHIP_FULL_TIME"');
  expect(writer).toContain('throw new RecruiterDraftApprovalError("UNSUPPORTED_EMPLOYMENT_TYPE")');
  expect(tpo).toContain('"UNSUPPORTED_EMPLOYMENT_TYPE"');
  expect(writer.indexOf('throw new RecruiterDraftApprovalError("UNSUPPORTED_EMPLOYMENT_TYPE")'))
   .toBeLessThan(writer.indexOf('const [job]=await tx.insert(placementJobs)'));
 });
 it("REC-home-drives-33 never opens an autoapproved job to candidates",()=>{
  const code=src("src/modules/placements/recruiter-approved-draft-job-service.ts");
  expect(code).toContain('status:"DRAFT"');
  expect(code).not.toContain('status:"PUBLISHED"');
  expect(code).toContain('if(seasons.length!==1)');
 });

 it("REC-home-drives-33 tells recruiters an autoapproved draft awaits publication, not review",()=>{
  expect(recruiterRequestLegacyLabel("DRAFT")).toBe("Approved — awaiting publication");
  expect(recruiterRequestLegacyLabel("REQUEST")).toBe("Sent for review");
  expect(recruiterRequestLegacyLabel("REJECTED")).toBe("Cancelled");
 });

 it("REC-home-drives-33 defaults untrusted requests to placement-cell review",()=>{
  expect(recruiterDriveApprovalPolicy(baseline)).toEqual({
   autoApprove:false,reason:"REVIEW_REQUIRED",
  });
 });
 it("REC-home-drives-33 approves verified recruiter when college turns approval off",()=>{
  expect(recruiterDriveApprovalPolicy({...baseline,approvalRequired:false}))
   .toEqual({autoApprove:true,reason:"APPROVAL_OFF"});
 });
 it("REC-home-drives-33 refuses malformed or whitespace-padded email identities",()=>{
  expect(trustedRecruiterDomain("hi @acme.example","acme.example",["acme.example"])).toBe(false);
  expect(trustedRecruiterDomain("hiring@acme.example evil","acme.example",["acme.example"])).toBe(false);
  expect(trustedRecruiterDomain("hiring@@acme.example","acme.example",["acme.example"])).toBe(false);
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
