import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { drizzleProfileRepository } from "@/modules/people/profile-repository";
import {
  getFacultyProfile,
  getLearnerProfile,
  upsertFacultyProfile,
} from "@/modules/people/profile-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

const superAdmin: RequestContext = {
  user: {
    id: "integration-superadmin",
    identityUid: "integration-superadmin-identity",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

const collegeAAdmin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
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

async function cleanupCollegeBFacultyProfile() {
  await pool.query(
    "delete from faculty_profiles where membership_id = $1",
    [SEED_IDS.facultyCollegeBMembership],
  );
}

beforeEach(async () => {
  await cleanupCollegeBFacultyProfile();
});

afterAll(async () => {
  await cleanupCollegeBFacultyProfile();
  await pool.end();
  await closeDatabaseConnection();
});

describe("learner and faculty profiles against PostgreSQL", () => {
  it("loads the deterministic learner profile through the authorized service", async () => {
    const profile = await getLearnerProfile(
      superAdmin,
      SEED_IDS.learnerCollegeAMembership,
      drizzleProfileRepository,
    );

    expect(profile).toMatchObject({
      membershipId: SEED_IDS.learnerCollegeAMembership,
      rollNumber: "SEED-L-001",
      registrationNumber: "SEED-REG-001",
    });
  });

  it("persists a faculty profile only with a department from its own college", async () => {
    const created = await upsertFacultyProfile(
      superAdmin,
      SEED_IDS.facultyCollegeBMembership,
      {
        primaryDepartmentId: SEED_IDS.departmentB,
        employmentType: "VISITING",
        academicTitle: "Industry Mentor",
      },
      drizzleProfileRepository,
    );

    expect(created).toMatchObject({
      membershipId: SEED_IDS.facultyCollegeBMembership,
      primaryDepartmentId: SEED_IDS.departmentB,
      employmentType: "VISITING",
      academicTitle: "Industry Mentor",
    });

    const loaded = await getFacultyProfile(
      superAdmin,
      SEED_IDS.facultyCollegeBMembership,
      drizzleProfileRepository,
    );
    expect(loaded).toMatchObject({
      membershipId: SEED_IDS.facultyCollegeBMembership,
      primaryDepartmentId: SEED_IDS.departmentB,
    });

    await expect(
      upsertFacultyProfile(
        superAdmin,
        SEED_IDS.facultyCollegeBMembership,
        {
          primaryDepartmentId: SEED_IDS.departmentA,
          employmentType: "VISITING",
        },
        drizzleProfileRepository,
      ),
    ).rejects.toMatchObject({
      code: "DEPARTMENT_NOT_FOUND",
    });

    const unchanged = await getFacultyProfile(
      superAdmin,
      SEED_IDS.facultyCollegeBMembership,
      drizzleProfileRepository,
    );
    expect(unchanged?.primaryDepartmentId).toBe(
      SEED_IDS.departmentB,
    );
  });

  it("blocks a College A admin from mutating a College B faculty profile", async () => {
    await expect(
      upsertFacultyProfile(
        collegeAAdmin,
        SEED_IDS.facultyCollegeBMembership,
        {
          primaryDepartmentId: SEED_IDS.departmentB,
          employmentType: "FULL_TIME",
        },
        drizzleProfileRepository,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);

    const result = await pool.query(
      "select membership_id from faculty_profiles where membership_id = $1",
      [SEED_IDS.facultyCollegeBMembership],
    );
    expect(result.rowCount).toBe(0);
  });
});
