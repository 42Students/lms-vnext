import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { RequestContext } from "@/modules/identity/context";
import { mayReadGlobalProjectAudit } from "@/modules/projects/admin-audit-access-model";

const collegeId = "11111111-1111-4111-8111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";

const superAdmin = (): RequestContext => ({
  user: {
    id: "33333333-3333-4333-8333-333333333333",
    identityUid: "super-admin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
});

describe("IIT Dharwad Projects: global audit authorization", () => {
  it("PROJ-BREAK-idor-24 unscoped active Super Admin can review global template events", () => {
    const actor = superAdmin();
    expect(mayReadGlobalProjectAudit(actor)).toBe(true);
    expect(mayReadGlobalProjectAudit({
      ...actor, adminScope: { organizationId: null, collegeId: null },
    })).toBe(true);
    const route = readFileSync("src/app/(authenticated)/admin/projects/audit/page.tsx", "utf8");
    expect(route).toContain("!collegeId && !mayReadGlobalProjectAudit(context)");
    expect(route).toContain("getProjectAdminCollegeId(context)");
  });

  it("PROJ-BREAK-idor-25 a selected college or organization never quietly becomes global audit scope", () => {
    const actor = superAdmin();
    for (const adminScope of [
      { collegeId, organizationId },
      { collegeId: null, organizationId },
      { collegeId, organizationId: null },
    ]) {
      expect(mayReadGlobalProjectAudit({ ...actor, adminScope })).toBe(false);
    }
    const page = readFileSync("src/components/projects/project-admin-audit-page.tsx", "utf8");
    expect(page).toContain("const globalTemplateAudit = mayReadGlobalProjectAudit(context)");
    // Cursor pagination replaced the removed button's local remaining state.
    // Keep its persisted cursor and count in the rendered navigation.
    expect(page).toContain("result.nextCursor?<Link");
    expect(page).toContain('basePath+"/audit?"+nextParams.toString()');
    expect(page).toContain('result.remainingCount?" ("+result.remainingCount+" remaining)":""');
  });

  it("PROJ-BREAK-idor-26 a disabled Super Admin or active College Admin cannot see platform audit", () => {
    const actor = superAdmin();
    expect(mayReadGlobalProjectAudit({
      ...actor, user: { ...actor.user, platformStatus: "DISABLED" },
    })).toBe(false);
    expect(mayReadGlobalProjectAudit({
      ...actor, user: { ...actor.user, systemRoles: [] },
      membership: {
        id: "44444444-4444-4444-8444-444444444444",
        collegeId, organizationId, status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
      },
    })).toBe(false);
    expect(mayReadGlobalProjectAudit(null)).toBe(false);
  });
});
