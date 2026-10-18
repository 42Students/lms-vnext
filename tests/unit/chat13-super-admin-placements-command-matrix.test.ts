import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {superAdminPublishedDriveEditSchema} from "@/modules/placements/super-admin-published-drive-edit-model";
import {companyMergeInputSchema} from "@/modules/placements/admin-company-merge-service";
import {superAdminArchiveCommandSchema,canArchiveDriveWithImpact} from "@/modules/placements/super-admin-drive-archive-model";
const source=(p:string)=>readFileSync(p,"utf8");
const a="550e8400-e29b-41d4-a716-446655440000";
const b="d7226de0-f0ee-470e-b606-ad4bd582c820";
const timestamp="2026-10-18T09:12:34.123Z";
const sample={
 confirmed:true,expectedUpdatedAt:timestamp,reason:"Authorized after compliance review",
 title:"Software Engineer",description:"Approved role description",locations:["Hyderabad","Remote"],
 applicationDeadline:"2026-11-30T18:30:00+05:30",openings:10,
 minimumAnnualCtcInr:1000000,maximumAnnualCtcInr:2000000,
};
describe("Super Admin Placements destructive command and concurrency matrix",()=>{
 it("SA-PUBLISHED-DRIVE-EDIT-02 rejects forged requests, duplicate locations, negative openings and inverted CTC",()=>{
  expect(superAdminPublishedDriveEditSchema.safeParse(sample).success).toBe(true);
  for(const raw of [
   {...sample,confirmed:false},{...sample,reason:"no"},
   {...sample,expectedUpdatedAt:"tomorrow"},
   {...sample,applicationDeadline:"not-a-date"},
   {...sample,locations:["Remote","remote"]},
   {...sample,locations:["A","A"]},
   {...sample,locations:[""]},
   {...sample,openings:-1},{...sample,openings:1.5},{...sample,openings:100001},
   {...sample,minimumAnnualCtcInr:2100000},
   {...sample,maximumAnnualCtcInr:999999},
   {...sample,impersonateCollegeId:a},
  ]) expect(superAdminPublishedDriveEditSchema.safeParse(raw).success,JSON.stringify(raw)).toBe(false);
  const service=source("src/modules/placements/super-admin-published-drive-edit-service.ts");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain('job.status!=="PUBLISHED"');
  expect(service).toContain('eq(placementJobs.collegeId,acting.collegeId)');
  expect(service).toContain('eq(placementSeasons.collegeId,acting.collegeId)');
  expect(service).toContain("isLegacyAssessmentDeadlineAfterApplication");
  expect(service).toContain("date_trunc('milliseconds'");
  expect(service).toContain("recordActivityEventInTransaction(tx,context");
 });
 it("SA-COMPANY-MERGE-02 rejects same-entity, unconfirmed, invalid or extra-tenant merge commands",()=>{
  expect(companyMergeInputSchema.safeParse({keepCompanyId:a,mergeCompanyId:b,confirm:true}).success).toBe(true);
  for(const raw of [
   {keepCompanyId:a,mergeCompanyId:a,confirm:true},
   {keepCompanyId:a,mergeCompanyId:b,confirm:false},
   {keepCompanyId:a,mergeCompanyId:"../../companies",confirm:true},
   {keepCompanyId:a,mergeCompanyId:b,confirm:true,ignoreRelationships:true},
   {keepCompanyId:a,mergeCompanyId:b},
  ])expect(companyMergeInputSchema.safeParse(raw).success).toBe(false);
  const service=source("src/modules/placements/admin-company-merge-service.ts");
  expect(service).toContain("MERGE_SOURCE_SHARED_OUTSIDE_COLLEGE");
  expect(service).toContain("sourceRelationships.some(r => r.collegeId !== acting.collegeId)");
  expect(service).toContain("await assertPersistedPlatformPermission(tx, context,");
  expect(service).toContain('orderBy(placementCompanies.id).for("update")');
  expect(service).toContain('recordActivityEventInTransaction(tx, context');
 });
 it("SA-DRIVE-ARCHIVE-03 blocks mismatched impact snapshots and accepted offers before mutation",()=>{
  const impact={activeApplications:2,affectedLearners:2,openRounds:1,issuedOffers:2,acceptedOffers:0};
  expect(canArchiveDriveWithImpact("PUBLISHED",impact)).toBe(true);
  expect(canArchiveDriveWithImpact("PUBLISHED",{...impact,acceptedOffers:1})).toBe(false);
  expect(superAdminArchiveCommandSchema.safeParse({confirmed:true,expectedUpdatedAt:timestamp,reason:"Drive withdrawn by authorized staff",expectedImpact:impact}).success).toBe(true);
  expect(superAdminArchiveCommandSchema.safeParse({confirmed:true,expectedUpdatedAt:timestamp,reason:"Drive withdrawn by authorized staff",expectedImpact:{...impact,acceptedOffers:-1}}).success).toBe(false);
  const service=source("src/modules/placements/super-admin-drive-archive-service.ts");
  const jobLock=service.indexOf('eq(placementJobs.collegeId,acting.collegeId)',service.indexOf("export async function archiveSuperAdminDrive"));
  const offerLock=service.indexOf('.for("update",{of:placementOffers})',jobLock);
  const impactRead=service.indexOf("const current=await getImpact(tx,jobId)",offerLock);
  const veto=service.indexOf("canArchiveDriveWithImpact(job.status,current)",impactRead);
  const write=service.indexOf("const [saved]=await tx.update(placementJobs)",veto);
  expect(jobLock).toBeGreaterThanOrEqual(0);
  expect(offerLock).toBeGreaterThan(jobLock);
  expect(impactRead).toBeGreaterThan(offerLock);
  expect(veto).toBeGreaterThan(impactRead);
  expect(write).toBeGreaterThan(veto);
 });
});
