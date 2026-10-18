import { describe, expect, it } from "vitest";
import { superAdminCompanyCsv } from "@/modules/placements/admin-company-directory-export-model";
import { buildSuperAdminScopedCsv } from "@/modules/admin-ui/super-admin-scoped-csv-model";
import type { AdminCompanyRow } from "@/modules/placements/admin-company-directory-model";

describe("SA-ADMIN-CSV-04 Super Admin spreadsheet formula injection hardening", () => {
  const formulaPrefixes = [
    "\u034F=1+2", // COMBINING GRAPHEME JOINER is Mn.
    "\u0301+SUM(1,2)", // combining accent
    "\u2060@SUM(1,2)", // WORD JOINER is Cf
    "\u202E-HYPERLINK(\"https://example.invalid\")",
    "\t=1+2",
    "\r\n@SUM(1,2)",
  ];

  it("quotes and neutralizes leading combining marks and format controls in company exports", () => {
    const row: AdminCompanyRow = {
      relationshipId: "rel-a", companyId: "company-a", name: "Safe company",
      collegeId: "college-a", collegeName: "College A", organizationId: "org-a",
      relationshipStatus: "ACTIVE", companyStatus: "ACTIVE", trusted: false,
      website: null,
    };
    for (const injected of formulaPrefixes) {
      const csv = superAdminCompanyCsv([{ ...row, name: injected }]);
      expect(csv).toContain("\"'" + injected.replaceAll("\"", "\"\"") + "\"");
      expect(csv.startsWith("Company ID,")).toBe(false);
    }
    const safe = superAdminCompanyCsv([{...row, name: "Normal"}]);
    expect(safe).toContain('"Normal"');
    expect(safe).not.toContain('"\'Normal"');
  });

  it("guards arbitrary Unicode prefixes in scoped placement report exports", () => {
    for (const injected of formulaPrefixes) {
      const csv = buildSuperAdminScopedCsv([{
        id: "record-a", title: injected, subtitle: "College A",
        status: "ACTIVE", details: [],
      }], false);
      expect(csv).toContain("\"'" + injected.replaceAll("\"", "\"\"") + "\"");
      expect(csv.startsWith("\uFEFF")).toBe(true);
    }
    const plain = buildSuperAdminScopedCsv([{
      id: "record-a", title: "Plain", subtitle: "Safe", status: "ACTIVE", details: [],
    }], false);
    expect(plain).toContain('"Plain"');
    expect(plain).not.toContain('"\'Plain"');
  });
});
