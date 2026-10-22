import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  renderSuperAdminLectureHallsCsv,
} from "@/modules/academics/college-lecture-halls-export-model";
import {
  parseSuperAdminLectureHallFilters,
  superAdminLectureHallHref,
  superAdminLectureHallPages,
} from "@/modules/academics/super-admin-lecture-hall-directory-model";

describe("SA-academics-people-26 Super Admin hall availability", () => {
  it("retains College Admin links and routes Super Admin to its own read-only page", () => {
    const manager = readFileSync("src/components/admin/lecture-hall-manager.tsx", "utf8");
    const page = readFileSync("src/app/(authenticated)/admin/lecture-halls/page.tsx", "utf8");
    const detail = readFileSync("src/app/(authenticated)/admin/lecture-halls/[hallId]/page.tsx", "utf8");
    const service = readFileSync("src/modules/academics/college-hall-availability-service.ts", "utf8");
    expect(manager).toContain('availabilityBase = "/college/lecture-halls"');
    expect(manager).toContain("${availabilityBase}/${hall.id}");
    expect(page).toContain('availabilityBase="/admin/lecture-halls"');
    expect(detail).toContain("getCollegeHallAvailability");
    expect(detail).not.toContain("CollegeHallBookingAction");
    expect(service).toContain('resolveActingCollege(context, "academics.manage")');
    expect(service).toContain("eq(lectureHalls.collegeId, actingCollege.collegeId)");
    expect(service).toContain("eq(academicPeriods.collegeId, actingCollege.collegeId)");
  });
});

describe("SA-academics-people-27 lecture hall directory", () => {
  it("handles strict filters, page sizes and search-preserving pagination", () => {
    const params = parseSuperAdminLectureHallFilters({ q: "  Lab ", page: "2", pageSize: "50" });
    expect(params).toMatchObject({ q: "Lab", page: 2, pageSize: 50 });
    expect(parseSuperAdminLectureHallFilters({ pageSize: "13" })).toBeNull();
    expect(parseSuperAdminLectureHallFilters({ page: ["1", "2"] })).toBeNull();
    expect(parseSuperAdminLectureHallFilters({ collegeId: "other" })).toBeNull();
    const page = readFileSync("src/app/(authenticated)/admin/lecture-halls/page.tsx", "utf8");
    expect(page).toContain('<form action="/admin/lecture-halls" method="get" aria-label="Filter lecture halls"');
    expect(page).toContain("Object.entries(query)");
    expect(page).toContain("Export all matching CSV");
    expect(superAdminLectureHallHref(params!)).toBe("/admin/lecture-halls?q=Lab&page=2&pageSize=50");
    expect(superAdminLectureHallPages(101, 50)).toBe(3);
  });
  it("exports the six legacy fields without unsafe spreadsheet formulas", () => {
    const csv = renderSuperAdminLectureHallsCsv([{
      id: "id-1", name: "=hall", capacity: 45, roomType: "LAB",
      departmentId: "dept-1", description: "+unsafe",
    }], false);
    expect(csv).toContain('"id","name","capacity","roomType","departmentId","description"');
    expect(csv).toContain("'=hall");
    expect(csv).toContain("'+unsafe");
    const service = readFileSync("src/modules/academics/college-lecture-halls-export-service.ts", "utf8");
    const route = readFileSync("src/app/api/academics/admin-lecture-halls-export/route.ts", "utf8");
    expect(service).toContain('resolveActingCollege(context,"academics.manage")');
    expect(route).toContain("isSuperAdmin(context)");
    expect(route).toContain('"superadmin"');
  });
});
