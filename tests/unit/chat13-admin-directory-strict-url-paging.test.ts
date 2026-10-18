import { describe, expect, it } from "vitest";
import {
  adminDriveDirectoryQuerySchema,
  adminDriveDirectoryHref,
} from "@/modules/placements/admin-drive-directory-model";
import {
  adminCompaniesQuerySchema,
} from "@/modules/placements/admin-company-directory-model";

const malformedPages: readonly unknown[] = [
  "", " ", " 1", "1 ", "+1", "-1", "0", "01", "1.0",
  "1e2", "0x10", "0b10", "Infinity", "NaN", "1_000",
  null, true, false, ["1"], [], {}, -1, 0, 1.5, Number.NaN,
  Number.POSITIVE_INFINITY,
];

describe("chat-13 Super Admin scoped directories refuse coerced URL paging", () => {
  it("SA-ADMIN-DRIVE-03 rejects arrays, non-decimal encodings, whitespace and forged sizes", () => {
    for (const page of malformedPages) {
      expect(
        adminDriveDirectoryQuerySchema.safeParse({ page }).success,
        "page=" + JSON.stringify(page),
      ).toBe(false);
    }
    for (const size of [
      "", " ", "010", " 10", "10 ", "1e2", "0x14", "20.0",
      [], ["20"], true, null, 0, 5, 101, Number.NaN,
    ]) {
      expect(
        adminDriveDirectoryQuerySchema.safeParse({ pageSize: size }).success,
        "pageSize=" + JSON.stringify(size),
      ).toBe(false);
    }
    expect(adminDriveDirectoryQuerySchema.safeParse({ page: "100001" }).success).toBe(false);
    expect(adminDriveDirectoryQuerySchema.safeParse({ status: ["ACTIVE"] }).success).toBe(false);
    expect(adminDriveDirectoryQuerySchema.safeParse({ collegeId: "forged" }).success).toBe(false);
    for (const size of [10, 20, 50, 100]) {
      expect(adminDriveDirectoryQuerySchema.parse({
        page: "42", pageSize: String(size),
      })).toMatchObject({ page: 42, pageSize: size });
      expect(adminDriveDirectoryQuerySchema.parse({
        page: 42, pageSize: size,
      })).toMatchObject({ page: 42, pageSize: size });
    }
    const accepted = adminDriveDirectoryQuerySchema.parse({
      page: "2", pageSize: "20", q: "Acme & Company",
    });
    const href = adminDriveDirectoryHref(accepted);
    const parsed = new URL(href, "https://example.test");
    expect(parsed.searchParams.get("page")).toBe("2");
    expect(parsed.searchParams.get("pageSize")).toBe("20");
    expect(parsed.searchParams.get("q")).toBe("Acme & Company");
  });

  it("SA-COMPANY-DIRECTORY-03 applies the same literal decimal policy to relationship paging", () => {
    for (const page of malformedPages) {
      expect(
        adminCompaniesQuerySchema.safeParse({ page }).success,
        "page=" + JSON.stringify(page),
      ).toBe(false);
    }
    expect(adminCompaniesQuerySchema.safeParse({ page: "10001" }).success).toBe(false);
    expect(adminCompaniesQuerySchema.safeParse({ page: [1, 2] }).success).toBe(false);
    expect(adminCompaniesQuerySchema.safeParse({ unknownTenant: "B" }).success).toBe(false);
    expect(adminCompaniesQuerySchema.parse({ page: "9999" }).page).toBe(9999);
    expect(adminCompaniesQuerySchema.parse({ page: 23 }).page).toBe(23);
    expect(adminCompaniesQuerySchema.parse({})).toMatchObject({ page: 1 });
  });
});
