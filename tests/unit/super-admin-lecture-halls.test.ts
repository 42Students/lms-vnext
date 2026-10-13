import { describe, expect, it } from "vitest";
import { getShellNavigation } from "@/components/shell/shell-model";
import { can } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";

const user: RequestContext["user"] = {
  id: "synthetic-user",
  identityUid: "synthetic-super-admin",
  platformStatus: "ACTIVE",
  systemRoles: ["SUPER_ADMIN"],
};

function superAdmin(collegeId: string | null): RequestContext {
  return {
    user,
    membership: null,
    adminScope: {
      organizationId: "synthetic-organization",
      collegeId,
    },
  };
}

describe("Super Admin lecture halls surface", () => {
  it("has one platform sidebar route, while College Admin keeps its own route", () => {
    const platform = getShellNavigation(superAdmin("college-a"));
    expect(
      platform.filter((item) => item.href === "/admin/lecture-halls"),
    ).toEqual([
      { label: "Lecture Halls", href: "/admin/lecture-halls", shortLabel: "L" },
    ]);
    expect(platform.some((item) => item.href === "/college/lecture-halls")).toBe(false);

    const collegeContext: RequestContext = {
      user: { ...user, systemRoles: [] },
      membership: {
        id: "member-a",
        collegeId: "college-a",
        organizationId: "synthetic-organization",
        status: "ACTIVE",
        roles: ["COLLEGE_ADMIN"],
      },
    };
    const collegeNav = getShellNavigation(collegeContext);
    expect(collegeNav.some((item) => item.href === "/college/lecture-halls")).toBe(true);
    expect(collegeNav.some((item) => item.href === "/admin/lecture-halls")).toBe(false);
  });

  it("central authorization accepts the selected college and rejects another", () => {
    const scoped = superAdmin("college-a");
    expect(can(scoped, "academics.manage", {
      organizationId: "synthetic-organization",
      collegeId: "college-a",
    })).toBe(true);
    expect(can(scoped, "academics.manage", {
      organizationId: "synthetic-organization",
      collegeId: "college-b",
    })).toBe(false);
  });
});
