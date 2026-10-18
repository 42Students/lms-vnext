import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  adminCompaniesQuerySchema, projectAdminCompanies, type AdminCompanyRow,
} from "@/modules/placements/admin-company-directory-model";
import { superAdminCompanyCsv } from "@/modules/placements/admin-company-directory-export-model";
import {
  superAdminArchiveImpactSchema, superAdminArchiveCommandSchema,
  canArchiveDriveWithImpact, sameArchiveImpact,
} from "@/modules/placements/super-admin-drive-archive-model";
import { projectSuperAdminDrivePipeline } from "@/modules/placements/super-admin-drive-pipeline-model";
import { globalCompanyEditSchema, isGlobalCompanyScope } from "@/modules/placements/super-admin-company-edit-model";

const read = (path: string) => readFileSync(path, "utf8");
const uuid = "550e8400-e29b-41d4-a716-446655440000";
const impact = {
  activeApplications: 12, affectedLearners: 9, openRounds: 2,
  issuedOffers: 2, acceptedOffers: 0,
};
const company = (name: string): AdminCompanyRow => ({
  relationshipId: "relationship-A", companyId: "company-A", name,
  collegeId: "college-A", collegeName: "College A", organizationId: "org-A",
  relationshipStatus: "ACTIVE", companyStatus: "ACTIVE",
  trusted: true, website: "https://example.com", primaryDomain: "example.com",
  companyCollegeCount: 1, driveCount: 2, lastActiveAt: new Date("2099-01-01T00:00:00Z"),
});

