import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { facultyAttendanceConfirmation } from "@/modules/attendance/faculty-correction-audit-model";
const source = readFileSync(join(process.cwd(), "src/components/attendance/faculty-attendance-workspace.tsx"), "utf8");

describe("chat-11 faculty attendance confirmation and mobile marking", () => {
  it("FAC-attendance-grades-04 uses styled Submit Attendance confirmation and exact count message", () => {
    expect(facultyAttendanceConfirmation(false, [], ["a","b"], 5))
      .toBe("Submit Attendance — Mark 2 student(s) absent and 3 student(s) present?");
    expect(source).toContain('title="Submit Attendance"');
    expect(source).toContain('confirmLabel="Confirm"');
    expect(source).toContain('cancelLabel="Cancel"');
    expect(source).toContain('confirmVariant="primary"');
    expect(source).toContain("requestAttendanceConfirmation");
    expect(source).not.toContain("window.confirm(attendanceConfirmation)");
    expect(source).toContain("Attendance marked successfully.");
  });
  it("FAC-attendance-grades-20 keeps a narrow-screen sticky submission bar and responsive roster", () => {
    expect(source).toContain('className="sticky bottom-0');
    expect(source).toContain("sm:static");
    expect(source).toContain("flex flex-wrap items-center justify-between");
    expect(source).toContain('aria-label="Attendance roster"');
    expect(source).toContain("Mark all present");
    expect(source).toContain("Mark all absent");
    expect(source).toContain("min-h-11");
  });
});
