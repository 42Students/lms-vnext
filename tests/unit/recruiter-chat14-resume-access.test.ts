import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(file:string)=>readFileSync(file,"utf8");
describe("REC-home-drives-38 employer-shared private resume grants",()=>{
 it("REC-home-drives-38 checks the owning college, relationship, submitted shortlist, and resume consent",()=>{
  const service=read("src/modules/placements/recruiter-applicant-resume-service.ts");
  expect(service).toContain("getRecruiterPlacementWorkspace(context,jobId)");
  expect(service).toContain('relation?.columns?.includes("resume")');
  expect(service).toContain('eq(placementApplications.status,"SUBMITTED")');
  expect(service).toContain('eq(placementApplicationScreenings.status,"SHORTLISTED")');
  expect(service).toContain('eq(collegeMemberships.collegeId,workspace.college.id)');
  expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(service).toContain('eq(placementCompanyRelationships.companyId,context.recruiter?.companyId??"")');
 });
 it("REC-home-drives-38 only signs CLEAN, unrevoked unexpired RESUME receipts after actual R2 scan attestation",()=>{
  const service=read("src/modules/placements/recruiter-applicant-resume-service.ts");
  expect(service).toContain('eq(profilePrivateDocumentReceipts.purpose,"RESUME")');
  expect(service).toContain('eq(profilePrivateDocumentReceipts.scanStatus,"CLEAN")');
  expect(service).toContain("isNull(profilePrivateDocumentReceipts.revokedAt)");
  expect(service).toContain("isNull(profilePrivateDocumentReceipts.retentionUntil)");
  expect(service).toContain("verifyPrivateDocumentReceipt(evidence)");
  expect(service).toContain("createPrivateReadGrant({");
  expect(service).toContain("expiresInMs:120_000");
  expect(service).toContain("privateGrant.generation!==selected.objectGeneration");
  expect(service).toContain("privateGrant.sha256Hex.toLowerCase()");
  const receipts=read("src/modules/profile-verification/private-receipts.ts");
  expect(receipts).toContain('annotation["malware-scan-status"] === "CLEAN"');
  expect(receipts).toContain('annotation["scan-attested-by"] === "lms-vnext-privileged-scanner"');
 });
 it("REC-home-drives-38 issues signed URLs only via origin-guarded POST with an indistinguishable 404",()=>{
  const route=read("src/app/api/placements/recruiter/jobs/[jobId]/applicants/[applicationId]/resume-grant/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("export async function POST(");
  expect(route).not.toContain("export async function GET(");
  expect(route).toContain('"Cache-Control":"private, no-store"');
  expect(route).toContain('error:"RESUME_NOT_AVAILABLE"');
 });
 it("REC-home-drives-38 avoids server-rendering object keys and requests signed link on click",()=>{
  const page=read("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
  const model=read("src/modules/placements/hr-job-read-service.ts");
  const client=read("src/components/placements/recruiter-resume-download.tsx");
  expect(page).toContain("selectedApplicant.resumeShared?");
  expect(model).toContain('share?.columns?.includes("resume")');
  expect(model).toContain("resumeShared:shareResume");
  expect(client).toContain("useGuardedAction");
  expect(client).toContain('method:"POST"');
  expect(client).toContain("resume-grant");
  expect(client).not.toContain("localStorage");
  expect(page).not.toContain("privateObjectKey");
 });
});