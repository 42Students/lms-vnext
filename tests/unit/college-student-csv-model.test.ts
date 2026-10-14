import { describe, expect, it } from "vitest";
import {
  MAX_STUDENT_CSV_ROWS, parseStudentCsv, studentCsvRequestSchema,
  studentImportReportCsv, tokenizeStudentCsv,
} from "@/modules/people/college-student-csv-model";

const programId = "30000000-0000-4000-8000-000000000001";
const cohortId = "40000000-0000-4000-8000-000000000001";
const header = "displayName,phoneE164,email,programId,cohortId";
function row(name: string, phone: string) {
  return `${name},${phone},,${programId},${cohortId}`;
}

describe("College student CSV import model", () => {
  it("parses quoted commas and CRLF without miscounting rows", () => {
    const cells = tokenizeStudentCsv(header + "\r\n" +
      `"Last, First",+919876543210,,${programId},${cohortId}\r\n`);
    expect(cells).toHaveLength(2);
    const result = parseStudentCsv(header + "\n" +
      `"Last, First",+919876543210,,${programId},${cohortId}`);
    expect(result.structuralErrors).toEqual([]);
    expect(result.entries[0].data?.displayName).toBe("Last, First");
  });

  it("enforces maximum rows, unique contacts and canonical header", () => {
    const csv = [header, row("A", "+919876543210"), row("B", "+919876543210")].join("\n");
    const result = parseStudentCsv(csv);
    expect(result.entries[1].errors).toContain("DUPLICATE_PHONE_IN_FILE");
    expect(parseStudentCsv("unknown,fields\n1,2").structuralErrors)
      .toContain("INVALID_CSV_HEADER");
    const oversized = [header, ...Array.from({ length: MAX_STUDENT_CSV_ROWS + 1 },
      (_, i) => row("Student " + i, "+91987654" + String(i).padStart(3,"0")))].join("\n");
    expect(parseStudentCsv(oversized).structuralErrors).toContain("ROW_LIMIT_EXCEEDED");
  });

  it("flags case-variant duplicate emails in one upload before provisioning", () => {
    const csv = [header,
      `One,+919876543210,STUDENT@Example.EDU,${programId},${cohortId}`,
      `Two,+919876543211,student@example.edu,${programId},${cohortId}`,
    ].join("\n");
    const parsed = parseStudentCsv(csv);
    expect(parsed.structuralErrors).toEqual([]);
    expect(parsed.entries[0].errors).toEqual([]);
    expect(parsed.entries[1].errors).toContain("DUPLICATE_EMAIL_IN_FILE");
  });

  it("requires confirmation and refuses injected selection fields", () => {
    expect(studentCsvRequestSchema.safeParse({
      action: "IMPORT", csv: header, confirm: false,
    }).success).toBe(false);
    expect(studentCsvRequestSchema.safeParse({
      action: "IMPORT", csv: header, confirm: true, collegeId: programId,
    }).success).toBe(false);
    expect(studentCsvRequestSchema.safeParse({
      action: "PREVIEW", csv: header,
    }).success).toBe(true);
  });

  it("neutralizes spreadsheet formulas in exported status details", () => {
    const report = studentImportReportCsv([
      { row: 2, status: "FAILED", detail: "=HYPERLINK(\"evil\")" },
      { row: 3, status: "INVALID", detail: " +SUM(1,2)" },
    ]);
    expect(report).toContain('"\'=HYPERLINK(');
    expect(report).toContain('"\' +SUM(1,2)"');
    expect(report).not.toContain('"=HYPERLINK(');
  });
});
