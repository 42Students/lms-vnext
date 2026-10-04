import { describe, expect, it } from "vitest";
import type { MembershipRole } from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";
import {
  getShellNavigation,
  getShellRoleLabel,
} from "@/components/shell/shell-model";

function context(
  roles: readonly MembershipRole[] | null,
  systemRoles: RequestContext["user"]["systemRoles"] = [],
): RequestContext {
  return {
    user: {
      id: "user-1",
      identityUid: "identity-1",
      platformStatus: "ACTIVE",
      systemRoles,
    },
    membership: roles
      ? {
          id: "membership-1",
          collegeId: "college-1",
          organizationId: "organization-1",
          status: "ACTIVE",
          roles,
        }
      : null,
  };
}

describe("authenticated shell model", () => {
  it("gives SUPER_ADMIN the platform administration navigation", () => {
    const shellContext = context(null, ["SUPER_ADMIN"]);

    expect(
      getShellNavigation(shellContext).map((item) => item.label),
    ).toEqual([
      "Dashboard",
      "Organizations",
      "Colleges",
      "Departments",
      "Academics",
      "Courses",
      "Projects",
      "Placements",
      "People",
      "Domains",
      "Activity",
    ]);
    expect(getShellRoleLabel(shellContext)).toBe("Super Admin");
  });

  it("keeps College Admin navigation tenant-focused", () => {
    const shellContext = context(["COLLEGE_ADMIN"]);

    expect(
      getShellNavigation(shellContext).map((item) => item.label),
    ).toEqual([
      "Dashboard",
      "My College",
      "Departments",
      "Academics",
      "Courses",
      "Projects",
      "Placements",
      "People",
      "Domains",
      "Activity",
    ]);
    expect(getShellRoleLabel(shellContext)).toBe("College Admin");
  });

  it("gives learners their Course workspace without admin navigation", () => {
    const shellContext = context(["LEARNER"]);

    expect(getShellNavigation(shellContext)).toEqual([
      {
        label: "Dashboard",
        href: "/dashboard",
        shortLabel: "D",
      },
      {
        label: "My Courses",
        href: "/learn/courses",
        shortLabel: "C",
      },
      {
        label: "My Projects",
        href: "/learn/projects",
        shortLabel: "P",
      },
      {
        label: "Placements",
        href: "/learn/placements",
        shortLabel: "P",
      },
    ]);
    expect(getShellRoleLabel(shellContext)).toBe(
      "Learner",
    );
    expect(
      getShellNavigation(shellContext).some(
        (item) =>
          item.href === "/activity",
      ),
    ).toBe(false);
  });

  it("gives faculty teaching navigation without admin navigation", () => {
    const shellContext = context(["FACULTY", "MENTOR"]);

    expect(getShellNavigation(shellContext)).toEqual([
      {
        label: "Dashboard",
        href: "/dashboard",
        shortLabel: "D",
      },
      {
        label: "Teaching Courses",
        href: "/teach/courses",
        shortLabel: "T",
      },
      {
        label: "Mentoring Projects",
        href: "/mentor/projects",
        shortLabel: "P",
      },
    ]);
    expect(getShellRoleLabel(shellContext)).toBe(
      "Faculty · Mentor",
    );
  });

  it("keeps College Admin workspaces additive for faculty and mentor roles", () => {
    const shellContext = context([
      "COLLEGE_ADMIN",
      "FACULTY",
      "MENTOR",
    ]);

    expect(
      getShellNavigation(shellContext).map(
        (item) => item.label,
      ),
    ).toEqual([
      "Dashboard",
      "Teaching Courses",
      "Mentoring Projects",
      "My College",
      "Departments",
      "Academics",
      "Courses",
      "Projects",
      "Placements",
      "People",
      "Domains",
      "Activity",
    ]);
    expect(getShellRoleLabel(shellContext)).toBe(
      "College Admin · Faculty · Mentor",
    );
  });

  it("keeps both learner and faculty Course entry points for a dual-role membership", () => {
    const shellContext = context([
      "LEARNER",
      "FACULTY",
    ]);

    expect(
      getShellNavigation(shellContext).map(
        (item) => item.label,
      ),
    ).toEqual([
      "Dashboard",
      "My Courses",
      "My Projects",
      "Placements",
      "Teaching Courses",
    ]);
  });
  it("gives recruiter-only identities the shared hiring workspace without a fake membership", () => {
    const shellContext: RequestContext = {
      ...context(null),
      recruiter: {
        userId: "recruiter-1",
        companyId: "company-1",
        companyName: "Example Employer",
        title: "Talent Partner",
        status: "ACTIVE",
        grants: [
          {
            id: "grant-1",
            organizationId: "organization-1",
            collegeId: "college-1",
            collegeName: "College One",
            companyRelationshipId:
              "relationship-1",
          },
        ],
      },
    };

    expect(getShellNavigation(shellContext)).toEqual([
      {
        label: "Dashboard",
        href: "/dashboard",
        shortLabel: "D",
      },
      {
        label: "Hiring Workspace",
        href: "/hr/placements",
        shortLabel: "H",
      },
    ]);
    expect(getShellRoleLabel(shellContext)).toBe(
      "Employer Recruiter",
    );
  });

  it("gives TPO memberships the placement command center", () => {
    const shellContext = context(["FACULTY", "TPO"]);

    expect(
      getShellNavigation(shellContext).map(
        (item) => item.label,
      ),
    ).toEqual([
      "Dashboard",
      "Teaching Courses",
      "Placement Operations",
    ]);
    expect(getShellRoleLabel(shellContext)).toBe(
      "Faculty · TPO",
    );
  });

});
