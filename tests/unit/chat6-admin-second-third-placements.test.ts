import { describe, expect, it } from "vitest";
import {
  COMPANY_HIRING_COLUMNS,
  SUPER_ADMIN_HIRING_EXPORT_CAP,
  hiringCompanyRollups,
  superAdminHiringReportQuery,
  type SuperAdminHiringRow,
} from "@/modules/admin-ui/super-admin-hiring-report-model";
import {
  adminDriveDirectoryHref,
  adminDriveDirectoryQuerySchema,
  adminDriveIstDate,
  adminDriveStatus,
  filterAdminDriveDirectory,
} from "@/modules/placements/admin-drive-directory-model";
import {
  DRIVE_APPLICATION_EXPORT_CAP,
  driveApplicationsHref,
  driveApplicationsParams,
  driveApplicationsQuerySchema,
} from "@/modules/placements/college-drive-applications-model";
import {
  readAdminQuery,
  scopedSearchLike,
  superAdminReadHref,
  superAdminReadPages,
} from "@/modules/admin-ui/super-admin-read-directory-model";

const college = "11111111-1111-4111-8111-111111111111";
const companyA = "company-a";
const companyB = "company-b";
const base = {
  totalApplications: 2, applied: 1, shortlisted: 1, assessment: 0,
  interview: 0, offered: 0, hired: 0, rejected: 0, withdrawn: 0, waitlisted: 0,
};
function hiringRow(companyId: string, companyName: string, jobId: string): SuperAdminHiringRow {
  return { ...base, companyId, companyName, jobId, jobTitle: "Campus drive" };
}

