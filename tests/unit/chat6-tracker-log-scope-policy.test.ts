import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("42 Tracker secure log access policy", () => {
  it("SA-placements-projects-118 NOT-A-GAP manager password bypass is disallowed by OD-27; log access remains Super Admin scoped", () => {
    const decisions = read("docs/audit/owner-decisions-resolved.md");
    const logs = read("src/app/(authenticated)/tracker/logs/page.tsx");
    expect(decisions).toContain("OD-27");
    expect(decisions).toContain("logs and audit findings stay Super Admin only");
    expect(logs).toContain('context.user.platformStatus !== "ACTIVE" || !isSuperAdmin(context) ||');
    expect(logs).toContain("context.adminScope?.collegeId || context.adminScope?.organizationId");
    expect(logs).toContain('title="Logs access"');
    expect(logs).toContain("Sign in with an authorized Super Admin account");
    expect(logs).toContain("context.adminScope?.organizationId)");
    expect(logs).toContain("the old shared password is no longer accepted.");
    expect(logs).not.toContain("passwordGate");
  });
});
