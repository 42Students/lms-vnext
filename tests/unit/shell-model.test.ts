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
      "People",
      "Domains",
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
      "People",
      "Domains",
    ]);
    expect(getShellRoleLabel(shellContext)).toBe("College Admin");
  });

  it("does not expose admin navigation to ordinary membership roles", () => {
    const shellContext = context(["FACULTY", "MENTOR"]);

    expect(getShellNavigation(shellContext)).toEqual([
      {
        label: "Dashboard",
        href: "/dashboard",
        shortLabel: "D",
      },
    ]);
    expect(getShellRoleLabel(shellContext)).toBe(
      "Faculty · Mentor",
    );
  });
});
