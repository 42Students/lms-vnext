import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {buildHrApplicantDrawer} from "@/modules/placements/hr-applicant-drawer-model";
import type {SharedApplicant} from "@/modules/placements/hr-job-applicants-model";

const id="66000000-0000-4000-8000-000000000020";
const base:SharedApplicant={
 id,name:"E2E Verified Applicant",role:"Engineer",status:"SUBMITTED",
 screening:"SHORTLISTED",submittedAt:new Date("2026-10-26T06:00:00Z"),email:null,
 rollNumber:null,branch:null,phone:null,githubUrl:null,portfolioUrl:null,
 resumeShared:false,sharedSkills:[],sharedProjects:[],
 ugPercentage:null,tenthPercentage:null,twelfthOrDiplomaPercentage:null,
};

describe("Recruiter Applicants prototype 05 vs old LMS consent and author-only notes",()=>{
 it("reveals no applicant on a wrong or absent ID",()=>{
  expect(buildHrApplicantDrawer([base],"66000000-0000-4000-8000-000000000099")).toBeNull();
  expect(buildHrApplicantDrawer([],id)).toBeNull();
 });
 it("fails closed on withdrawn, no longer shortlisted, or conflicting candidates",()=>{
  expect(buildHrApplicantDrawer([{...base,status:"WITHDRAWN"}],id)).toBeNull();
  expect(buildHrApplicantDrawer([{...base,screening:"REJECTED"}],id)).toBeNull();
  expect(buildHrApplicantDrawer([base,{...base,name:"Conflicting identity"}],id)).toBeNull();
 });
 it("projects only consented fields from a single shortlisted applicant",()=>{
  expect(buildHrApplicantDrawer([base],id)).toMatchObject({
   id,name:"E2E Verified Applicant",email:null,phone:null,resumeShared:false,
   sharedSkills:[],sharedProjects:[],
  });
 });
 it("checks active, verified, expiring relationship for notes read and write",()=>{
  const service=readFileSync("src/modules/placements/applicant-notes-service.ts","utf8");
  expect((service.match(/placementRecruiterCollegeGrants.verificationStatus/g)??[]).length).toBeGreaterThanOrEqual(2);
  expect((service.match(/placementRecruiterCollegeGrants.validUntil/g)??[]).length).toBeGreaterThanOrEqual(2);
  expect((service.match(/'DRIVES' = ANY/g)??[]).length).toBeGreaterThanOrEqual(2);
  expect(service).toContain("resolveRecruiterScope(tx, context");
  expect(service).toContain("requireLiveRecruiter(tx, context, scope)");
 });
});
