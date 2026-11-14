import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LEGACY_ROUTES, expiredLegacyRoutes, legacyRedirects } from "@/lib/legacy-routes";

describe("legacy route table", () => {
  it("has no duplicate old paths and every entry names a reason and a removal date", () => {
    const froms = LEGACY_ROUTES.map((r) => r.from);
    expect(new Set(froms).size).toBe(froms.length);
    for (const r of LEGACY_ROUTES) {
      expect(r.removeOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.reason.length).toBeGreaterThan(10);
    }
  });

  it("keeps every redirect the app served before the table existed", () => {
    const sources = legacyRedirects().map((r) => r.source);
    for (const expected of [
      "/mentor/profile", "/mentor/contacts", "/mentor/contacts/:path*", "/mentor/allQuizzes", "/mentor/fileExplorer",
      "/teacher/fileExplorer", "/mentor/courses", "/mentor/courses/:path*", "/mentor/quizzes", "/mentor/quizzes/:path*",
      "/mentor/allQuizzes/:path*", "/mentor/fileExplorer/:path*", "/mentor/files", "/mentor/files/:path*",
    ]) expect(sources, expected).toContain(expected);
    expect(sources).toHaveLength(14);
    expect(legacyRedirects().every((r) => r.permanent === false)).toBe(true);
  });

  it("next.config reads redirects from the table", () => {
    expect(readFileSync("next.config.ts", "utf8")).toContain("legacyRedirects()");
  });

  it("fails once an entry is past its removal date, so old paths get deleted", () => {
    expect(expiredLegacyRoutes()).toEqual([]);
    expect(expiredLegacyRoutes(new Date("2099-01-01")).length).toBe(LEGACY_ROUTES.length);
  });
});
