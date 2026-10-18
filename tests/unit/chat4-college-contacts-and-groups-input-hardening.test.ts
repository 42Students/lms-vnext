import { describe, expect, it } from "vitest";
import {
  activeCollegeContactFilterCount,
  collegeContactLiteralPattern,
  collegeContactsQuerySchema,
  contactAcademicFiltersCompatible,
  contactDateWindowValid,
  contactRoleAudienceCompatible,
  parseCollegeContactsSearchParams,
} from "@/modules/people/college-contacts-model";
import { maskedEmail, maskedPhone, visibleContactDetails } from "@/modules/people/college-contacts-privacy";
import {
  appendUniqueContactExportRows,
  neutralizeContactCell,
  parseCollegeContactsExportParams,
  renderCollegeContactCsv,
} from "@/modules/people/college-contacts-export-model";
import type { CollegeContactRow } from "@/modules/people/college-contacts-service";
import {
  groupPreviewErrorCsv,
  neutralCsvCell,
  parseMemberEmailCsv,
} from "@/modules/groups/college-group-csv-preview-model";

const member = "00000000-0000-4000-8000-000000000004";

describe("College Admin contact directory and study-group export boundaries", () => {
  it("COL-CONTACTS-BOUNDARY-01 rejects exponent, hex, signed, whitespace and fractional URL page controls", () => {
    expect(parseCollegeContactsSearchParams({ page: "2", pageSize: "25" }).page).toBe(2);
    expect(parseCollegeContactsSearchParams({ page: "2", pageSize: "25" }).pageSize).toBe(25);
    expect(collegeContactsQuerySchema.parse({ page: 3, pageSize: 50 }).page).toBe(3);
    for (const value of ["0x10", "1e2", " 2", "+2", "2.0", "2 ", "-1", "0", "10001"]) {
      expect(() => parseCollegeContactsSearchParams({ page: value })).toThrow();
    }
    for (const value of ["0x14", "2e1", " 20", "+20", "20.0", "20 ", "0", "100"]) {
      expect(() => parseCollegeContactsSearchParams({ pageSize: value })).toThrow();
    }
    expect(() => parseCollegeContactsSearchParams({ page: ["1", "2"] })).toThrow();
    expect(() => parseCollegeContactsSearchParams({ unknownTenant: member })).toThrow();
    expect(() => parseCollegeContactsSearchParams({ membershipId: member, page: "1" })).not.toThrow();
  });

  it("COL-CONTACTS-BOUNDARY-02 blocks conflicting role, academic and date filters without broadening", () => {
    expect(contactRoleAudienceCompatible({ tab: "STUDENT", audience: "FACULTY_ONLY" })).toBe(false);
    expect(contactRoleAudienceCompatible({ tab: "FACULTY", audience: "LEARNER_ONLY" })).toBe(false);
    expect(contactRoleAudienceCompatible({ tab: "ALL", audience: "DUAL" })).toBe(true);
    expect(contactDateWindowValid({ joinedFrom: "2099-03-02", joinedThrough: "2099-03-01" })).toBe(false);
    expect(contactAcademicFiltersCompatible({
      teaching: "NONE", teachingRole: "MAIN", enrollment: "ALL", classPresence: "ALL",
    })).toBe(false);
    expect(() => parseCollegeContactsSearchParams({
      joinedFrom: "2099-03-02", joinedThrough: "2099-03-01",
    })).toThrow("INVALID_CONTACT_DATE_WINDOW");
    expect(() => parseCollegeContactsSearchParams({
      tab: "STUDENT", audience: "FACULTY_ONLY",
    })).toThrow("INVALID_CONTACT_ROLE_AUDIENCE");
    expect(collegeContactLiteralPattern("10%_\\")).toBe("%10\\%\\_\\\\%");
    expect(activeCollegeContactFilterCount(collegeContactsQuerySchema.parse({
      tab: "STUDENT", q: "Name", page: 3, pageSize: 50, sort: "NEWEST",
    }))).toBe(1);
  });

  it("COL-CONTACTS-PRIVACY-01 masks learners, including dual-role accounts, in directory projections", () => {
    expect(maskedEmail("student@example.edu")).toBe("s•••@example.edu");
    expect(maskedPhone("+91 98765 43210")).toBe("•••• 3210");
    expect(maskedEmail("invalid")).toBe("Not available");
    expect(maskedPhone("12")).toBe("Not available");
    const raw = { email: "student@example.edu", phone: "+91 98765 43210", isLearner: true };
    expect(visibleContactDetails(raw)).toEqual({
      email: "s•••@example.edu", phone: "•••• 3210",
    });
    expect(visibleContactDetails({ ...raw, isLearner: false }).email).toBe("student@example.edu");
    expect(visibleContactDetails({ ...raw, isLearner: true }).email).not.toContain("student@");
  });

  it("COL-CONTACTS-CSV-01 protects a formula behind Unicode format and combining marks", () => {
    for (const value of ["\u200b=SUM(1,2)", "\u200d+1", "\u0301@cmd", " \u2060-3", "\u0000=1"]) {
      expect(neutralizeContactCell(value)).toBe('"\'' + value + '"');
    }
    expect(neutralizeContactCell('A "quoted" contact')).toBe('"A ""quoted"" contact"');
    expect(neutralizeContactCell("Normal Student")).toBe('"Normal Student"');
    expect(() => parseCollegeContactsExportParams(new URLSearchParams("page=2"))).toThrow();
    expect(() => parseCollegeContactsExportParams(new URLSearchParams("tab=ALL&tab=STUDENT"))).toThrow();
    const rows: CollegeContactRow[] = [{
      membershipId: member, name: "\u200b=CMD", email: "s•••@example.edu",
      phone: "•••• 3210", roles: ["LEARNER"], status: "ACTIVE",
      joinedAt: new Date("2099-01-01T00:00:00Z"),
    }];
    const csv = renderCollegeContactCsv(rows, false);
    expect(csv).toContain('"\'\u200b=CMD"');
    expect(csv).toContain("s•••@example.edu");
    expect(csv).not.toContain("student@example.edu");
    const appended = [...rows];
    appendUniqueContactExportRows(appended, rows);
    expect(appended).toHaveLength(1);
  });

  it("COL-GROUP-CSV-01 protects hidden spreadsheet formulas, bounds and RFC CSV quoting", () => {
    for (const value of ["\u200b=1+1", "\u200d@name", "\u0301+22", " \u2060-9", "\u0000=3"]) {
      expect(neutralCsvCell(value)).toBe('"\'' + value + '"');
    }
    expect(neutralCsvCell('A "quoted" name')).toBe('"A ""quoted"" name"');
    expect(parseMemberEmailCsv("email\r\na@example.edu\r\n")).toEqual([
      { rowNumber: 2, value: "a@example.edu", validColumns: true },
    ]);
    expect(() => parseMemberEmailCsv("not-email\nfoo@example.edu")).toThrow("CSV_HEADER_EMAIL_REQUIRED");
    expect(() => parseMemberEmailCsv("email\n\"unterminated")).toThrow("UNTERMINATED_CSV_QUOTE");
    const csv = groupPreviewErrorCsv([{
      rowNumber: 2, email: "\u200b=CMD", status: "INVALID_EMAIL",
    }]);
    expect(csv).toContain('"\'\u200b=CMD"');
    expect(csv).not.toContain('"\u200b=CMD"');
  });
});