describe("chat-13 Super Admin Placements service boundary tests", () => {
  it("SA-COMPANY-SCOPE-01 never exposes other tenants' linked-college count inside an acting scope", () => {
    const source = read("src/modules/placements/admin-company-directory-service.ts");
    expect(source).toContain("selected?.collegeId ? sql");
    expect(source).toContain("cr.college_id = ${selected.collegeId}");
    expect(source).toContain("linked_college.organization_id = ${selected.organizationId}");
    expect(source).toContain("requirePermission(context, \"placements.read\"");
    expect(source).toContain("if (query.collegeId && query.collegeId !== selected.collegeId)");
    expect(source).toContain("if (!isSuperAdmin(context))");
  });

  it("SA-COMPANY-CSV-01 prevents formula injection and preserves quotes, CRLF and explicit non-sensitive columns", () => {
    const spreadsheetPayload = "=HYPERLINK(\"https://evil.example\",\"click\")";
    const csv = superAdminCompanyCsv([company(spreadsheetPayload), company(" +SUM(2,2)")]);
    expect(csv).toContain(`"\'=HYPERLINK(""https://evil.example"",""click"")"`);
    expect(csv).toContain("\"' +SUM(2,2)\"");
    expect(csv.startsWith('"Company ID","Company","Primary Domain","College"')).toBe(true);
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv).not.toContain("privateNotes");
    expect(csv).not.toContain("authToken");
  });

  it("SA-COMPANY-CSV-02 guards hidden directional and zero-width spreadsheet formula prefixes",()=>{
    const payloads=["\u200B=1+2","\u202E@SUM(1,1)","\u2060-HYPERLINK()","  +99","\t=1+1"];
    for(const name of payloads){
      const csv=superAdminCompanyCsv([company(name)]);
      expect(csv).toContain('"'+"'" + name.replace(/"/g,'""')+'"');
      expect(csv).not.toContain('"'+name+'"');
    }
    const benign=superAdminCompanyCsv([company("Acme safe company")]);
    expect(benign).toContain('"Acme safe company"');
    expect(benign).not.toContain('"\'Acme safe company"');
  });

  it("SA-COMPANY-QUERY-01 fails closed on unknown sort, rogue college selector, invalid page and long search", () => {
    expect(adminCompaniesQuerySchema.safeParse({status:"ACTIVE",page:1}).success).toBe(true);
    for (const invalid of [
      {sort:"SQL"},
      {q:"x".repeat(101)},
      {page:0},
      {page:10001},
      {collegeId:"../"},
      {unexpected:true},
    ]) expect(adminCompaniesQuerySchema.safeParse(invalid).success).toBe(false);
  });

  it("SA-COMPANY-DIRECTORY-01 differentiates company counts from relationship counts without mutating inputs", () => {
    const original = company("Trusted");
    const second = { ...original, relationshipId: "relationship-B", collegeId: "college-B",
      companyStatus: "ARCHIVED", relationshipStatus: "ARCHIVED", trusted: false, driveCount: 0 };
    const rows = [original, second];
    const counts = projectAdminCompanies(rows);
    expect(counts.distinctCompanies).toBe(1);
    expect(counts.relationships).toBe(2);
    expect(counts.trustedRelationships).toBe(1);
    expect(counts.relationshipsWithDrivesOnPage).toBe(1);
    expect(rows[0].name).toBe("Trusted");
  });

  it("SA-DRIVE-ARCHIVE-01 blocks archive when accepted offers exist and invalid impact payloads", () => {
    expect(superAdminArchiveImpactSchema.safeParse(impact).success).toBe(true);
    expect(canArchiveDriveWithImpact("PUBLISHED",impact)).toBe(true);
    expect(canArchiveDriveWithImpact("ARCHIVED",impact)).toBe(false);
    expect(canArchiveDriveWithImpact("PUBLISHED",{...impact,acceptedOffers:1})).toBe(false);
    expect(superAdminArchiveImpactSchema.safeParse({...impact,issuedOffers:-1}).success).toBe(false);
    expect(superAdminArchiveImpactSchema.safeParse({...impact,extra:1}).success).toBe(false);
  });

  it("SA-DRIVE-ARCHIVE-02 requires a fresh matching preview, verified confirmation and substantive reason", () => {
    expect(sameArchiveImpact(impact,{...impact})).toBe(true);
    expect(sameArchiveImpact(impact,{...impact,openRounds:3})).toBe(false);
    const valid={confirmed:true,expectedUpdatedAt:"2099-03-10T00:00:00.000Z",
      expectedImpact:impact,reason:"Drive abandoned after written approval"};
    expect(superAdminArchiveCommandSchema.safeParse(valid).success).toBe(true);
    for(const invalid of [
      {...valid,confirmed:false},{...valid,expectedUpdatedAt:"broken"},
      {...valid,reason:"ok"},{...valid,unexpected:"value"},
      {...valid,expectedImpact:{...impact,acceptedOffers:1.1}},
    ])expect(superAdminArchiveCommandSchema.safeParse(invalid).success).toBe(false);
    const source=read("src/modules/placements/super-admin-drive-archive-service.ts");
    expect(source).toContain("assertPersistedPlatformPermission(tx,context");
    expect(source).toContain(".for(\"update\")");
    const archiveFunction = source.split("export async function archiveSuperAdminDrive")[1] ?? "";
    const lockedOffers = archiveFunction.indexOf('.for("update",{of:placementOffers})');
    const impactRead = archiveFunction.indexOf("const current=await getImpact(tx,jobId)");
    expect(lockedOffers).toBeGreaterThanOrEqual(0);
    expect(impactRead).toBeGreaterThan(lockedOffers);
    expect(source).toContain("sameArchiveImpact(current,input.expectedImpact)");
    expect(source).toContain("canArchiveDriveWithImpact(job.status,current)");
    expect(source).toContain("recordActivityEventInTransaction(tx,context");
  });

  it("SA-PIPELINE-01 rejects corrupt SQL totals and preserves counts for recognized hiring stages", () => {
    const stage=projectSuperAdminDrivePipeline([
      {stage:"APPLIED",total:3},{stage:"SHORTLISTED",total:2},
      {stage:"REJECTED",total:1},{stage:"WAITLISTED",total:1},
    ]);
    expect(stage.counts.applied).toBe(3);
    expect(stage.counts.shortlisted).toBe(2);
    expect(stage.rejected).toBe(1);
    expect(stage.waitlisted).toBe(1);
    expect(stage.total).toBe(7);
    for(const total of [-1,1.2,Number.NaN,Number.POSITIVE_INFINITY])
      expect(()=>projectSuperAdminDrivePipeline([{stage:"APPLIED",total}])).toThrow();
    const source=read("src/modules/placements/super-admin-drive-pipeline-service.ts");
    expect(source).toContain("getPlacementJob(context, jobId)");
    expect(source).toContain('eq(placementApplications.status, "SUBMITTED")');
  });

  it("SA-COMPANY-EDIT-01 rejects HTTP links, unknown keys and expired context, and requires global scope", () => {
    expect(isGlobalCompanyScope(null)).toBe(true);
    expect(isGlobalCompanyScope({collegeId:uuid})).toBe(false);
    expect(isGlobalCompanyScope({organizationId:uuid})).toBe(false);
    const valid={companyId:uuid,expectedUpdatedAt:"2099-01-01T00:00:00Z",name:"Example Company",
      website:"https://example.com",industry:"Engineering",about:"Example",logoPublicUrl:""};
    expect(globalCompanyEditSchema.safeParse(valid).success).toBe(true);
    expect(globalCompanyEditSchema.safeParse({...valid,website:"http://unsafe.example"}).success).toBe(false);
    expect(globalCompanyEditSchema.safeParse({...valid,unexpected:true}).success).toBe(false);
    expect(globalCompanyEditSchema.safeParse({...valid,name:" "}).success).toBe(false);
  });

  it("SA-REPORT-01 requires an explicit selected college before returning report details", () => {
    // This service deliberately imports "server-only"; check its boundary
    // without loading it in a browser-like Vitest unit runtime.
    const source=read("src/modules/placements/report-service.ts");
    expect(source).toContain("collegeId: z.string().uuid()");
    expect(source).toContain(".strict()");
    expect(source).toContain("context.adminScope?.collegeId !== query.collegeId");
    expect(source).toContain("requirePlacementManageScope(");
    expect(source).toContain("eq(placementJobs.collegeId, college.id)");
    expect(source).toContain("eq(collegeMemberships.collegeId, college.id)");
  });
});