describe("/admin placements second-third: scoping, filtering, counts, links", () => {
  it("CHAT6-ADMIN-PLACEMENTS-01 rejects malformed report dates and inverted IST reporting ranges", () => {
    expect(superAdminHiringReportQuery.safeParse({
      appliedFrom: "2026-10-01", appliedTo: "2026-10-31", q: "  Campus  ",
    }).data).toMatchObject({ q: "Campus", appliedFrom: "2026-10-01" });
    for (const bad of [
      { appliedFrom: "2026-10-31", appliedTo: "2026-10-01" },
      { appliedFrom: "2026-02-30" }, { appliedTo: "not-a-date" },
      { jobId: "another-college" }, { collegeId: college },
      { q: "x".repeat(101) }, { appliedFrom: ["2026-10-01", "2026-10-02"] },
    ]) expect(superAdminHiringReportQuery.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    expect(SUPER_ADMIN_HIRING_EXPORT_CAP).toBe(5000);
    expect(COMPANY_HIRING_COLUMNS).toContain("Withdrawn");
  });

  it("CHAT6-ADMIN-PLACEMENTS-02 computes multi-drive totals once per company, not per row", () => {
    const rows = [
      hiringRow(companyB, "Zen Industries", "drive-b1"),
      hiringRow(companyA, "Alpha Industries", "drive-a1"),
      { ...hiringRow(companyA, "Alpha Industries", "drive-a2"), offered: 1, hired: 1 },
    ];
    const rollups = hiringCompanyRollups(rows);
    expect(rollups.map(r => r.companyName)).toEqual(["Alpha Industries", "Zen Industries"]);
    expect(rollups[0]).toMatchObject({ totalApplications: 4, applied: 2, offered: 1, hired: 1 });
    expect(rollups[1]).toMatchObject({ totalApplications: 2, applied: 1, hired: 0 });
  });

  it("CHAT6-ADMIN-DRIVES-01 maps only published drives to active and caps paginated results", () => {
    const now = new Date("2026-10-19T08:00:00.000Z");
    const make = (id: string, status: string, name: string) => ({
      job: { id, title: name, status, applicationDeadline: new Date("2099-01-01T00:00:00.000Z") },
      company: { name: "College recruitment" },
    });
    const rows = [
      make("draft", "DRAFT", "Draft hiring"), make("published", "PUBLISHED", "Open hiring"),
      make("closed", "CLOSED", "Closed hiring"), make("cancelled", "CANCELLED", "Cancelled hiring"),
    ];
    expect(filterAdminDriveDirectory(rows, adminDriveDirectoryQuerySchema.parse({status:"ACTIVE"})).items.map(v=>v.job.id)).toEqual(["published"]);
    expect(filterAdminDriveDirectory(rows, adminDriveDirectoryQuerySchema.parse({status:"CLOSED"})).items.map(v=>v.job.id)).toEqual(["closed","cancelled"]);
    expect(filterAdminDriveDirectory(rows, adminDriveDirectoryQuerySchema.parse({status:"ALL",q:"oPeN"})).items.map(v=>v.job.id)).toEqual(["published"]);
    const view = filterAdminDriveDirectory(rows, adminDriveDirectoryQuerySchema.parse({page:999,pageSize:10}));
    expect(view).toMatchObject({ page: 1, totalPages: 1, total: 4 });
    expect(adminDriveStatus({status:"PUBLISHED",applicationDeadline:new Date("2026-01-01T00:00:00.000Z")},now)).toBe("Open · Expired");
    expect(adminDriveStatus({status:"PUBLISHED",applicationDeadline:null},now)).toBe("Open");
    expect(adminDriveIstDate(new Date(Number.NaN))).toBe("—");
    expect(adminDriveIstDate(null)).toBe("—");
  });

  it("CHAT6-ADMIN-DRIVES-02 rejects hostile page counts and retains encoded URLs rather than nested parameters", () => {
    for (const bad of [
      { page: 0 }, { pageSize: 200 }, { pageSize: 3 }, { status: "PUBLISHED" },
      { q: "x".repeat(101) }, { collegeId: college },
      { page: ["1", "2"] },
    ]) expect(adminDriveDirectoryQuerySchema.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    const query = adminDriveDirectoryQuerySchema.parse({q:"&page=999",status:"ACTIVE",page:2,pageSize:50});
    const url = new URL(adminDriveDirectoryHref(query),"https://platform.example.edu");
    expect(url.pathname).toBe("/admin/placements/drives");
    expect(url.searchParams.get("q")).toBe("&page=999");
    expect(url.searchParams.getAll("page")).toEqual(["2"]);
    expect(url.searchParams.get("status")).toBe("ACTIVE");
  });

  it("CHAT6-ADMIN-APPLICATIONS-01 rejects duplicate query selectors and forged tenant IDs", () => {
    const good = driveApplicationsParams({q:"campus",stage:"INTERVIEW",page:"3"});
    expect(good).toMatchObject({q:"campus",stage:"INTERVIEW",page:3});
    for (const bad of [
      { q: ["first","second"] },{ stage: "SUPER_ADMIN" }, { page: "0" },
      { departmentId: "invalid" }, { programId: "another-college" },
      { page:"1001" },
    ]) expect(driveApplicationsParams(bad)).toBeNull();
    expect(DRIVE_APPLICATION_EXPORT_CAP).toBe(1000);
    expect(driveApplicationsQuerySchema.safeParse({ status:"SUBMITTED",source:"INTERNAL" }).success).toBe(true);
  });

  it("CHAT6-ADMIN-APPLICATIONS-02 serializes candidate stage and read filters but omits paging from export", () => {
    const query = driveApplicationsQuerySchema.parse({q:"A&B",stage:"INTERVIEW",source:"EXTERNAL",page:3});
    const view = new URL(driveApplicationsHref(college,query),"https://platform.example.edu");
    expect(view.searchParams.get("q")).toBe("A&B");
    expect(view.searchParams.get("stage")).toBe("INTERVIEW");
    expect(view.searchParams.get("source")).toBe("EXTERNAL");
    expect(view.searchParams.get("page")).toBe("3");
    const exportLink = new URL(driveApplicationsHref(college,query,true),"https://platform.example.edu");
    expect(exportLink.pathname.endsWith("/export")).toBe(true);
    expect(exportLink.searchParams.get("page")).toBeNull();
  });

  it("CHAT6-ADMIN-SCOPED-01 rejects ambiguous or forged cross-tenant directory selectors", () => {
    expect(readAdminQuery({page:"2",pageSize:"50",status:"SCHEDULED"}).success).toBe(true);
    for (const bad of [
      {page:["1","2"]},{page:"0"},{page:"1e3"},{page:"0x10"},{pageSize:"1"},
      {page:"1001"},{status:"ROOT"},{jobId:"another-college"},{collegeId:college},
      {organizationId:college},
    ]) expect(readAdminQuery(bad).success,JSON.stringify(bad)).toBe(false);
    expect(scopedSearchLike("%_\\")).toBe("%\\%\\_\\\\%");
    expect(superAdminReadPages(0)).toBe(1);
    expect(superAdminReadPages(100,0)).toBe(4);
    expect(superAdminReadPages(Number.NaN,10)).toBe(1);
    expect(superAdminReadPages(Infinity,10)).toBe(1);
  });

  it("CHAT6-ADMIN-SCOPED-02 preserves filter context through cursor-independent navigation", () => {
    const parsed=readAdminQuery({q:"&status=ACTIVE",status:"PENDING",pipelineStage:"INTERVIEW",page:"3"});
    if(!parsed.success)throw new Error("Expected valid admin query");
    const href=new URL(superAdminReadHref("/admin/placements/interviews",parsed.data),"https://platform.example.edu");
    expect(href.pathname).toBe("/admin/placements/interviews");
    expect(href.searchParams.get("q")).toBe("&status=ACTIVE");
    expect(href.searchParams.getAll("status")).toEqual(["PENDING"]);
    expect(href.searchParams.get("pipelineStage")).toBe("INTERVIEW");
    expect(href.searchParams.get("page")).toBe("3");
  });
});
