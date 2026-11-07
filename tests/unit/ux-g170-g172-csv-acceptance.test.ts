import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  assertDepartmentAttendanceExportComplete,
  assertDepartmentAttendanceExportPage,
  departmentAttendanceCsv,
} from "@/modules/attendance/college-department-csv-model";
import { learnerAttendanceHistoryCsv } from "@/modules/attendance/learner-attendance-history-csv-model";
import { collegeAdminHistoryCsv, MAX_ADMIN_HISTORY_EXPORT_ROWS } from "@/modules/colleges/admin-history-export-model";
import { buildSuperAdminReadinessCsv } from "@/modules/colleges/admin-readiness-export-model";
import { buildTenantDirectoryCsv, TENANT_DIRECTORY_CSV_CAP } from "@/modules/colleges/admin-tenant-export-model";
import type { CollegeReadinessEvaluation } from "@/modules/colleges/readiness-model";

describe("UX-G170 attendance outbound UX", () => {
  it("opens in Excel with BOM, complete labeled columns and Unicode-safe department names", () => {
    const payload = "\u093E=HYPERLINK(\"unsafe\")";
    const csv = departmentAttendanceCsv([{
      name: payload, markedSessions: 5, recordedRows: 4, absent: 2,
      late: 1, excused: 1, medical: 0,
    }]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Marked Sessions");
    expect(csv).toContain("Explicit Status Records");
    expect(csv).toContain('"' + "'" + payload.replaceAll('"', '""') + '"');
    expect(csv).toContain("\r\n");
  });

  it("fails closed on totals/page-count drift, missing and duplicate directory IDs", () => {
    const initial = { total: 2, totalPages: 2 };
    expect(() => assertDepartmentAttendanceExportPage(initial, initial)).not.toThrow();
    expect(() => assertDepartmentAttendanceExportPage(initial, {total: 3, totalPages: 2}))
      .toThrow("DEPARTMENT_ATTENDANCE_EXPORT_STALE");
    expect(() => assertDepartmentAttendanceExportPage(initial, {total: 2, totalPages: 1}))
      .toThrow("DEPARTMENT_ATTENDANCE_EXPORT_STALE");
    expect(() => assertDepartmentAttendanceExportComplete([{id: "a"}, {id: "b"}], 2)).not.toThrow();
    expect(() => assertDepartmentAttendanceExportComplete([{id: "a"}], 2))
      .toThrow("DEPARTMENT_ATTENDANCE_EXPORT_STALE");
    expect(() => assertDepartmentAttendanceExportComplete([{id: "a"}, {id: "a"}], 2))
      .toThrow("DEPARTMENT_ATTENDANCE_EXPORT_STALE");
  });

  it("keeps at most 200 visible learner sessions, preserving Excel Unicode and formula protection", () => {
    const record = { title: "\u20DD@IMPORTDATA(1)", courseCode: "CS101",
      startsAt: "2026-11-07T05:00:00Z", status: "NOT_MARKED",
      facultyName: "\u200B=NOW()", location: "\u093E+CMD" };
    const csv = learnerAttendanceHistoryCsv([record]);
    expect(csv.content.startsWith("\uFEFF")).toBe(true);
    expect(csv.content).toContain('"\u0027\u20DD@IMPORTDATA(1)"');
    expect(csv.content).toContain('"\u0027\u200B=NOW()"');
    expect(csv.content).toContain('"\u0027\u093E+CMD"');
    expect(csv.content).toContain('"NOT_MARKED"');
    expect(csv.content).not.toContain("Student email");
    const full = learnerAttendanceHistoryCsv(Array.from({length: 201}, () => record));
    expect(full.truncated).toBe(true);
    expect(full.content.split("\r\n").filter(Boolean)).toHaveLength(201);
  });
});

describe("UX-G172 college administration outbound UX", () => {
  it("keeps history rows bounded, displays IST and protects every combining-mark category", () => {
    const csv = collegeAdminHistoryCsv([
      {occurredAt: new Date("2026-11-07T00:00:00.000Z"), eventType: "\u20DD=CMD", summary: "\u093E+RUN"},
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("When (IST)");
    expect(csv).toContain('"\u0027\u20DD=CMD"');
    expect(csv).toContain('"\u0027\u093E+RUN"');
    expect(csv.endsWith("\r\n")).toBe(true);
    const tooMany = collegeAdminHistoryCsv(Array.from({length: MAX_ADMIN_HISTORY_EXPORT_ROWS + 1},
      () => ({occurredAt: new Date("2026-11-07T00:00:00Z"), eventType: "Edited", summary: "Test"})));
    expect(tooMany).toContain("EXPORT TRUNCATED");
    expect(tooMany).toContain("Only the first 100 visible");
  });

  it("exports readiness evidence for humans without claiming a launch approval", () => {
    const evaluation: CollegeReadinessEvaluation = {
      overall: "NOT_READY", counts: {total: 1, passed: 0, failed: 1, unknown: 0},
      checks: [{id: "COLLEGE_ACTIVE", label: "Active", status: "FAIL",
        evidence: "\u093E=FORMULA", remediation: "\u20DD@COMMAND"}],
    };
    const csv = buildSuperAdminReadinessCsv({name: "  +College", code: "safe"}, evaluation);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"\u0027  +College"');
    expect(csv).toContain('"\u0027\u093E=FORMULA"');
    expect(csv).toContain('"\u0027\u20DD@COMMAND"');
    expect(csv).toContain("Remediation");
    expect(csv).not.toContain("READY TO LAUNCH");
  });

  it("retains tenant directory cap, explicit overflow copy and safe multilingual fields", () => {
    const row = {
      id: "id", name: "\u093E=BAD", code: "safe", status: "ACTIVE", organizationId: "org",
      organizationName: "\u20DD@BAD", organizationStatus: "ACTIVE",
      city: "Vijayawada", state: null, country: "India",
      createdAt: new Date("2026-11-07T00:00:00Z"), updatedAt: new Date("2026-11-07T00:00:00Z"),
    };
    const csv = buildTenantDirectoryCsv([row], false);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"\u0027\u093E=BAD"');
    expect(csv).toContain('"\u0027\u20DD@BAD"');
    expect(csv).toContain("Created (IST)");
    const capped = buildTenantDirectoryCsv(Array.from({length: TENANT_DIRECTORY_CSV_CAP + 1}, () => row), false);
    expect(capped).toContain("EXPORT TRUNCATED");
    expect(capped).toContain("Narrow filters");
    expect(capped.split("\r\n")).toHaveLength(TENANT_DIRECTORY_CSV_CAP + 2);
  });
});

describe("UX-G170/G172 API and fixture boundaries", () => {
  it("keeps the real download routes authenticated, private and non-sniffable", () => {
    const paths = [
      "src/app/api/attendance/admin/departments/export/route.ts",
      "src/app/api/admin/colleges/[collegeId]/readiness/export/route.ts",
      "src/app/api/admin/tenants/export/route.ts",
    ];
    for (const path of paths) {
      const route = readFileSync(path, "utf8");
      expect(route).toMatch(/auth:\s*"user"/);
      expect(route).toContain("private, no-store");
      expect(route).toContain("nosniff");
      expect(route).toContain("text/csv; charset=utf-8");
    }
    expect(readFileSync(paths[0]!, "utf8")).toContain("stepUp: true");
    expect(readFileSync(paths[1]!, "utf8")).toContain("stepUp: true");
    expect(readFileSync(paths[2]!, "utf8")).toContain("requireRecentDeviceAuthentication");
  });

  it("prevents the browser proof fixture from exposing live data or running in production", () => {
    const fixture = readFileSync("src/app/e2e/ux-g170-g172-csv/page.tsx", "utf8");
    expect(fixture).toContain('process.env.NODE_ENV !== "development"');
    expect(fixture).toContain('process.env.UX_EXPORT_FIXTURE !== "1"');
    expect(fixture).toContain("notFound()");
    expect(fixture).not.toContain("getDb()");
    expect(fixture).not.toContain("getCurrentRequestContext");
  });
});
