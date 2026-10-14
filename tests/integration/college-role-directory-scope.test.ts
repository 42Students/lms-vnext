import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listCollegeRoleDirectory } from "@/modules/people/college-role-directory-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled =
  Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB09_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });

const collegeAdmin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "college-directory-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

const facultyInCollegeB: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "college-directory-foreign",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY"],
  },
};

describe.skipIf(!enabled)("College Admin role directory PostgreSQL tenant/denial checks", () => {
  afterAll(async () => {
    await closeDatabaseConnection();
  });

  it("lists only the current college and never merges same-user faculty memberships across colleges", async () => {
    const faculty = await listCollegeRoleDirectory(collegeAdmin, "FACULTY", {});
    const students = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {});
    expect(faculty.items.map((row) => row.membershipId))
      .toContain(SEED_IDS.facultyCollegeAMembership);
    expect(faculty.items.map((row) => row.membershipId))
      .not.toContain(SEED_IDS.facultyCollegeBMembership);
    expect(students.items.map((row) => row.membershipId))
      .toContain(SEED_IDS.learnerCollegeAMembership);
    expect(students.items.map((row) => row.membershipId))
      .not.toContain(SEED_IDS.facultyCollegeBMembership);
  });

  it("denies a non-admin in another college before any directory read", async () => {
    for (const kind of ["FACULTY", "LEARNER"] as const) {
      await expect(listCollegeRoleDirectory(facultyInCollegeB, kind, {}))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });

  it("filters account lifecycle in both role directories without changing tenant scope", async () => {
    for (const kind of ["FACULTY", "LEARNER"] as const) {
      const active = await listCollegeRoleDirectory(collegeAdmin, kind, {accountStatus:"ACTIVE"});
      expect(active.items.every(row => row.userStatus === "ACTIVE")).toBe(true);
      expect(active.items.every(row => row.membershipId !== SEED_IDS.facultyCollegeBMembership)).toBe(true);
      const disabled = await listCollegeRoleDirectory(collegeAdmin, kind, {accountStatus:"DISABLED"});
      expect(disabled.items.every(row => row.userStatus === "DISABLED")).toBe(true);
      await expect(listCollegeRoleDirectory(facultyInCollegeB, kind, {accountStatus:"ACTIVE"}))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });
  it("partitions college learners by persisted active enrollment without mixing foreign memberships", async () => {
    const all = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {});
    const active = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {enrollment:"ACTIVE"});
    const none = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {enrollment:"NONE"});
    expect(active.total + none.total).toBe(all.total);
    expect(active.items.every(row => row.membershipId !== SEED_IDS.facultyCollegeBMembership)).toBe(true);
    await expect(listCollegeRoleDirectory(facultyInCollegeB, "LEARNER", {enrollment:"ACTIVE"}))
      .rejects.toBeInstanceOf(AuthorizationError);
    await expect(listCollegeRoleDirectory(collegeAdmin, "FACULTY", {enrollment:"NONE"}))
      .rejects.toThrow("FACULTY_ENROLLMENT_FILTER_UNSUPPORTED");
  });
  it("rejects forged college selection and out-of-bound page filters", async () => {
    for (const kind of ["FACULTY", "LEARNER"] as const) {
      await expect(listCollegeRoleDirectory(collegeAdmin, kind, {
        collegeId: SEED_IDS.collegeB,
      })).rejects.toBeDefined();
      await expect(listCollegeRoleDirectory(collegeAdmin, kind, {
        page: "999999",
      })).rejects.toBeDefined();
    }
  });

  it("returns an honest empty page without fabricated academic associations", async () => {
    const result = await listCollegeRoleDirectory(collegeAdmin, "LEARNER", {
      q: "no-such-student-w42-directory",
    });
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });
});
