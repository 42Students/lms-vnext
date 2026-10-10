import {
  describe,
  expect,
  it,
} from "vitest";
import {
  can,
  type PlatformPermission,
  type ResourceScope,
} from "@/modules/permissions/policy";
import type {
  MembershipRole,
} from "@/modules/identity/constants";
import type {
  RequestContext,
} from "@/modules/identity/context";

type Actor =
  | "superadmin"
  | "collegeAdmin"
  | "tpo"
  | "learner"
  | "faculty"
  | "mentor"
  | "recruiter";

const baseUser = {
  id: "permission-matrix-user",
  identityUid:
    "permission-matrix-identity",
  platformStatus: "ACTIVE" as const,
  systemRoles: [] as const,
};

const ownResource: ResourceScope = {
  organizationId: "org-1",
  collegeId: "college-1",
  placementCompanyRelationshipId:
    "relationship-1",
};

const otherResource: ResourceScope = {
  organizationId: "org-2",
  collegeId: "college-2",
  placementCompanyRelationshipId:
    "relationship-2",
};

function memberContext(
  roles: readonly MembershipRole[],
): RequestContext {
  return {
    user: baseUser,
    membership: {
      id: "membership-1",
      organizationId: "org-1",
      collegeId: "college-1",
      status: "ACTIVE",
      roles,
    },
  };
}

const contexts: Record<
  Actor,
  RequestContext
> = {
  superadmin: {
    user: {
      ...baseUser,
      systemRoles: ["SUPER_ADMIN"],
    },
    membership: null,
    adminScope: null,
  },
  collegeAdmin:
    memberContext(["COLLEGE_ADMIN"]),
  tpo: memberContext(["TPO"]),
  learner: memberContext(["LEARNER"]),
  faculty: memberContext(["FACULTY"]),
  mentor: memberContext(["MENTOR"]),
  recruiter: {
    user: baseUser,
    membership: null,
    recruiter: {
      userId: baseUser.id,
      companyId: "company-1",
      companyName: "Permission Matrix Co",
      title: "Recruiter",
      status: "ACTIVE",
      grants: [
        {
          id: "grant-1",
          organizationId: "org-1",
          collegeId: "college-1",
          collegeName: "College 1",
          companyRelationshipId:
            "relationship-1",
        },
      ],
    },
  },
};

const expectedOwnActors = {
  "admin-scope.select": [
    "superadmin",
  ],
  "organization.read": [
    "superadmin",
    "collegeAdmin",
  ],
  "organization.manage": [
    "superadmin",
  ],
  "college.read": [
    "superadmin",
    "collegeAdmin",
    "tpo",
    "learner",
    "faculty",
    "mentor",
  ],
  "college.manage": [
    "superadmin",
    "collegeAdmin",
  ],
  "department.read": [
    "superadmin",
    "collegeAdmin",
    "tpo",
    "learner",
    "faculty",
    "mentor",
  ],
  "department.manage": [
    "superadmin",
    "collegeAdmin",
  ],
  "academics.read": [
    "superadmin",
    "collegeAdmin",
    "tpo",
    "learner",
    "faculty",
    "mentor",
  ],
  "academics.manage": [
    "superadmin",
    "collegeAdmin",
  ],
  "courses.read": [
    "superadmin",
    "collegeAdmin",
    "tpo",
    "learner",
    "faculty",
    "mentor",
  ],
  "courses.manage": [
    "superadmin",
    "collegeAdmin",
  ],
  "projects.read": [
    "superadmin",
    "collegeAdmin",
    "tpo",
    "learner",
    "faculty",
    "mentor",
  ],
  "projects.manage": [
    "superadmin",
    "collegeAdmin",
  ],
  "placements.read": [
    "superadmin",
    "collegeAdmin",
    "tpo",
    "learner",
  ],
  "placements.manage": [
    "superadmin",
    "collegeAdmin",
    "tpo",
  ],
  "placements.recruiter.read": [
    "recruiter",
  ],
  "placements.recruiter.result.stage": [
    "recruiter",
  ],
  "activity.read": [
    "superadmin",
    "collegeAdmin",
  ],
  "project-template.manage": [
    "superadmin",
  ],
  "project-template.assign": [
    "superadmin",
  ],
  "people.manage": [
    "superadmin",
    "collegeAdmin",
  ],
  "profile.self.manage": [
    "learner",
    "faculty",
  ],
  "system-role.manage": [
    "superadmin",
  ],
  "membership.role.manage": [
    "superadmin",
    "collegeAdmin",
  ],
  "membership.lifecycle.manage": [
    "superadmin",
    "collegeAdmin",
  ],
} as const satisfies Record<
  PlatformPermission,
  readonly Actor[]
>;

const permissions =
  Object.keys(
    expectedOwnActors,
  ) as PlatformPermission[];

describe("platform permission matrix", () => {
  it("locks every declared permission to an explicit actor set", () => {
    for (const permission of permissions) {
      const allowed =
        expectedOwnActors[permission];

      for (const actor of Object.keys(
        contexts,
      ) as Actor[]) {
        expect(
          can(
            contexts[actor],
            permission,
            ownResource,
          ),
          `${actor} / ${permission}`,
        ).toBe(
          allowed.includes(
            actor as never,
          ),
        );
      }
    }
  });

  it("denies every membership permission when the resource crosses tenant scope", () => {
    const membershipActors: Actor[] = [
      "collegeAdmin",
      "tpo",
      "learner",
      "faculty",
      "mentor",
    ];

    for (const actor of membershipActors) {
      for (const permission of permissions) {
        if (
          !can(
            contexts[actor],
            permission,
            ownResource,
          )
        ) {
          continue;
        }

        expect(
          can(
            contexts[actor],
            permission,
            otherResource,
          ),
          `${actor} crossed tenant with ${permission}`,
        ).toBe(false);
      }
    }
  });

  it("requires the exact recruiter grant", () => {
    expect(
      can(
        contexts.recruiter,
        "placements.recruiter.read",
        ownResource,
      ),
    ).toBe(true);
    expect(
      can(
        contexts.recruiter,
        "placements.recruiter.result.stage",
        otherResource,
      ),
    ).toBe(false);
  });

  it("keeps globally privileged mutations unavailable while SUPER_ADMIN is tenant-scoped", () => {
    const scoped: RequestContext = {
      ...contexts.superadmin,
      adminScope: {
        organizationId: "org-1",
        collegeId: "college-1",
      },
    };

    expect(
      can(
        scoped,
        "system-role.manage",
        ownResource,
      ),
    ).toBe(false);
    expect(
      can(
        scoped,
        "project-template.manage",
        ownResource,
      ),
    ).toBe(false);

    expect(
      can(
        scoped,
        "project-template.assign",
        ownResource,
      ),
    ).toBe(true);
    expect(
      can(
        scoped,
        "project-template.assign",
        otherResource,
      ),
    ).toBe(false);
    expect(
      can(
        scoped,
        "admin-scope.select",
      ),
    ).toBe(true);
  });
});
