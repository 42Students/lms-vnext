import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {SUPER_ADMIN_SCOPED_CSV_CAP,buildSuperAdminScopedCsv,
 parseSuperAdminScopedCsvParams,scopedCsvStatusAllowed} from "@/modules/admin-ui/super-admin-scoped-csv-model";
import {hiringCompanyRollups,superAdminHiringReportQuery}
 from "@/modules/admin-ui/super-admin-hiring-report-model";
const src=(p:string)=>readFileSync(p,"utf8");
const id="11111111-1111-4111-8111-111111111111";
const row={id,title:"\u2066=HYPERLINK(1)",subtitle:"\uFEFF+SUM(1,2)",
 details:["\u202E@MALFORMED"],status:"ACTIVE"};
describe("Chat-6 /admin second-third adversarial scoped directories and exports",()=>{
 it("SA-admin-CSV-01 hides spreadsheet formulas in all record and details fields",()=>{
  const csv=buildSuperAdminScopedCsv([row],false);
  expect(csv).toContain('"\'\u2066=HYPERLINK(1)"');
  expect(csv).toContain('"\'\uFEFF+SUM(1,2)"');
  expect(csv).toContain('"\'\u202E@MALFORMED"');
 });
 it("SA-admin-CSV-02 exports at most 250 rows with explicit truncation/recovery copy",()=>{
  expect(SUPER_ADMIN_SCOPED_CSV_CAP).toBe(250);
  const csv=buildSuperAdminScopedCsv(Array.from({length:260},()=>row),false);
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(csv).toContain("Narrow filters for remaining rows.");
  expect(csv.split("\r\n")).toHaveLength(253);
 });
 it("SA-admin-CSV-03 duplicate/unknown query keys cannot bypass the strict URL filter model",()=>{
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("status=ALL&status=ACTIVE")))
   .toThrow();
  expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams("role=SUPER_ADMIN")))
   .toThrow();
  expect(scopedCsvStatusAllowed("ACTIVE",["ACTIVE","ARCHIVED"])).toBe(true);
  expect(scopedCsvStatusAllowed("DELETED",["ACTIVE","ARCHIVED"])).toBe(false);
 });
 it("SA-admin-analytics-01 rejects backwards date windows, unsafe filters and pagination intrusion",()=>{
  const parsed=superAdminHiringReportQuery.safeParse({
   q:"",appliedFrom:"2026-10-20",appliedTo:"2026-10-18"});
  expect(parsed.success).toBe(false);
  expect(superAdminHiringReportQuery.safeParse({jobId:"not-a-uuid"}).success).toBe(false);
  expect(superAdminHiringReportQuery.safeParse({pageSize:99999}).success).toBe(false);
 });
 it("SA-admin-analytics-02 rollups never merge two different company IDs sharing a display name",()=>{
  const base={companyName:"Same Brand",jobTitle:"Developer",totalApplications:2,applied:1,
    shortlisted:1,assessment:0,interview:0,offered:0,hired:0,rejected:0,withdrawn:0,waitlisted:0};
  const rows=[
   {...base,companyId:"a",jobId:"drive-a"},
   {...base,companyId:"b",jobId:"drive-b",totalApplications:3},
   {...base,companyId:"a",jobId:"drive-c"},
  ];
  const groups=hiringCompanyRollups(rows);
  expect(groups).toHaveLength(2);
  expect(groups.map(g=>g.totalApplications).sort((a,b)=>a-b)).toEqual([3,4]);
 });
 it("SA-admin-tenant-01 selected-college scope validates Super Admin rights on every report",()=>{
  const gate=src("src/modules/admin-ui/super-admin-selected-college.ts");
  expect(gate).toContain("isSuperAdmin(context)");
  expect(gate).toContain("selected?.collegeId");
  expect(gate).toContain("requirePermission(context,permission");
  const retention=src("src/modules/admin-ui/super-admin-placement-retention-service.ts");
  expect(retention).toContain('requireSuperAdminSelectedCollege(context,"placements.read")');
  expect(retention).toContain("eq(placementJobs.collegeId,selected.collegeId)");
  expect(retention).toContain("eq(collegeMemberships.collegeId,selected.collegeId)");
  expect(retention).toContain(".limit(201)");
 });
});
