import { describe, expect, it } from "vitest";
import {
  legacyDepartmentDestination,
  legacyProgramDestination,
  legacyAdminBookmarkHref,
} from "@/modules/admin-ui/legacy-department-links";
import type { RequestContext } from "@/modules/identity/context";

const collegeAdmin: RequestContext = {
  user: {
    id: "user-a", identityUid: "a",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: "membership-a",
    collegeId: "college-a",
    organizationId: "org-a",
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

describe("Legacy Admin bookmark query safety", () => {
  it("keeps bounded Super Admin program directory filters", () => {
    expect(legacyAdminBookmarkHref("/admin/programs", {
      q: "  data science  ", page: "3", pageSize: "25",
      collegeId: "foreign-college", redirect: "https://external.example",
    })).toBe("/admin/programs?page=3&pageSize=25&q=data+science");
  });
  it("does not retain forbidden or malformed query state", () => {
    expect(legacyAdminBookmarkHref("/admin/programs", {
      q: "x".repeat(101), page: "0", pageSize: "500",
      organizationId: "foreign-org", returnTo: "//external.example",
    })).toBe("/admin/programs");
    expect(legacyAdminBookmarkHref("/admin/departments", {
      type: "program", collegeId: "forged", page: "40",
    })).toBe("/admin/departments?type=program");
    expect(legacyAdminBookmarkHref("/dashboard", {type: "program", q: "foo"}))
      .toBe("/dashboard");
  });
  it("rejects duplicate query values from legacy bookmarks", () => {
    expect(legacyAdminBookmarkHref("/admin/programs", {page: ["1", "2"]}))
      .toBe("/admin/programs");
    expect(legacyAdminBookmarkHref("/admin/departments", {type: ["department", "program"]}))
      .toBe("/admin/departments");
  });
});

describe("legacy College/Super Admin Department bookmarks", () => {
  it("redirects College Admin to the actual college-scoped page", () => {
    expect(legacyDepartmentDestination(collegeAdmin, "COLLEGE_ADMIN"))
      .toBe("/college/departments");
  });

  it("denies learners, suspended memberships and suspended users", () => {
    expect(legacyDepartmentDestination({
      ...collegeAdmin,
      membership: { ...collegeAdmin.membership!, roles: ["LEARNER"] },
    }, "COLLEGE_ADMIN")).toBe("/dashboard");

    expect(legacyDepartmentDestination({
      ...collegeAdmin,
      membership: { ...collegeAdmin.membership!, status: "SUSPENDED" },
    }, "COLLEGE_ADMIN")).toBe("/dashboard");

    expect(legacyDepartmentDestination({
      ...collegeAdmin,
      user: { ...collegeAdmin.user, platformStatus: "DISABLED" },
    }, "COLLEGE_ADMIN")).toBe("/dashboard");
  });

  it("denies non-global roles from the legacy Super Admin bookmark", () => {
    expect(legacyDepartmentDestination(collegeAdmin, "SUPER_ADMIN"))
      .toBe("/dashboard");
    expect(legacyDepartmentDestination({
      ...collegeAdmin,
      membership: null,
      user: {
        
...collegeAdmin.user, systemRoles: ["SUPER_ADMIN"],
      },
    }, "SUPER_ADMIN")).toBe("/admin/departments");
    expect(legacyDepartmentDestination({
      ...collegeAdmin,
      membership: null,
      user: {
        
...collegeAdmin.user, systemRoles: ["SUPER_ADMIN"],
        platformStatus: "DISABLED",
      },
    }, "SUPER_ADMIN")).toBe("/dashboard");
  });
  it("preserves Programs bookmarks without widening admin roles", () => {
    expect(legacyProgramDestination(collegeAdmin, "COLLEGE_ADMIN"))
      .toBe("/college/programs");
    expect(legacyProgramDestination(collegeAdmin, "SUPER_ADMIN"))
      .toBe("/dashboard");
    expect(legacyProgramDestination({
      ...collegeAdmin,
      membership: null,
      user: { 
...collegeAdmin.user, systemRoles: ["SUPER_ADMIN"] },
    }, "SUPER_ADMIN")).toBe("/admin/programs");
    expect(legacyProgramDestination({
      ...collegeAdmin,
      membership: { ...collegeAdmin.membership!, status: "SUSPENDED" },
    }, "COLLEGE_ADMIN")).toBe("/dashboard");
  });

});
