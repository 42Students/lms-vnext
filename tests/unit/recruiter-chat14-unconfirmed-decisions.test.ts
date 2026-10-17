import { describe,expect,it } from "vitest";
import { readFileSync } from "node:fs";
import { can } from "@/modules/permissions/policy";
import { initialRecruiterRequestStatus } from "@/modules/placements/recruiter-drive-request-model";
import { buildHrApplicantCsv,HR_APPLICANT_EXPORT_CAP } from "@/modules/placements/hr-applicant-export-model";

const source=(path:string)=>readFileSync(path,"utf8");

describe("chat-14 UNCONFIRMED recruiter owner decisions",()=>{
 it("REC-home-drives-19 requires an active recruiter grant for all drive-read capabilities",()=>{
  const policy=source("src/modules/permissions/policy.ts");
  expect(policy).toContain('permission === "placements.recruiter.read"');
  expect(policy).toContain('return hasRecruiterGrant(context, resource)');
  expect(can(null,"placements.recruiter.read",{collegeId:"x",placementCompanyRelationshipId:"y"})).toBe(false);
 });
 it("REC-home-drives-R02 keeps placement-cell verification authoritative by default",()=>{
  const service=source("src/modules/placements/result-service.ts");
  expect(service).toContain("STAGED");
  expect(source("src/components/hr/recruiter-result-controls.tsx")).toContain("Result staged");
  expect(initialRecruiterRequestStatus({trusted:false,approvalRequired:true,verificationPending:false})).toBe("REQUEST");
 });
 it("REC-home-drives-44 bounds and CSV-quotes recruiter exports rather than exposing all students",()=>{
  expect(HR_APPLICANT_EXPORT_CAP).toBe(200);
  const result=buildHrApplicantCsv([{id:"id",name:"=HYPERLINK(1)",role:"Role",status:"SUBMITTED",
   screening:"SHORTLISTED",submittedAt:new Date("2099-03-01T00:00:00Z"),email:null}],1);
  expect(result.csv).toContain("'=HYPERLINK(1)");
  expect(result.exported).toBe(1);
 });
 it("REC-home-drives-09 treats pending invitations as unverified until an OTP-secured join",()=>{
  const join=source("src/modules/placements/public-join/join-service.ts");
  expect(join).toContain("matchesPublicJoinCode");
  expect(join).toContain('verificationStatus: "VERIFIED"');
  expect(join).toContain("if (grant && grant.status === \"REVOKED\")");
 });
 it("REC-calendar-messages-profile-46 reuses verified existing-account join and never silently auto-accepts",()=>{
  const join=source("src/modules/placements/public-join/join-service.ts");
  expect(join).toContain('outcome = "ALREADY_JOINED"');
  expect(join).toContain("const [user] = await tx.select().from(users)");
  expect(join).toContain("if(challenge.expiresAt.getTime()<=now.getTime())");
  expect(join).toContain("recruiterGrantEffectiveAt(grant, now, \"DRIVES\")");
 });
});
