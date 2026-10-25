import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { collegeAdminHistoryCsv } from "@/modules/colleges/admin-history-export-model";
import {
  updateCollegeSignInSchema,
  signInCapabilities,
} from "@/modules/colleges/signin-methods-model";
import {
  exportParams,
  buildCollegeDirectoryCsv,
  collectCollegeExportRows,
} from "@/modules/academics/college-directory-export-model";
import { escapeRoleDirectoryCsvCell } from "@/modules/people/college-role-directory-export";

const read = (path: string) => readFileSync(path, "utf8");
const collegeId = "11111111-1111-4111-8111-111111111111";

describe("College/tenant exhaustive coverage slice: exports and sign-in policy", () => {
  it("SA-tenants-signin-RETRY-01 rejects malicious payloads and persists unchanged retry without double audit", () => {
    const input = { collegeId, method: "EMAIL_ONLY", expectedVersion: 1 };
    expect(updateCollegeSignInSchema.safeParse(input).success).toBe(true);
    for (const bad of [
      { method: "ALL" }, { expectedVersion: -1 }, { collegeId: "foreign" },
      { expectedVersion: 1.5 }, { anotherTenant: collegeId },
    ]) {
      expect(updateCollegeSignInSchema.safeParse({ ...input, ...bad }).success, JSON.stringify(bad)).toBe(false);
    }
    expect(signInCapabilities("EMAIL_ONLY")).toEqual({ email: true, phone: false, primary: "EMAIL" });
    const source = read("src/modules/colleges/admin-signin-policy-service.ts");
    const persisted = source.indexOf('assertPersistedPlatformPermission(tx,context,"college.manage"');
    const locked = source.indexOf('.for("update").limit(1);', persisted);
    const noOp = source.indexOf('if(current?.method===input.method)');
    const stale = source.indexOf('throw new CollegeSignInPolicyError("SIGNIN_POLICY_STALE")');
    const audit = source.indexOf('await tx.insert(activityEvents).values(');
    expect(persisted).toBeGreaterThan(-1);
    expect(locked).toBeGreaterThan(persisted);
    expect(noOp).toBeGreaterThan(locked);
    expect(stale).toBeGreaterThan(noOp);
    expect(audit).toBeGreaterThan(stale);
    expect(source).toContain("context");
    expect(source).toContain("college.organizationId");
  });

  it("SA-tenants-signin-READ-01 public read never accepts request-body tenant IDs and refuses corrupt policy", () => {
    const source = read("src/modules/colleges/public-signin-policy-service.ts");
    expect(source).toContain('if(!collegeId)return {method:fallback,requiresAdminReview:false,source:"DEFAULT" as const}');
    expect(source).toContain('if(!result.rows[0]?.["present"])return {method:fallback,requiresAdminReview:false,source:"DEFAULT" as const}');
    expect(source).toContain("collegeSignInMethodSchema.safeParse(row.method)");
    expect(source).toContain("eq(collegeSigninPolicies.collegeId,collegeId)");
    expect(source).toContain("signInCapabilities(await effectiveCollegeSignInMethod(collegeId))");
  });

  it("SA-tenants-history-01 formula neutralization and quote/newline escaping are preserved", () => {
    const csv = collegeAdminHistoryCsv([
      { occurredAt: new Date("2026-10-17T20:00:00.000Z"), eventType: "=cmd", summary: '="secret",\r\n@unsafe' },
      { occurredAt: new Date("2026-10-18T12:00:00.000Z"), eventType: "+calc", summary: "-10" },
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("18 Oct");
    expect(csv).toContain('"\'=cmd"');
    expect(csv).toContain('"\'+calc"');
    expect(csv).toContain('"\'-10"');
    expect(csv).toContain('""secret""');
    expect(csv).toContain("\r\n");
    expect(escapeRoleDirectoryCsvCell("=HYPERLINK(\"https://evil\")")).toBe('"\'=HYPERLINK(""https://evil"")"');
  });

  it("COL-academic-export-01 rejects duplicate query params and preserves safe filter values", () => {
    expect(exportParams(new URLSearchParams("q=CS&status=ACTIVE"))).toEqual({ q: "CS", status: "ACTIVE" });
    expect(exportParams(new URLSearchParams("q=CS&q=IT"))).toBeNull();
    expect(exportParams(new URLSearchParams("q=&status=ACTIVE"))).toEqual({ status: "ACTIVE" });
  });

  it("COL-academic-export-02 respects export cap and labels truncation instead of silently claiming full export", async () => {
    const seen: number[] = [];
    const readPage = async (page: number) => {
      seen.push(page);
      return { items: [page], total: 5000, totalPages: 5000 };
    };
    for (const bad of [0, -1, 1.2, Number.POSITIVE_INFINITY, NaN, 1001]) {
      await expect(collectCollegeExportRows(readPage, bad, 3)).rejects.toThrow("INVALID_EXPORT_PAGE_SIZE");
      await expect(collectCollegeExportRows(readPage, 1, bad)).rejects.toThrow("INVALID_EXPORT_CAP");
    }
    expect(seen).toEqual([]);
    const result = await collectCollegeExportRows(readPage, 1, 3);
    expect(result).toEqual({ rows: [1, 2, 3], truncated: true, cap: 3 });
    expect(seen).toEqual([1, 2, 3]);
    const csv = buildCollegeDirectoryCsv(["Name", "Status"], [["=HYPERLINK(1)", "ACTIVE"]], true, 3);
    expect(csv).toContain("EXPORT TRUNCATED");
    expect(csv).toContain("Only the first 3 matching records were exported.");
    expect(csv).toContain("'=HYPERLINK(1)");
  });
});
