import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import {
  createProjectInstanceInputSchema,
  projectInstanceIdSchema,
} from "@/modules/projects/validation";
import { tpoStudentProfileFacts } from "@/modules/placements/tpo-student-profile-facts";

const ORGANIZATION = "11111111-1111-4111-8111-111111111111";
const COLLEGE = "22222222-2222-4222-8222-222222222222";
const OTHER_COLLEGE = "33333333-3333-4333-8333-333333333333";
const OTHER_ORGANIZATION = "44444444-4444-4444-8444-444444444444";
const LEARNER = "55555555-5555-4555-8555-555555555555";

function tpoContext(
  options: {
    collegeId?: string;
    organizationId?: string;
    membershipStatus?: "ACTIVE" | "SUSPENDED";
    userStatus?: "ACTIVE" | "DISABLED";
    roles?: NonNullable<RequestContext["membership"]>["roles"];
  } = {},
): RequestContext {
  return {
    user: {
      id: "tpo-actor",
      identityUid: "tpo-test",
      platformStatus: options.userStatus ?? "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: "tpo-membership",
      collegeId: options.collegeId ?? COLLEGE,
      organizationId: options.organizationId ?? ORGANIZATION,
      status: options.membershipStatus ?? "ACTIVE",
      roles: options.roles ?? ["TPO"],
    },
  };
}

describe("PROJ-TPO-JOURNEY-01 permission and tenant boundaries", () => {
  const resource = { organizationId: ORGANIZATION, collegeId: COLLEGE };

  it("keeps TPO project visibility read-only, including repeated stale-tab attempts", () => {
    const tpo = tpoContext();
    expect(can(tpo, "projects.read", resource)).toBe(true);
    for (let retry = 0; retry < 3; retry += 1) {
      expect(can(tpo, "projects.manage", resource)).toBe(false);
      expect(can(tpo, "project-template.manage", resource)).toBe(false);
      expect(can(tpo, "project-template.assign", resource)).toBe(false);
    }
  });

  it("denies cross-college, cross-organization and inconsistent college/org scopes", () => {
    const tpo = tpoContext();
    expect(can(tpo, "projects.read", { ...resource, collegeId: OTHER_COLLEGE })).toBe(false);
    expect(can(tpo, "projects.read", { ...resource, organizationId: OTHER_ORGANIZATION })).toBe(false);
    expect(can(tpoContext({ collegeId: OTHER_COLLEGE }), "projects.read", resource)).toBe(false);
    expect(can(tpoContext({ organizationId: OTHER_ORGANIZATION }), "projects.read", resource)).toBe(false);
  });

  it("revokes a removed-role or expired-session actor without honoring an old tab", () => {
    expect(can(tpoContext({ membershipStatus: "SUSPENDED" }), "projects.read", resource)).toBe(false);
    expect(can(tpoContext({ roles: [] }), "projects.manage", resource)).toBe(false);
    expect(can(tpoContext({ roles: [] }), "placements.manage", resource)).toBe(false);
    expect(can(tpoContext({ userStatus: "DISABLED" }), "projects.read", resource)).toBe(false);
    expect(can(null, "projects.read", resource)).toBe(false);
    expect(can(undefined, "projects.manage", resource)).toBe(false);
  });
});

describe("PROJ-TPO-JOURNEY-02 malicious and malformed project input", () => {
  it("refuses malformed project IDs before any service can query by ID", () => {
    for (const bad of ["", "../other-college", "not-a-uuid", "<script>alert(1)</script>"]) {
      expect(projectInstanceIdSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("rejects a duplicate learner, missing mentor or foreign action field at the schema boundary", () => {
    const base = {
      collegeId: COLLEGE,
      templateId: "66666666-6666-4666-8666-666666666666",
      slug: "iot-2026",
      title: "Project",
      sectionId: "77777777-7777-4777-8777-777777777777",
      primaryMentorMembershipId: "88888888-8888-4888-8888-888888888888",
      initialStatus: "ACTIVE" as const,
      learnerMembershipIds: [LEARNER],
    };
    expect(createProjectInstanceInputSchema.safeParse(base).success).toBe(true);
    expect(createProjectInstanceInputSchema.safeParse({ ...base, learnerMembershipIds: [LEARNER, LEARNER] }).success).toBe(false);
    expect(createProjectInstanceInputSchema.safeParse({ ...base, primaryMentorMembershipId: undefined }).success).toBe(false);
    expect(createProjectInstanceInputSchema.safeParse({ ...base, action: "DELETE_ALL" }).success).toBe(false);
    expect(createProjectInstanceInputSchema.safeParse({ ...base, learnerMembershipIds: Array(501).fill(LEARNER) }).success).toBe(false);
  });

  it("does not expose project content, free-text notes or raw contact from TPO student profile aggregates", () => {
    const facts = tpoStudentProfileFacts({
      projects: [{ title: "Private title", link: "https://private.example.com", notes: "Secret" }],
      skills: [{ name: "Java" }],
      contactDetails: { phone: "+91 98765 43210" },
      socialProfiles: { githubUrl: "javascript:alert(1)" },
    });
    expect(facts.projects).toBe(1);
    expect(facts.phoneMasked).toBe("••••3210");
    expect(facts.github).toBeNull();
    expect(JSON.stringify(facts)).not.toContain("Private title");
    expect(JSON.stringify(facts)).not.toContain("Secret");
    expect(JSON.stringify(facts)).not.toContain("98765");
  });
});
