import { describe, expect, it } from "vitest";
import {
  buildTenantDirectoryCsv,
  readTenantDirectoryExportParams,
  tenantDirectoryCsvCell,
  tenantDirectoryExportHref,
  TENANT_DIRECTORY_CSV_CAP,
  type TenantDirectoryExportRow,
} from "@/modules/colleges/admin-tenant-export-model";

const base: TenantDirectoryExportRow = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Dharwad",
  code: "iit-dharwad",
  status: "ACTIVE",
  organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  organizationName: "Institute",
  organizationStatus: "ACTIVE",
  city: "Dharwad",
  state: "Karnataka",
  country: "India",
  createdAt: new Date("2099-01-01T00:00:00.000Z"),
  updatedAt: new Date("2099-01-02T00:00:00.000Z"),
};

describe("Super Admin tenant export page and service boundaries", () => {
  it("COL-TENANT-CSV-01 neutralizes formulas hidden by whitespace, C0, format and combining controls", () => {
    for (const raw of ["\u0000=CMD", " \u0000+2", "\u200b@attack", "\u0301-9", "\t=1"]) {
      expect(tenantDirectoryCsvCell(raw)).toBe('"\'' + raw + '"');
    }
    expect(tenantDirectoryCsvCell("IIT Dharwad")).toBe('"IIT Dharwad"');
    expect(tenantDirectoryCsvCell('A "quoted" college')).toBe('"A ""quoted"" college"');
    const csv = buildTenantDirectoryCsv([{
      ...base, name: "\u0000=PROBE", organizationName: "\u200b@HIDDEN",
    }], false);
    expect(csv).toContain('"\'\u0000=PROBE"');
    expect(csv).toContain('"\'\u200b@HIDDEN"');
    expect(csv).toContain("IST");
    expect(csv).not.toContain("EXPORT TRUNCATED");
  });

  it("COL-TENANT-CSV-02 rejects unknown and duplicate export filters before data reads", () => {
    const parsed = readTenantDirectoryExportParams(new URLSearchParams("q=IIT&status=ACTIVE"));
    expect(parsed.q).toBe("IIT");
    expect(parsed.status).toBe("ACTIVE");
    for (const query of [
      "page=2", "secret=", "status=INVALID",
      "status=ALL&status=ACTIVE", "organizationId=not-a-uuid",
    ]) {
      expect(() => readTenantDirectoryExportParams(new URLSearchParams(query))).toThrow();
    }
    expect(tenantDirectoryExportHref({
      q: "IIT Dharwad", status: "ARCHIVED",
    })).toBe("/api/admin/tenants/export?q=IIT+Dharwad&status=ARCHIVED");
    expect(() => tenantDirectoryExportHref({ page: 2 })).toThrow();
  });

  it("COL-TENANT-CSV-03 caps every tenant export and visibly declares truncation", () => {
    const many = Array.from({ length: TENANT_DIRECTORY_CSV_CAP + 2 }, (_, i) => ({
      ...base,
      id: "tenant-" + i,
      name: "Tenant " + i,
    }));
    const csv = buildTenantDirectoryCsv(many, false);
    expect(csv).toContain("EXPORT TRUNCATED");
    expect(csv).toContain("Only the first 1000 matching tenants");
    expect(csv).toContain('"tenant-999"');
    expect(csv).not.toContain('"tenant-1000"');
    expect(csv).not.toContain('"tenant-1001"');
    const exact = buildTenantDirectoryCsv(many.slice(0, TENANT_DIRECTORY_CSV_CAP), false);
    expect(exact).not.toContain("EXPORT TRUNCATED");
  });
});
