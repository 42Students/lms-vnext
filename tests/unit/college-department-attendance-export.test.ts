import { describe, expect, it } from "vitest";
import { departmentAttendanceCsv, departmentAttendanceExportQuerySchema } from "@/modules/attendance/college-department-csv-model";

describe("College Admin department attendance CSV export", () => {
  it("escapes CSV quoting and neutralizes formula injection", () => {
    const csv = departmentAttendanceCsv([{
      name: '  =HYPERLINK("https://bad.test", "click")',
      markedSessions: 2, recordedRows: 1, absent: 1, late: 0, excused: 0, medical: 0,
    }]);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("'  =HYPERLINK");
    expect(csv).toContain('""https://bad.test""');
    expect(csv).toContain("\r\n");
  });
  it("rejects caller-picked college IDs or unauthorized query keys", () => {
    expect(departmentAttendanceExportQuerySchema.parse({})).toEqual({q:""});
    expect(departmentAttendanceExportQuerySchema.safeParse({q:"Math",collegeId:"forged"}).success).toBe(false);
    expect(departmentAttendanceExportQuerySchema.safeParse({q:"x".repeat(101)}).success).toBe(false);
  });
});
