import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  neutralizePeopleCsv,
  renderPeopleCsv,
} from "@/modules/people/college-people-export-model";
import {
  buildSuperAdminPeopleCsv,
} from "@/modules/people/admin-users-export-model";

/**
 * These are source and pure CSV encoding regression contracts.
 * They do not replace a real authenticated route / PostgreSQL acceptance run.
 */
describe("private bulk exports: Unicode-hidden spreadsheet formula neutralization", () => {
  const hostile = [
    "=HYPERLINK(\"https://attacker.invalid\", \"open\")",
    "\u200B=1+2", // zero-width space
    "\u2060+1+2", // invisible word joiner
    "\uFEFF@cmd", // format/BOM
    "\u0301-SUM(1,2)", // leading combining accent
    "\u034F\t=2+2", // invisible combining grapheme joiner
    "\u001F@SUM(1,2)", // control prefix
    " \t\r\n=1+2",
  ];
  it.each(hostile)("prefixes dangerous cells without discarding their original content: %j", (input) => {
    const encoded = neutralizePeopleCsv(input);
    expect(encoded.startsWith("\"'")).toBe(true);
    expect(encoded.endsWith("\"")).toBe(true);
    expect(encoded.slice(2, -1).replaceAll('""', '"')).toBe(input);
  });

  it("does not needlessly prefix ordinary names and neutral values", () => {
    for (const input of ["Asha Rao", "Senior - Faculty", "42Learn", "safe@example.com", ""]) {
      expect(neutralizePeopleCsv(input)).toBe('"' + input + '"');
    }
  });

  it("protects the actual learner/college roster serialization", () => {
    const input = "\u200B=1+2";
    const row = {
      membership: { id: "membership-1", roles: ["LEARNER"], status: "ACTIVE",
        createdAt: new Date("2026-01-01T00:00:00Z") },
      user: { displayName: input, email: "a@example.test", phoneE164: null },
    };
    const csv = renderPeopleCsv([row] as unknown as Parameters<typeof renderPeopleCsv>[0], false);
    expect(csv).toContain("\"'\u200B=1+2\"");
    expect(csv).not.toContain(',"\u200B=1+2",');
  });

  it("protects the actual super-admin people serialization", () => {
    const input = "\u2060=1+2";
    const csv = buildSuperAdminPeopleCsv([{
      membershipId: "membership-1", displayName: input, collegeName: "College A",
      platformStatus: "ACTIVE", membershipStatus: "ACTIVE",
      roles: ["LEARNER"], updatedAt: new Date("2026-01-01T00:00:00Z"),
    }], false);
    expect(csv).toContain("\"'\u2060=1+2\"");
    expect(csv).not.toContain(',"\u2060=1+2",');
  });
});

describe("private roster export routes require recent server-side sign-in", () => {
  const targets = [
    ["src/app/api/admin/people/export/route.ts", "exportSuperAdminUsers("],
    ["src/app/api/admin/tenants/export/route.ts", "exportSuperAdminTenantDirectory("],
    ["src/app/api/college/people/export/route.ts", "exportCollegePeopleCsv("],
    ["src/app/api/college/roles/export/route.ts", "exportCollegeRoleDirectoryCsv("],
    ["src/app/api/admin/companies/export/route.ts", "listSuperAdminCompanyDirectory("],
    ["src/app/api/admin/placements/hiring-report/export/route.ts", "getSuperAdminCompanyHiringReport("],
    ["src/app/api/college/companies/export/route.ts", "listCollegeCompanyDirectory("],
    ["src/app/api/admin/course-progress/students/export/route.ts", "getSuperAdminStudentCourseProgress("],
    ["src/app/api/placements/tpo/audit/export/route.ts", "getTpoAuditLog("],
    ["src/modules/admin-ui/super-admin-scoped-csv-service.ts", "config.loader("],
  ] as const;

  it.each(targets)("%s checks a live recent device session before private data reads", (path, lookup) => {
    const source = readFileSync(path, "utf8");
    expect(source).toContain('from "@/auth/recent-device-auth"');
    // Wrapper form: route() resolves the request actor (auth) before the handler body runs.
    const wrapped = source.includes('from "@/security/route"') && /=\s*route\(\s*\{\s*auth:\s*"user"/.test(source);
    // Wrapper form with an in-handler actor lookup: the handler body still resolves the actor before the recent-auth guard.
    const own = source.indexOf("getCurrentRequestContext()");
    const context = wrapped && own < 0 ? source.search(/=\s*route\(/) : own;
    const recent = source.indexOf("await requireRecentDeviceAuthentication(context.user.id)");
    const firstRead = source.indexOf(lookup);
    expect(context, path + ": no request actor").toBeGreaterThan(0);
    expect(recent, path + ": no recent-auth guard").toBeGreaterThan(context);
    expect(firstRead, path + ": no private data source").toBeGreaterThan(recent);
  });
});
