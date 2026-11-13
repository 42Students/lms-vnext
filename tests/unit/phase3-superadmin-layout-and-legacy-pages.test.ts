import { describe, expect, it } from "vitest";
import { pageFiles, read, rel } from "./phase3-scan-helpers";

const ADMIN_LAYOUT = "src/app/(authenticated)/admin/layout.tsx";

describe("Phase 3: /admin layout is the Super Admin console fence", () => {
  const src = read(ADMIN_LAYOUT);

  it("reads the request context and checks the admin portal policy before rendering children", () => {
    expect(src).toMatch(/getCurrentRequestContext\(\)/);
    const check = src.indexOf('canAccessRolePortal(context,"admin")');
    const children = src.lastIndexOf("{children}");
    expect(check).toBeGreaterThan(-1);
    expect(children).toBeGreaterThan(check);
  });

  it("denies with the legacy access-denied message and keeps the session", () => {
    expect(src).toContain("Access denied. You are not authorized to access Superadmin.");
    expect(src).toContain("Your current account session is unchanged.");
    expect(src).not.toMatch(/signOut|revokeSession|clearSession/);
  });

  it("returns before the children when access is denied (guard is an early return)", () => {
    const denied = src.indexOf('if(!canAccessRolePortal(context,"admin"))return');
    expect(denied).toBeGreaterThan(-1);
    expect(denied).toBeLessThan(src.lastIndexOf("{children}"));
  });
});

describe("Phase 3: legacy /superadmin/* bookmarks cannot widen access", () => {
  const legacy = pageFiles("src/app/(authenticated)/superadmin").map((p) => ({ file: rel(p), src: read(p) }));

  it("has the expected set of legacy aliases (new ones must be reviewed)", () => {
    const names = legacy.map((l) => l.file.replace("src/app/(authenticated)/superadmin/", "")).sort();
    expect(names).toEqual([
      "[...legacy]/page.tsx",
      "assignments/page.tsx",
      "audit/page.tsx",
      "dashboard/page.tsx",
      "departments/page.tsx",
      "lesson-content/page.tsx",
      "page.tsx",
      "programs/page.tsx",
      "projects/at-risk/page.tsx",
    ]);
  });

  it("every alias is either redirect-only into a guarded route or checks the context itself", () => {
    for (const { file, src } of legacy) {
      const redirectOnly = /redirect\(/.test(src) && !/from\s+["']@\/db|getDb\(/.test(src);
      const selfGuarded = /getCurrentRequestContext/.test(src);
      expect(redirectOnly || selfGuarded, `${file} neither redirects nor guards`).toBe(true);
    }
  });

  it("the dashboard alias re-checks isSuperAdmin before rendering the shared dashboard", () => {
    const src = read("src/app/(authenticated)/superadmin/dashboard/page.tsx");
    expect(src).toMatch(/if\(!isSuperAdmin\(context\)\)redirect\("\/dashboard"\)/);
    expect(src.indexOf("isSuperAdmin(context)")).toBeLessThan(src.indexOf("return DashboardPage()"));
  });

  it("redirect aliases only target internal absolute paths, never user-supplied URLs", () => {
    for (const { file, src } of legacy) {
      for (const m of src.matchAll(/redirect\(\s*(["'`])([^"'`]*)\1/g)) {
        expect(m[2], `${file} redirects outside the app`).toMatch(/^\//);
        expect(m[2], `${file} uses a protocol-relative redirect`).not.toMatch(/^\/\//);
      }
    }
  });

  it("the catch-all legacy route guards with isSuperAdmin and requirePermission", () => {
    const src = read("src/app/(authenticated)/superadmin/[...legacy]/page.tsx");
    expect(src).toMatch(/isSuperAdmin\(/);
    expect(src).toMatch(/requirePermission\(/);
  });
});
