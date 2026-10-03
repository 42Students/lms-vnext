import { describe, expect, it } from "vitest";
import {
  AuthorizationError,
  can,
  requirePermission,
} from "@/modules/permissions/policy";
import type {
  MembershipRole,
} from "@/modules/identity/constants";
import type {
  ActiveMembership,
  RequestContext,
} from "@/modules/identity/context";

const baseUser = {
  id: "user-1",
  identityUid: "identity-1",
  platformStatus: "ACTIVE" as const,
  systemRoles: [] as const,
};

function memberContext(
  roles: readonly MembershipRole[],
  overrides: Partial<ActiveMembership> = {},
): RequestContext {
  return {
    user: baseUser,
    membership: {
      id: "membership-1",
      collegeId: "college-1",
      organizationId: "org-1",
      status: "ACTIVE",
      roles,
      ...overrides,
    },
  };
}

describe("platform authorization policy", () => {
  it("fails closed for missing or disabled identity", () => {
    expect(can(null, "college.read", { collegeId: "college-1" })).toBe(false);

    expect(
      can(
        {
          user: { ...baseUser, platformStatus: "DISABLED" },
          membership: null,
        },
        "college.read",
        { collegeId: "college-1" },
      ),
    ).toBe(false);
  });

  it("allows an active member to read only their college", () => {
    const context = memberContext(["FACULTY"]);

    expect(can(context, "department.read", { collegeId: "college-1" })).toBe(
      true,
    );
    expect(can(context, "department.read", { collegeId: "college-2" })).toBe(
      false,
    );
  });

  it("allows only an unscoped SUPER_ADMIN to manage global system roles", () => {
    const unscoped: RequestContext = {
      user: { ...baseUser, systemRoles: ["SUPER_ADMIN"] },
      membership: null,
      adminScope: null,
    };
    const collegeScoped: RequestContext = {
      ...unscoped,
      adminScope: { organizationId: "org-1", collegeId: "college-1" },
    };
    const organizationScoped: RequestContext = {
      ...unscoped,
      adminScope: { organizationId: "org-1", collegeId: null },
    };

    expect(can(unscoped, "system-role.manage")).toBe(true);
    expect(can(collegeScoped, "system-role.manage")).toBe(false);
    expect(can(organizationScoped, "system-role.manage")).toBe(false);
    expect(can(memberContext(["COLLEGE_ADMIN"]), "system-role.manage")).toBe(false);
  });

  it("lets SUPER_ADMIN change the safety scope even while scoped", () => {
    const scoped: RequestContext = {
      user: { ...baseUser, systemRoles: ["SUPER_ADMIN"] },
      membership: null,
      adminScope: {
        organizationId: "org-1",
        collegeId: "college-1",
      },
    };

    expect(can(scoped, "admin-scope.select")).toBe(true);
    expect(
      can(memberContext(["COLLEGE_ADMIN"]), "admin-scope.select"),
    ).toBe(false);
  });

  it("requires COLLEGE_ADMIN for tenant mutations", () => {
    const faculty = memberContext(["FACULTY"]);
    const admin = memberContext(["FACULTY", "COLLEGE_ADMIN"]);

    expect(
      can(faculty, "department.manage", { collegeId: "college-1" }),
    ).toBe(false);
    expect(can(admin, "department.manage", { collegeId: "college-1" })).toBe(
      true,
    );
    expect(can(admin, "department.manage", { collegeId: "college-2" })).toBe(
      false,
    );
  });

  it("keeps academics readable to same-college members but mutable only by College Admin", () => {
    const ownCollege = {
      organizationId: "org-1",
      collegeId: "college-1",
    };
    const otherCollege = {
      organizationId: "org-2",
      collegeId: "college-2",
    };

    expect(
      can(memberContext(["LEARNER"]), "academics.read", ownCollege),
    ).toBe(true);
    expect(
      can(memberContext(["FACULTY"]), "academics.read", ownCollege),
    ).toBe(true);
    expect(
      can(memberContext(["MENTOR"]), "academics.read", ownCollege),
    ).toBe(true);
    expect(
      can(memberContext(["TPO"]), "academics.read", ownCollege),
    ).toBe(true);
    expect(
      can(memberContext(["FACULTY"]), "academics.manage", ownCollege),
    ).toBe(false);
    expect(
      can(
        memberContext(["COLLEGE_ADMIN"]),
        "academics.manage",
        ownCollege,
      ),
    ).toBe(true);
    expect(
      can(
        memberContext(["COLLEGE_ADMIN"]),
        "academics.manage",
        otherCollege,
      ),
    ).toBe(false);
  });

  it("keeps courses readable to same-college members but structural mutation admin-only", () => {
    const ownCollege = {
      organizationId: "org-1",
      collegeId: "college-1",
    };
    const otherCollege = {
      organizationId: "org-2",
      collegeId: "college-2",
    };

    expect(
      can(memberContext(["LEARNER"]), "courses.read", ownCollege),
    ).toBe(true);
    expect(
      can(memberContext(["FACULTY"]), "courses.read", ownCollege),
    ).toBe(true);
    expect(
      can(memberContext(["FACULTY"]), "courses.manage", ownCollege),
    ).toBe(false);
    expect(
      can(
        memberContext(["COLLEGE_ADMIN"]),
        "courses.manage",
        ownCollege,
      ),
    ).toBe(true);
    expect(
      can(
        memberContext(["COLLEGE_ADMIN"]),
        "courses.manage",
        otherCollege,
      ),
    ).toBe(false);
  });

  it("keeps project workspace access tenant-scoped and admin mutations centralized", () => {
    const ownCollege = {
      organizationId: "org-1",
      collegeId: "college-1",
    };
    const otherCollege = {
      organizationId: "org-2",
      collegeId: "college-2",
    };

    expect(
      can(memberContext(["LEARNER"]), "projects.read", ownCollege),
    ).toBe(true);
    expect(
      can(memberContext(["MENTOR"]), "projects.read", ownCollege),
    ).toBe(true);
    expect(
      can(memberContext(["FACULTY"]), "projects.manage", ownCollege),
    ).toBe(false);
    expect(
      can(
        memberContext(["COLLEGE_ADMIN"]),
        "projects.manage",
        ownCollege,
      ),
    ).toBe(true);
    expect(
      can(
        memberContext(["COLLEGE_ADMIN"]),
        "projects.manage",
        otherCollege,
      ),
    ).toBe(false);
  });

  it("keeps reusable Project template lifecycle platform-managed", () => {
    const unscoped: RequestContext = {
      user: {
        ...baseUser,
        systemRoles: ["SUPER_ADMIN"],
      },
      membership: null,
      adminScope: null,
    };
    const collegeScoped: RequestContext = {
      ...unscoped,
      adminScope: {
        organizationId: "org-1",
        collegeId: "college-1",
      },
    };

    expect(can(unscoped, "project-template.manage")).toBe(true);
    expect(
      can(collegeScoped, "project-template.manage"),
    ).toBe(false);
    expect(
      can(collegeScoped, "project-template.assign", {
        organizationId: "org-1",
        collegeId: "college-1",
      }),
    ).toBe(true);
    expect(
      can(collegeScoped, "project-template.assign", {
        organizationId: "org-2",
        collegeId: "college-2",
      }),
    ).toBe(false);
    expect(
      can(
        memberContext(["COLLEGE_ADMIN"]),
        "project-template.manage",
      ),
    ).toBe(false);
    expect(
      can(
        memberContext(["COLLEGE_ADMIN"]),
        "project-template.assign",
        {
          organizationId: "org-1",
          collegeId: "college-1",
        },
      ),
    ).toBe(false);
  });

  it("centralizes people management on college-admin tenant scope", () => {
    const target = {
      organizationId: "org-1",
      collegeId: "college-1",
    };

    expect(can(memberContext(["COLLEGE_ADMIN"]), "people.manage", target)).toBe(
      true,
    );
    expect(can(memberContext(["FACULTY"]), "people.manage", target)).toBe(false);
    expect(can(memberContext(["MENTOR"]), "people.manage", target)).toBe(false);
    expect(can(memberContext(["TPO"]), "people.manage", target)).toBe(false);
    expect(can(memberContext(["LEARNER"]), "people.manage", target)).toBe(false);
    expect(
      can(memberContext(["COLLEGE_ADMIN"]), "people.manage", {
        organizationId: "org-2",
        collegeId: "college-2",
      }),
    ).toBe(false);
  });

  it("centralizes membership role and lifecycle mutations", () => {
    const ownCollege = {
      organizationId: "org-1",
      collegeId: "college-1",
    };
    const otherCollege = {
      organizationId: "org-2",
      collegeId: "college-2",
    };
    const admin = memberContext(["COLLEGE_ADMIN"]);
    const faculty = memberContext(["FACULTY"]);

    expect(can(admin, "membership.role.manage", ownCollege)).toBe(true);
    expect(can(admin, "membership.lifecycle.manage", ownCollege)).toBe(true);
    expect(can(admin, "membership.role.manage", otherCollege)).toBe(false);
    expect(can(admin, "membership.lifecycle.manage", otherCollege)).toBe(false);
    expect(can(faculty, "membership.role.manage", ownCollege)).toBe(false);
    expect(can(faculty, "membership.lifecycle.manage", ownCollege)).toBe(false);
  });

  it("blocks suspended memberships", () => {
    const context = memberContext(["COLLEGE_ADMIN"], {
      status: "SUSPENDED",
    });

    expect(can(context, "college.read", { collegeId: "college-1" })).toBe(
      false,
    );
    expect(can(context, "people.manage", { collegeId: "college-1" })).toBe(
      false,
    );
    expect(
      can(context, "membership.role.manage", { collegeId: "college-1" }),
    ).toBe(false);
  });

  it("models super admin as a real global role without a membership", () => {
    const context: RequestContext = {
      user: {
        ...baseUser,
        systemRoles: ["SUPER_ADMIN"],
      },
      membership: null,
    };

    expect(
      can(context, "organization.manage", { organizationId: "org-99" }),
    ).toBe(true);
    expect(can(context, "department.manage", { collegeId: "college-99" })).toBe(
      true,
    );
    expect(
      can(context, "people.manage", {
        organizationId: "org-99",
        collegeId: "college-99",
      }),
    ).toBe(true);
    expect(
      can(context, "membership.lifecycle.manage", {
        organizationId: "org-99",
        collegeId: "college-99",
      }),
    ).toBe(true);
  });

  it("uses selected superadmin scope as a safety rail", () => {
    const context: RequestContext = {
      user: {
        ...baseUser,
        systemRoles: ["SUPER_ADMIN"],
      },
      membership: null,
      adminScope: {
        organizationId: "org-1",
        collegeId: "college-1",
      },
    };

    expect(
      can(context, "department.manage", {
        organizationId: "org-1",
        collegeId: "college-1",
      }),
    ).toBe(true);

    expect(
      can(context, "people.manage", {
        organizationId: "org-1",
        collegeId: "college-1",
      }),
    ).toBe(true);

    expect(
      can(context, "membership.role.manage", {
        organizationId: "org-1",
        collegeId: "college-1",
      }),
    ).toBe(true);

    expect(
      can(context, "department.manage", {
        organizationId: "org-2",
        collegeId: "college-2",
      }),
    ).toBe(false);

    expect(
      can(context, "people.manage", {
        organizationId: "org-2",
        collegeId: "college-2",
      }),
    ).toBe(false);

    expect(
      can(context, "membership.role.manage", {
        organizationId: "org-2",
        collegeId: "college-2",
      }),
    ).toBe(false);
  });

  it("throws through the require helper when authorization fails", () => {
    const context = memberContext(["FACULTY"]);

    expect(() =>
      requirePermission(context, "department.manage", {
        collegeId: "college-1",
      }),
    ).toThrow(AuthorizationError);
  });
});
