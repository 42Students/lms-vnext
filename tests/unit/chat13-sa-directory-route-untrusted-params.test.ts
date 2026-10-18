import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  parseAdminCompanyDirectoryParams,
} from "@/modules/placements/admin-company-directory-model";
import {
  adminDriveDirectoryQuerySchema,
} from "@/modules/placements/admin-drive-directory-model";

describe("chat-13 Super Admin company and drive URL authorization-adjacent input boundaries", () => {
  it("SA-COMPANY-QUERY-04 retains valid legacy tabs and blanks without accepting unknown/duplicate keys", () => {
    for (const view of [undefined, "GLOBAL", "COLLEGE"]) {
      const parsed = parseAdminCompanyDirectoryParams({
        view, collegeId: "", q: "Acme", page: "1",
      });
      expect(parsed.success, String(view)).toBe(true);
      if (parsed.success) {
        expect(parsed.data.q).toBe("Acme");
        expect(parsed.data.page).toBe(1);
        expect(parsed.data.collegeId).toBeUndefined();
      }
    }
    for (const input of [
      { view: "SUPER_ADMIN" },
      { view: ["GLOBAL", "COLLEGE"] },
      { view: ["GLOBAL"] },
      { searchScope: "foreign-college" },
      { organizationId: "foreign-org" },
      { collegeId: ["", "other-college"] },
      { page: ["1", "2"] },
      { page: "1e2" },
      { page: "0x10" },
      { q: ["safe", "attacker"] },
      { companyStatus: ["ACTIVE", "ARCHIVED"] },
    ]) {
      expect(
        parseAdminCompanyDirectoryParams(input).success,
        JSON.stringify(input),
      ).toBe(false);
    }
  });

  it("SA-ADMIN-DRIVE-05 rejects forged raw filter keys and duplicate URL values", () => {
    expect(adminDriveDirectoryQuerySchema.parse({ q: "Acme", page: "2" }))
      .toMatchObject({ q: "Acme", page: 2 });
    for (const raw of [
      { collegeId: "foreign" }, { organizationId: "foreign" },
      { page: ["1", "2"] }, { q: ["owner", "other"] },
      { view: "CROSS_TENANT" }, { pageSize: "0x14" },
    ]) expect(
      adminDriveDirectoryQuerySchema.safeParse(raw).success,
      JSON.stringify(raw),
    ).toBe(false);
  });

  it("binds strict parsing to each real route and retains its recoverable filter-error UI", () => {
    const companyPage = readFileSync("src/app/(authenticated)/admin/companies/page.tsx", "utf8");
    const drivePage = readFileSync("src/app/(authenticated)/admin/placements/drives/page.tsx", "utf8");
    expect(companyPage).toContain("parseAdminCompanyDirectoryParams(params)");
    expect(drivePage).toContain("adminDriveDirectoryQuerySchema.safeParse(raw)");
    expect(companyPage).toContain("Invalid company search");
    expect(drivePage).toContain("Invalid drive filters");
    expect(companyPage).not.toContain("q: params.q, owner: params.owner");
    expect(drivePage).not.toContain("q:raw.q,status:raw.status,page:raw.page");
  });
});
