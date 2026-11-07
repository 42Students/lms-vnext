import { describe, expect, it } from "vitest";
import {
  collegeGroupCsvPreviewSchema, groupCsvPreviewErrorMessage, groupCsvValidationLabel, groupPreviewErrorCsv, neutralCsvCell, parseMemberEmailCsv,
} from "@/modules/groups/college-group-csv-preview-model";

describe("Student Group email import dry-run", () => {
  it("parses BOM, CRLF, quoted fields and keeps row numbers", () => {
    expect(parseMemberEmailCsv("\ufeffemail\r\n\"a@example.com\"\r\nb@example.com\r\n"))
      .toEqual([
        { rowNumber: 2, value: "a@example.com", validColumns: true },
        { rowNumber: 3, value: "b@example.com", validColumns: true },
      ]);
    expect(parseMemberEmailCsv("email\na,b\n")[0].validColumns).toBe(false);
    // Preserves an empty final quoted record, and unescapes doubled quotes.
    expect(parseMemberEmailCsv('email\n""')).toEqual([
      { rowNumber: 2, value: "", validColumns: true },
    ]);
    expect(parseMemberEmailCsv('email\n"a""b@example.com"')).toEqual([
      { rowNumber: 2, value: 'a"b@example.com', validColumns: true },
    ]);
  });
  it("rejects missing header, oversize files and malformed quoting", () => {
    expect(() => parseMemberEmailCsv("not_email\na@example.com")).toThrow("CSV_HEADER_EMAIL_REQUIRED");
    expect(() => parseMemberEmailCsv('email\n"unterminated')).toThrow("UNTERMINATED_CSV_QUOTE");
    expect(() => parseMemberEmailCsv('email\n"alice@example.com"oops'))
      .toThrow("INVALID_CSV_QUOTE");
    expect(() => parseMemberEmailCsv('email\n"alice@example.com" "'))
      .toThrow("INVALID_CSV_QUOTE");
    expect(() => parseMemberEmailCsv("email\n" + "a@example.com\n".repeat(2001)))
      .toThrow("CSV_ROW_LIMIT");
    expect(collegeGroupCsvPreviewSchema.safeParse({
      groupId: "10000000-0000-4000-8000-000000000001", csv: "email\n", collegeId: "forged",
    }).success).toBe(false);
    expect(collegeGroupCsvPreviewSchema.safeParse({
      groupId: "10000000-0000-4000-8000-000000000001", csv: "a".repeat(524289),
    }).success).toBe(false);
  });
  it("labels inactive groups separately from capacity limits", () => {
    expect(groupCsvValidationLabel("GROUP_NOT_ACTIVE")).toMatch(/Activate the group/i);
    expect(groupCsvValidationLabel("CAPACITY_FULL")).toMatch(/capacity is full/i);
    expect(groupCsvValidationLabel("PREVIOUSLY_REMOVED")).toMatch(/Previously removed/i);
    expect(groupCsvValidationLabel("READY")).toBe("Ready to add");
  });
  it("does not expose unknown internal CSV import error codes", () => {
    expect(groupCsvPreviewErrorMessage("INVALID_CSV_QUOTE")).toMatch(/malformed quotation marks/i);
    expect(groupCsvPreviewErrorMessage("CSV_ROW_LIMIT")).toMatch(/2,000 learner rows/i);
    expect(groupCsvPreviewErrorMessage("INTERNAL_DATABASE_SECRET")).not.toContain("SECRET");
  });
  it("neutralizes formulas and escapes CSV quotations in the error export", () => {
    for (const value of ["=HYPERLINK(\"http://host\")", "+SUM(1,2)", "-3", "@cmd", "\t=1"]) {
      expect(neutralCsvCell(value)).toMatch(/^"'/.test(value) ? /^"'/ : /^"'/);
    }
    const csv = groupPreviewErrorCsv([{ rowNumber: 2,
      email: '=HYPERLINK("x")', status: "INVALID_EMAIL" }]);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain('""x""');
    expect(csv).toContain("INVALID_EMAIL");
  });
});
