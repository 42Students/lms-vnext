import { describe, expect, it } from "vitest";
import { superAdminCompanyCsv } from "@/modules/placements/admin-company-directory-export-model";
import { buildSuperAdminScopedCsv } from "@/modules/admin-ui/super-admin-scoped-csv-model";
import type { AdminCompanyRow } from "@/modules/placements/admin-company-directory-model";

const company: AdminCompanyRow = {
  relationshipId: "relation-a", companyId: "company-a", name: "Acme",
  collegeId: "college-a", collegeName: "College A", organizationId: "org-a",
  relationshipStatus: "ACTIVE", companyStatus: "ACTIVE",
  trusted: false, website: null,
};

describe("SA-ADMIN-CSV-05 Super Admin relationship and scoped report formula prefix consistency", () => {
  it("neutralizes leading Unicode controls and enclosing marks in both CSV serializers", () => {
    for (const prefix of ["\u0000", "\u001f", "\u20dd", "\u200b", "\u034f", "\t\u202e"]) {
      for (const symbol of ["=", "+", "@", "-"]) {
        const value = prefix + symbol + 'HYPERLINK("https://malicious.example")';
        const expected = '"' + "'" + value.replaceAll('"', '""') + '"';
        const companies = superAdminCompanyCsv([{ ...company, name: value }]);
        const scoped = buildSuperAdminScopedCsv([{
          id: "record-a", title: value, subtitle: "College A",
          status: "ACTIVE", details: [],
        }], false);
        expect(companies, JSON.stringify(value)).toContain(expected);
        expect(scoped, JSON.stringify(value)).toContain(expected);
      }
    }
  });
  it("retains CSV quoting and plain values; does not alter visibility or caps", () => {
    const safe = 'Acme "engineering", India';
    const companies = superAdminCompanyCsv([{ ...company, name: safe }]);
    const scoped = buildSuperAdminScopedCsv([{
      id: "record-a", title: safe, subtitle: "College A",
      status: "ACTIVE", details: [],
    }], false);
    expect(companies).toContain('"Acme ""engineering"", India"');
    expect(scoped).toContain('"Acme ""engineering"", India"');
    expect(companies).not.toContain('"\'Acme');
    expect(scoped).not.toContain('"\'Acme');
    expect(scoped.startsWith("\ufeff")).toBe(true);
  });
});
