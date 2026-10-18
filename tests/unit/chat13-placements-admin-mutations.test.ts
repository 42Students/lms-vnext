import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
 companyGlobalVerificationSchema, canVerifyGlobalCompany,
} from "@/modules/placements/super-admin-company-verification-model";
import { superAdminCollegeCompanyActionSchema } from "@/modules/placements/super-admin-college-company-action-model";
import {companyMergeInputSchema} from "@/modules/placements/admin-company-merge-model";
import { superAdminPublishedDriveEditSchema } from "@/modules/placements/super-admin-published-drive-edit-model";
import {
 assertSuperAdminHrCompanyMatch, parseSuperAdminHrPageParams,
 effectiveSuperAdminHrStatus, createSuperAdminHrInputSchema,
 updateSuperAdminHrInputSchema,
} from "@/modules/placements/super-admin-hr-validation";

const read=(path:string)=>readFileSync(path,"utf8");
const id="550e8400-e29b-41d4-a716-446655440000";
const anotherId="550e8400-e29b-41d4-a716-446655440001";

describe("chat-13 additional admin mutation and recruiter account security",()=>{
 it("SA-COMPANY-VERIFY-01 restricts global identity verification to unscoped platform administrators",()=>{
  expect(canVerifyGlobalCompany(null)).toBe(true);
  expect(canVerifyGlobalCompany({organizationId:id})).toBe(false);
  expect(canVerifyGlobalCompany({collegeId:id})).toBe(false);
  expect(companyGlobalVerificationSchema.safeParse({companyId:id,verified:true}).success).toBe(true);
  expect(companyGlobalVerificationSchema.safeParse({companyId:id,verified:"true"}).success).toBe(false);
  expect(companyGlobalVerificationSchema.safeParse({companyId:id,verified:true,extra:1}).success).toBe(false);
  const service=read("src/modules/placements/super-admin-company-verification-service.ts");
  expect(service).toContain("canVerifyGlobalCompany(context.adminScope)");
  expect(service).toContain('assertPersistedPlatformPermission(tx,context,"admin-scope.select")');
  expect(service).toContain('.for("update")');
 });

 it("SA-COMPANY-RESTORE-01 rejects revoked platform credentials at write time and never restores relationships",()=>{
  const service=read("src/modules/placements/super-admin-company-restore-service.ts");
  expect(service).toContain("context.adminScope?.collegeId||context.adminScope?.organizationId");
  expect(service).toContain('await assertPersistedPlatformPermission(tx,context,"placements.manage")');
  expect(service).toContain('eq(placementCompanies.status,"ARCHIVED")');
  expect(service).toContain("relationshipsRemainUnchanged:true");
  expect(service).not.toContain(".update(placementCompanyRelationships)");
 });

 it("SA-COMPANY-MERGE-01 rejects stale SA claims and refuses cross-college merge sources",()=>{
  const service=read("src/modules/placements/admin-company-merge-service.ts");
  expect(service).toContain('assertPersistedPlatformPermission(tx, context, "placements.manage"');
  expect(service).toContain("sourceRelationships.some(r => r.collegeId !== acting.collegeId)");
  expect(service).toContain('throw new CompanyMergeError("MERGE_SOURCE_SHARED_OUTSIDE_COLLEGE")');
  expect(service).toContain('.for("update")');
  const model=read("src/modules/placements/admin-company-merge-model.ts");
  expect(model).toContain("value.keepCompanyId!==value.mergeCompanyId");
  expect(companyMergeInputSchema.safeParse({keepCompanyId:id,mergeCompanyId:id,confirm:true}).success).toBe(false);
  expect(companyMergeInputSchema.safeParse({keepCompanyId:id,mergeCompanyId:anotherId,confirm:true}).success).toBe(true);
  expect(service).toContain("recordActivityEventInTransaction(tx, context");
 });

 it("SA-COMPANY-REL-01 requires explicit confirmation for restore/archive of tenant-specific relationship",()=>{
  expect(superAdminCollegeCompanyActionSchema.safeParse({
   relationshipId:id,action:"ARCHIVE",confirmed:true,
  }).success).toBe(true);
  for(const cmd of [
   {relationshipId:id,action:"RESTORE",confirmed:false},
   {relationshipId:id,action:"DELETE",confirmed:true},
   {relationshipId:"bad",action:"ARCHIVE",confirmed:true},
   {relationshipId:id,action:"ARCHIVE",confirmed:true,scopeOverride:anotherId},
  ])expect(superAdminCollegeCompanyActionSchema.safeParse(cmd).success).toBe(false);
 });

 it("SA-PUBLISHED-DRIVE-EDIT-01 refuses tampered versions, arbitrary labels, duplicate locations and reversed CTC",()=>{
  const valid={confirmed:true,expectedUpdatedAt:"2099-01-01T00:00:00Z",
   reason:"Reviewed by platform operations",title:"Graduate Engineer",
   description:"Placement position",locations:["Hyderabad","Bengaluru"],
   applicationDeadline:"2099-04-01T00:00:00Z",openings:2,
   minimumAnnualCtcInr:500000,maximumAnnualCtcInr:800000};
  expect(superAdminPublishedDriveEditSchema.safeParse(valid).success).toBe(true);
  for(const wrong of [
   {...valid,confirmed:false},{...valid,expectedUpdatedAt:"now"},
   {...valid,locations:["Hyderabad","hyderabad"]},
   {...valid,maximumAnnualCtcInr:10000},
   {...valid,title:"a"},{...valid,reason:"short"},{...valid,extra:1},
  ])expect(superAdminPublishedDriveEditSchema.safeParse(wrong).success).toBe(false);
  const service=read("src/modules/placements/super-admin-published-drive-edit-service.ts");
  expect(service).toContain('assertPersistedPlatformPermission(tx,context,"placements.manage"');
  expect(service).toContain('eq(placementJobs.collegeId,acting.collegeId)');
  expect(service).toContain('job.status!=="PUBLISHED"');
  expect(service).toContain("cmd.expectedUpdatedAt");
  expect(service).toContain("isLegacyAssessmentDeadlineAfterApplication(");
 });

 it("SA-HR-ACCOUNTS-01 rejects duplicate filter parameters, rogue keys and pagination abuse",()=>{
  expect(parseSuperAdminHrPageParams({q:"Example",status:"ACTIVE",page:"2",pageSize:"25"})?.page).toBe(2);
  expect(parseSuperAdminHrPageParams({status:["ACTIVE","DISABLED"]})).toBeNull();
  expect(parseSuperAdminHrPageParams({unexpected:"1"})).toBeNull();
  expect(parseSuperAdminHrPageParams({page:"0"})).toBeNull();
  expect(parseSuperAdminHrPageParams({page:"10001"})).toBeNull();
  expect(parseSuperAdminHrPageParams({q:"x".repeat(121)})).toBeNull();
  expect(effectiveSuperAdminHrStatus("DISABLED","ACTIVE")).toBe("DISABLED");
  expect(effectiveSuperAdminHrStatus("ACTIVE","ARCHIVED")).toBe("ARCHIVED");
  expect(assertSuperAdminHrCompanyMatch(id,anotherId)).toBe(false);
  expect(assertSuperAdminHrCompanyMatch(id,id)).toBe(true);
 });

 it("SA-HR-ACCOUNTS-02 requires a company identity choice and prevents empty recruiter mutations",()=>{
  const person={displayName:"Recruiter Example",phoneE164:"+919876543210"};
  expect(createSuperAdminHrInputSchema.safeParse({
   ...person,companyRelationshipId:id,
  }).success).toBe(true);
  expect(createSuperAdminHrInputSchema.safeParse({...person}).success).toBe(false);
  expect(createSuperAdminHrInputSchema.safeParse({
   ...person,companyRelationshipId:id,newCompany:{name:"New Example",collegeId:anotherId},
  }).success).toBe(false);
  expect(updateSuperAdminHrInputSchema.safeParse({}).success).toBe(false);
  expect(updateSuperAdminHrInputSchema.safeParse({status:"ACTIVE"}).success).toBe(true);
  expect(updateSuperAdminHrInputSchema.safeParse({status:"DISABLED"}).success).toBe(false);
 });

 it("SA-BULK-DRIVE-01 bounds destructive multi-action input and maintains partial failure ledger",()=>{
  const service=read("src/modules/placements/super-admin-bulk-drive-service.ts");
  expect(service).toContain("z.array(z.uuid()).min(1).max(25)");
  expect(service).toContain("new Set(ids).size === ids.length");
  expect(service).toContain("confirmed: z.literal(true)");
  expect(service).toContain("resolveActingCollege(context, \"placements.manage\")");
  expect(service).toContain("assertPersistedPlatformPermission(tx, context");
  expect(service).toContain('reason: "Could not update this drive. Refresh and retry."');
  expect(service).toContain("skipped: results.filter(row => row.status === \"SKIPPED\").length");
 });
});
