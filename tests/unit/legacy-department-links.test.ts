import { describe, expect, it } from "vitest";
import {
  legacyDepartmentDestination,
  legacyProgramDestination,
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
      user: {
        ...collegeAdmin.user, systemRoles: ["SUPER_ADMIN"],
      },
    }, "SUPER_ADMIN")).toBe("/admin/departments");
    expect(legacyDepartmentDestination({
      ...collegeAdmin,
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
      user: { ...collegeAdmin.user, systemRoles: ["SUPER_ADMIN"] },
    }, "SUPER_ADMIN")).toBe("/admin/programs");
    expect(legacyProgramDestination({
      ...collegeAdmin,
      membership: { ...collegeAdmin.membership!, status: "SUSPENDED" },
    }, "COLLEGE_ADMIN")).toBe("/dashboard");
  });

});
