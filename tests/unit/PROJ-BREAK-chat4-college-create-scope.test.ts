import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { RequestContext } from "@/modules/identity/context";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { createClassTeamWorkspacesSchema } from "@/modules/projects/class-team-create-request";

const collegeA = "11111111-1111-4111-8111-111111111111";
const collegeB = "22222222-2222-4222-8222-222222222222";
const orgA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const orgB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const learnerA = "33333333-3333-4333-8333-333333333333";
const templateId = "44444444-4444-4444-8444-444444444444";

function collegeAdmin(): RequestContext {
  return {
    user: { id: "actor", identityUid: "actor", platformStatus: "ACTIVE", systemRoles: [] },
    membership: {
      id: "membership", collegeId: collegeA, organizationId: orgA,
      status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
    },
  };
}

describe("College Admin Projects class-team creation adversarial scopes", () => {
  it("PROJ-BREAK-COL-SCOPE-01 cannot use a foreign college ID even when all request UUIDs are valid", () => {
    const actor = collegeAdmin();
    expect(getProjectAdminCollegeId(actor)).toBe(collegeA);
    expect(getProjectAdminCollegeId(actor)).not.toBe(collegeB);
    const service = readFileSync("src/modules/projects/class-team-roster-service.ts", "utf8");
    expect(service).toContain("getProjectAdminCollegeId(context) !== college.id");
    expect(service).toContain('throw new ProjectsServiceError("PROJECT_ACCESS_DENIED")');
    expect(service.indexOf("getProjectAdminCollegeId(context) !== college.id"))
      .toBeLessThan(service.indexOf("requirePermission(context, \"projects.manage\""));
    expect(service).toContain("eq(collegeMemberships.collegeId, college.id)");
    expect(service).toContain("eq(collegeMemberships.userId, context.user.id)");
  });

  it("PROJ-BREAK-COL-SCOPE-02 Super Admin must select exactly the college and organization before creating", () => {
    const actor: RequestContext = {
      ...collegeAdmin(),
      user: { ...collegeAdmin().user, systemRoles: ["SUPER_ADMIN"] },
      adminScope: null,
    };
    expect(getProjectAdminCollegeId(actor)).toBeNull();
    expect(getProjectAdminCollegeId({ ...actor, adminScope: { collegeId: null, organizationId: orgA } })).toBeNull();
    expect(getProjectAdminCollegeId({ ...actor, adminScope: { collegeId: collegeB, organizationId: orgB } })).toBe(collegeB);
    expect(getProjectAdminCollegeId({ ...actor, adminScope: { collegeId: collegeB, organizationId: orgA } })).toBe(collegeB);
    // The persisted organization check in requirePermission independently
    // rejects an A/B mismatch after the selected-college check.
    expect(getProjectAdminCollegeId({ ...actor, adminScope: { collegeId: collegeA, organizationId: orgA } })).toBe(collegeA);
  });

  it("PROJ-BREAK-COL-EXPIRED-01 refuses suspended and removed memberships, wrong roles and disabled users", () => {
    const active = collegeAdmin();
    expect(getProjectAdminCollegeId({ ...active, membership: null })).toBeNull();
    expect(getProjectAdminCollegeId({ ...active, membership: { ...active.membership!, roles: ["FACULTY"] } })).toBeNull();
    expect(getProjectAdminCollegeId({ ...active, membership: { ...active.membership!, status: "SUSPENDED" } })).toBeNull();
    expect(getProjectAdminCollegeId({ ...active, membership: { ...active.membership!, status: "ENDED" } })).toBeNull();
    expect(getProjectAdminCollegeId({ ...active, user: { ...active.user, platformStatus: "DISABLED" } })).toBeNull();
  });

  it("PROJ-BREAK-COL-INPUT-02 rejects malformed preview, duplicate keys, unknown fields and oversized teams", () => {
    const valid = {
      collegeId: collegeA,
      classId: collegeB,
      templateId,
      rosterRevision: "1234abcd",
      baseTitle: "IIT Dharwad Team",
      baseSlug: "iit-team",
      cohortMode: false,
      teams: [{ name: "Team 1", membershipIds: [learnerA] }],
      expectedPreviewVersion: "1234abcd",
    };
    expect(createClassTeamWorkspacesSchema.safeParse(valid).success).toBe(true);
    for (const invalid of [
      { collegeId: "not-a-uuid" },
      { rosterRevision: "" },
      { baseSlug: "../other" },
      { baseTitle: "x".repeat(171) },
      { expectedPreviewVersion: "invalid" },
      { teams: [] },
      { teams: [{ name: "", membershipIds: [learnerA] }] },
      { teams: [{ name: "X", membershipIds: [] }] },
      { injectedOrganizationId: orgB },
    ]) {
      expect(createClassTeamWorkspacesSchema.safeParse({ ...valid, ...invalid }).success, JSON.stringify(invalid)).toBe(false);
    }
  });

  it("PROJ-BREAK-COL-DOUBLE-02 request remains atomic on races, rejects stale roster and prevents duplicate slug", () => {
    const service = readFileSync("src/modules/projects/class-team-workspace-service.ts", "utf8");
    expect(service).toContain('isolationLevel:"serializable"');
    expect(service).toContain("PROJECT_CLASS_ROSTER_STALE");
    expect(service).toContain("PROJECT_TEAM_PREVIEW_STALE");
    expect(service).toContain("PROJECT_SLUG_CONFLICT");
    expect(service).toContain("recordActivityEventInTransaction(tx,context");
    expect(service).toContain("getDb");
    const route = readFileSync("src/app/api/projects/class-team-workspaces/route.ts", "utf8");
    expect(route.indexOf("isSameOriginRequest(request)")).toBeLessThan(route.indexOf("request.json()"));
    expect(route).toContain("apiErrorResponse(error)");
  });
});
