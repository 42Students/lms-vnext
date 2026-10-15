import { describe, expect, it } from "vitest";
import { facultyReportIstTimestamp } from "@/modules/courses/faculty-report-time";
describe("Faculty assessment report IST timestamps", () => {
  it("rolls a UTC instant over to the next IST calendar day", () => {
    const result = facultyReportIstTimestamp("2026-10-14T18:30:00Z");
    expect(result).toContain("15 Oct 2026");
    expect(result).toContain("IST");
  });
  it("returns honest absent and invalid states", () => {
    expect(facultyReportIstTimestamp(null)).toBe("—");
    expect(facultyReportIstTimestamp("invalid")).toBe("Date unavailable");
  });
});
