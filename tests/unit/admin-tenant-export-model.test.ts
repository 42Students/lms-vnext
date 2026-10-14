import { describe, expect, it } from "vitest";
import { buildTenantDirectoryCsv, readTenantDirectoryExportParams, tenantDirectoryExportHref, TENANT_DIRECTORY_CSV_CAP } from "@/modules/colleges/admin-tenant-export-model";
const row = { id: "id", name: '=HYPERLINK("bad")', code: "+CODE", status: "ACTIVE", organizationId: "org", organizationName: "@Org",
  organizationStatus: "ACTIVE", city: "  =1+2", state: 'Quoted "state"\nNext line', country: "India",
  createdAt: new Date("2026-10-14T18:30:00Z"), updatedAt: new Date("2026-10-14T18:30:00Z") };
describe("Tenant directory CSV", () => {
  it("neutralizes every text cell, preserves quotes/newlines and displays IST", () => {
    const csv = buildTenantDirectoryCsv([row], false);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+CODE"); expect(csv).toContain("'@Org"); expect(csv).toContain("'  =1+2");
    expect(csv).toContain('Quoted ""state""\nNext line');
    expect(csv).toContain("15/10/2026"); expect(csv).toContain(" IST");
    expect(csv).not.toContain("Email"); expect(csv).not.toContain("Phone");
  });
  it("caps output defensively and discloses truncation", () => {
    const plain = { ...row, name: "Name", state: "State" };
    const csv = buildTenantDirectoryCsv(Array.from({ length: TENANT_DIRECTORY_CSV_CAP + 1 }, () => plain), false);
    expect(csv.split("\r\n")).toHaveLength(TENANT_DIRECTORY_CSV_CAP + 2);
    expect(csv).toContain("EXPORT TRUNCATED");
    expect(csv).toContain("in name order");
  });
  it("preserves lifecycle filters and refuses duplicate filters, cursors and scope injection", () => {
    expect(tenantDirectoryExportHref({ q: "A & B", status: "ARCHIVED" })).toBe("/api/admin/tenants/export?q=A+%26+B&status=ARCHIVED");
    for (const query of ["status=ACTIVE&status=ARCHIVED", "q=a&q=b", "page=2", "collegeId=override"]) {
      expect(() => readTenantDirectoryExportParams(new URLSearchParams(query))).toThrow();
    }
  });
});
