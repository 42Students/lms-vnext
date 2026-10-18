import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {
  superAdminHrListQuerySchema,grantSuperAdminHrCollegeInputSchema,
  effectiveSuperAdminHrStatus,assertSuperAdminHrCompanyMatch,
} from "@/modules/placements/super-admin-hr-validation";
import {
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY,SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL,
} from "@/modules/placements/super-admin-placement-nav-model";
const read=(file:string)=>readFileSync(file,"utf8");
const uuid="550e8400-e29b-41d4-a716-446655440000";
describe("Super Admin placements remaining service entrypoint checks",()=>{
 it("SA-HR-VALIDATION-01 rejects stale and arbitrary grant fields while retaining archived/disabled distinctions",()=>{
  expect(effectiveSuperAdminHrStatus("DISABLED","ACTIVE")).toBe("DISABLED");
  expect(effectiveSuperAdminHrStatus("ACTIVE","ARCHIVED")).toBe("ARCHIVED");
  expect(effectiveSuperAdminHrStatus("ACTIVE","ACTIVE")).toBe("ACTIVE");
  expect(assertSuperAdminHrCompanyMatch("a","a")).toBe(true);
  expect(assertSuperAdminHrCompanyMatch("a","b")).toBe(false);
  expect(superAdminHrListQuerySchema.safeParse({page:1,pageSize:25}).success).toBe(true);
  expect(superAdminHrListQuerySchema.safeParse({page:0}).success).toBe(false);
  expect(superAdminHrListQuerySchema.safeParse({q:"x".repeat(121)}).success).toBe(false);
  const valid={companyRelationshipId:uuid,validUntil:"2027-01-01T18:30:00+05:30"};
  expect(grantSuperAdminHrCollegeInputSchema.safeParse(valid).success).toBe(true);
  expect(grantSuperAdminHrCollegeInputSchema.safeParse({...valid,validUntil:"tomorrow"}).success).toBe(false);
  expect(grantSuperAdminHrCollegeInputSchema.safeParse({...valid,collegeId:uuid}).success).toBe(false);
 });
 it("SA-PLACEMENT-NAV-01 retains unique accessible navigation to every existing placement control",()=>{
  const routes=[...SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY,...SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL];
  expect(routes.length).toBeGreaterThanOrEqual(12);
  expect(new Set(routes.map(r=>r.href)).size).toBe(routes.length);
  for(const route of routes){
    expect(route.href.startsWith("/admin/placements/")).toBe(true);
    expect(route.label.trim().length).toBeGreaterThan(2);
  }
 });
 it("SA-COMPANY-COLLEGE-02 locks tenant-linked employer relationships and writes audit after a guarded state transition",()=>{
  const s=read("src/modules/placements/super-admin-college-company-action-service.ts");
  expect(s).toContain('resolveActingCollege(context,"placements.manage")');
  expect(s).toContain('assertPersistedPlatformPermission(tx,context,"placements.manage"');
  expect(s).toContain("eq(placementCompanyRelationships.collegeId,acting.collegeId)");
  expect(s).toContain('.for("update",{of:placementCompanyRelationships})');
  expect(s).toContain('if(row.status===next)return {relationshipId:row.id,status:next,changed:false}');
  expect(s).toContain('eq(placementCompanyRelationships.status,row.status)');
  expect(s).toContain("recordActivityEventInTransaction(tx,context");
 });
 it("SA-COMPANY-EDIT-02 denies selected-college global mutations, stale versions and active duplicates",()=>{
  const s=read("src/modules/placements/super-admin-company-edit-service.ts");
  expect(s).toContain("!isGlobalCompanyScope(context.adminScope)");
  expect(s).toContain('assertPersistedPlatformPermission(tx,context,"admin-scope.select")');
  expect(s).toContain('current.status!=="ACTIVE"');
  expect(s).toContain("current.updatedAt.toISOString()!==input.expectedUpdatedAt");
  expect(s).toContain("lower(");
  expect(s).toContain("date_trunc('milliseconds'");
  expect(s).toContain("recordActivityEventInTransaction(tx,context");
 });
 it("SA-COMPANY-IDENTITIES-03 requires actual current global role and domain/alias uniqueness before writes",()=>{
  const s=read("src/modules/placements/super-admin-company-identities-service.ts");
  expect(s).toContain("context.adminScope?.collegeId||context.adminScope?.organizationId");
  expect((s.match(/assertPersistedPlatformPermission\(tx,context,"admin-scope.select"\)/g)??[]).length).toBe(2);
  expect(s).toContain("eq(placementCompanyDomains.companyId,company.id)");
  expect(s).toContain("Domain belongs to another company.");
  expect(s).toContain("Other name is already registered to another company.");
  expect(s).toContain("canonicalCompanyAlias(company.name)");
  expect(s).toContain("recordActivityEventInTransaction(tx,context");
 });
 it("SA-REPORT-EXTRA-03 uses a selected college/season and reconciles event joins to their owning jobs",()=>{
  const s=read("src/modules/placements/report-extra-service.ts");
  expect(s).toContain("getPlacementReportWorkspace(context, query)");
  expect(s).toContain("eq(placementJobs.collegeId, workspace.collegeId)");
  expect(s).toContain("eq(placementApplications.jobId,placementJobRounds.jobId)");
  expect(s).toContain('eq(placementRoundResults.status,"APPLIED")');
  expect(s).toContain("eq(placementTpoLeadActivities.collegeId, collegeId)");
  expect(s).toContain("eq(placementTpoFollowups.collegeId, collegeId)");
 });
});
