import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {evaluateTpoDriveLifecycle,hasSecureEmployerPortalUrl,type TpoDriveReadinessFacts}
  from "@/modules/placements/tpo-drive-lifecycle-model";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const ready: TpoDriveReadinessFacts={
 jobStatus:"DRAFT",seasonActive:true,companyActive:true,roleCount:1,
 evaluativeRoundCount:1,policyPersisted:true,deadlinePresent:true,
 deadlineValid:true,payPresent:true,externalUrlPresent:true,
 appliedResultCount:0,acceptedOfferCount:0,
};
describe("TPO direct and lifecycle publish readiness",()=>{
 it("TPO-drives-42 blocks publish when evaluative rounds or persisted eligibility rules are absent",()=>{
  expect(evaluateTpoDriveLifecycle("PUBLISH",{...ready,evaluativeRoundCount:0}).blockers)
    .toContain("NO_EVALUATIVE_ROUND");
  expect(evaluateTpoDriveLifecycle("PUBLISH",{...ready,policyPersisted:false}).blockers)
    .toContain("ELIGIBILITY_POLICY_NOT_PERSISTED");
  expect(evaluateTpoDriveLifecycle("PUBLISH",{...ready,deadlinePresent:false}).blockers)
    .toContain("APPLICATION_DEADLINE_MISSING");
  expect(evaluateTpoDriveLifecycle("PUBLISH",{...ready,payPresent:false}).blockers)
    .toContain("PACKAGE_MISSING");
  expect(evaluateTpoDriveLifecycle("PUBLISH",ready).allowed).toBe(true);
 });
 it("TPO-drives-42 requires HTTPS and rejects embedded login credentials for external portals",()=>{
  expect(hasSecureEmployerPortalUrl("INTERNAL",null)).toBe(true);
  expect(hasSecureEmployerPortalUrl("HYBRID","https://company.example/jobs")).toBe(true);
  for(const url of [null,"","http://company.example/jobs","ftp://company.example/jobs",
    "https://person:secret@company.example/jobs","not a url"])
   expect(hasSecureEmployerPortalUrl("EXTERNAL_ONLY",url)).toBe(false);
 });
 it("TPO-drives-42 direct and lifecycle endpoints use identical external portal validation",()=>{
  const job=source("src/modules/placements/job-service.ts");
  const lifecycle=source("src/modules/placements/tpo-drive-lifecycle-service.ts");
  expect(job).toContain('hasSecureEmployerPortalUrl(current.applicationMode,current.externalApplicationUrl)');
  expect(lifecycle).toContain('hasSecureEmployerPortalUrl(job.applicationMode,job.externalApplicationUrl)');
 });
 it("TPO-drives-42 direct publish checks a locked draft and a real policy/round before status update",()=>{
  const job=source("src/modules/placements/job-service.ts");
  const code=job.slice(job.indexOf("export async function publishPlacementJob("),
    job.indexOf("type PlacementTx"));
  expect(code).toContain('eq(placementJobs.collegeId, current.collegeId)');
  expect(code).toContain('.for("update").limit(1)');
  expect(code).toContain('ne(placementJobRounds.kind, "TALK")');
  expect(code).toContain('ne(placementJobRounds.status, "CANCELLED")');
  expect(code).toContain('eq(placementJobEligibilityPolicies.jobId, jobId)');
  expect(code.indexOf("if (!rounds.length || !policy.length)"))
   .toBeLessThan(code.indexOf(".update(placementJobs)"));
 });
});
