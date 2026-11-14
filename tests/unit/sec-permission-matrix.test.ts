import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { PLATFORM_PERMISSIONS, can, type ResourceScope } from "@/modules/permissions/policy";

/**
 * The role matrix, generated from the policy itself: every permission, asked of every kind of actor, against a resource in
 * the actor's own college, in another college, and with no scope. The result is committed. Any change to who may do what
 * shows up as a diff in docs/security/baselines/permission-matrix.json and must be reviewed; regenerate deliberately with
 * UPDATE_GOLDEN=1.
 */
const GOLDEN = path.join(process.cwd(), "docs/security/baselines/permission-matrix.json");

const ORG = "org-a";
const COLLEGE = "college-a";
const OTHER_COLLEGE = "college-b";

const user = (over: Partial<RequestContext["user"]> = {}): RequestContext["user"] => ({
  id: "user-1",
  identityUid: "uid-1",
  platformStatus: "ACTIVE",
  systemRoles: [],
  ...over,
});
const member = (role: "LEARNER" | "FACULTY" | "COLLEGE_ADMIN" | "MENTOR" | "TPO"): RequestContext => ({
  user: user(),
  membership: { id: "m-1", collegeId: COLLEGE, organizationId: ORG, status: "ACTIVE", roles: [role] },
});

const ACTORS: Record<string, RequestContext | null> = {
  anonymous: null,
  disabledUser: { user: user({ platformStatus: "DISABLED" }), membership: { id: "m-1", collegeId: COLLEGE, organizationId: ORG, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] } },
  userWithoutMembership: { user: user(), membership: null },
  suspendedAdmin: { user: user(), membership: { id: "m-1", collegeId: COLLEGE, organizationId: ORG, status: "SUSPENDED", roles: ["COLLEGE_ADMIN"] } },
  superAdminGlobal: { user: user({ systemRoles: ["SUPER_ADMIN"] }), membership: null, adminScope: null },
  superAdminInCollege: { user: user({ systemRoles: ["SUPER_ADMIN"] }), membership: null, adminScope: { organizationId: ORG, collegeId: COLLEGE } },
  collegeAdmin: member("COLLEGE_ADMIN"),
  tpo: member("TPO"),
  faculty: member("FACULTY"),
  mentor: member("MENTOR"),
  learner: member("LEARNER"),
  multiRoleAdmin: { user: user(), membership: { id: "m-1", collegeId: COLLEGE, organizationId: ORG, status: "ACTIVE", roles: ["COLLEGE_ADMIN", "LEARNER"] } },
  recruiterWithGrant: {
    user: user(),
    membership: null,
    recruiter: {
      userId: "user-1", companyId: "c1", companyName: "Co", title: null, status: "ACTIVE",
      grants: [{ id: "g1", organizationId: ORG, collegeId: COLLEGE, collegeName: "A", companyRelationshipId: "rel-1" }],
    },
  },
};

const RESOURCES: Record<string, ResourceScope> = {
  ownCollege: { organizationId: ORG, collegeId: COLLEGE, placementCompanyRelationshipId: "rel-1" },
  otherCollege: { organizationId: ORG, collegeId: OTHER_COLLEGE, placementCompanyRelationshipId: "rel-1" },
  noScope: {},
  ownCollegeOtherLearner: { organizationId: ORG, collegeId: COLLEGE, learnerMembershipId: "someone-else" },
  ownCollegeTpoTeamAdmin: { organizationId: ORG, collegeId: COLLEGE, tpoTeamAdministrator: true, tpoVerificationAdministrator: true, tpoVerificationEnabled: true },
};

function generate() {
  const matrix: Record<string, Record<string, Record<string, boolean>>> = {};
  for (const permission of PLATFORM_PERMISSIONS) {
    matrix[permission] = {};
    for (const [actorName, actor] of Object.entries(ACTORS)) {
      matrix[permission]![actorName] = {};
      for (const [resourceName, resource] of Object.entries(RESOURCES)) {
        matrix[permission]![actorName]![resourceName] = can(actor, permission, resource);
      }
    }
  }
  return matrix;
}

describe("permission matrix generated from the policy", () => {
  it("matches the committed matrix exactly", () => {
    const actual = generate();
    if (process.env["UPDATE_GOLDEN"] === "1" || !existsSync(GOLDEN)) {
      mkdirSync(path.dirname(GOLDEN), { recursive: true });
      writeFileSync(GOLDEN, JSON.stringify(actual, null, 1) + "\n");
    }
    expect(actual).toEqual(JSON.parse(readFileSync(GOLDEN, "utf8")));
  });

  it("holds the invariants that must never be true", () => {
    const m = generate();
    for (const permission of PLATFORM_PERMISSIONS) {
      for (const resourceName of Object.keys(RESOURCES)) {
        for (const dead of ["anonymous", "disabledUser", "userWithoutMembership"] as const) {
          // identity.self.manage is the one permission any active signed-in user holds; recruiters are tested below.
          if (dead === "anonymous" || dead === "disabledUser" || permission !== "identity.self.manage") {
            expect(m[permission]![dead]![resourceName], `${permission} ${dead} ${resourceName}`).toBe(false);
          }
        }
        // A person acting in college A never holds a college permission on college B's resource.
        if (resourceName === "otherCollege" && permission !== "identity.self.manage" && permission !== "organization.read") {
          // organization.read is organization-wide by design: a college admin may read any college in their own organization.
          for (const actor of ["collegeAdmin", "tpo", "faculty", "mentor", "learner"] as const) {
            expect(m[permission]![actor]![resourceName], `${permission} ${actor} on another college`).toBe(false);
          }
        }
        // A suspended membership and a multi-role context hold nothing beyond self-service.
        for (const weak of ["suspendedAdmin", "multiRoleAdmin"] as const) {
          if (permission !== "identity.self.manage") expect(m[permission]![weak]![resourceName], `${permission} ${weak}`).toBe(false);
        }
      }
    }
  });

  it("recruiters hold only recruiter permissions, and only on a granted company relationship", () => {
    const m = generate();
    for (const permission of PLATFORM_PERMISSIONS) {
      const own = m[permission]!["recruiterWithGrant"]!["ownCollege"]!;
      const other = m[permission]!["recruiterWithGrant"]!["otherCollege"]!;
      const isRecruiterPermission = permission.startsWith("placements.recruiter.");
      if (permission === "identity.self.manage") continue;
      expect(own, permission).toBe(isRecruiterPermission);
      expect(other, permission).toBe(false);
    }
  });
});
