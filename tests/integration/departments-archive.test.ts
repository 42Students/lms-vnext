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
import {
  archiveDepartment,
  createDepartment,
  listDepartments,
  resolveDepartmentUsage,
} from "@/modules/departments/service";
import { DepartmentHasDependenciesError } from "@/modules/departments/archive-policy";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

const admin: RequestContext = {
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

const prefix = "Integration Archive Guard";

async function cleanup() {
  await pool.query(
    `update faculty_profiles
        set primary_department_id = $1
      where membership_id = $2
        and primary_department_id in (
          select id
          from departments
          where name like $3
        )`,
    [
      SEED_IDS.departmentA,
      SEED_IDS.facultyCollegeAMembership,
      `${prefix}%`,
    ],
  );
  await pool.query(
    `delete from courses
      where department_id in (
        select id
        from departments
        where name like $1
      )`,
    [`${prefix}%`],
  );
  await pool.query(
    `delete from programs
      where department_id in (
        select id
        from departments
        where name like $1
      )`,
    [`${prefix}%`],
  );
  await pool.query(
    "delete from departments where name like $1",
    [`${prefix}%`],
  );
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("department archive dependencies", () => {
  it("counts real active dependencies and archives only after they are cleared", async () => {
    const department =
      await createDepartment(admin, {
        collegeId: SEED_IDS.collegeA,
        name: `${prefix} A`,
      });

    expect(
      await resolveDepartmentUsage(
        department.id,
      ),
    ).toEqual({
      programs: 0,
      faculty: 0,
      courses: 0,
    });

    await pool.query(
      `insert into programs
         (department_id, name, code, duration_terms)
       values ($1, 'Archive Program', 'ARCH-PROG', 8)`,
      [department.id],
    );
    await pool.query(
      `insert into courses
         (department_id, name, code)
       values ($1, 'Archive Course', 'ARCH-COURSE')`,
      [department.id],
    );
    await pool.query(
      `update faculty_profiles
          set primary_department_id = $1
        where membership_id = $2`,
      [
        department.id,
        SEED_IDS.facultyCollegeAMembership,
      ],
    );

    expect(
      await resolveDepartmentUsage(
        department.id,
      ),
    ).toEqual({
      programs: 1,
      faculty: 1,
      courses: 1,
    });

    await expect(
      archiveDepartment(
        admin,
        department.id,
      ),
    ).rejects.toMatchObject({
      usage: {
        programs: 1,
        faculty: 1,
        courses: 1,
      },
    } satisfies Partial<DepartmentHasDependenciesError>);

    await pool.query(
      `update programs
          set status = 'ARCHIVED'
        where department_id = $1`,
      [department.id],
    );
    await pool.query(
      `update courses
          set status = 'ARCHIVED'
        where department_id = $1`,
      [department.id],
    );
    await pool.query(
      `update faculty_profiles
          set primary_department_id = $1
        where membership_id = $2`,
      [
        SEED_IDS.departmentA,
        SEED_IDS.facultyCollegeAMembership,
      ],
    );

    const archived =
      await archiveDepartment(
        admin,
        department.id,
      );
    expect(archived.archivedAt).toBeInstanceOf(
      Date,
    );

    const visible = await listDepartments(
      admin,
      SEED_IDS.collegeA,
    );
    expect(
      visible.some(
        (item) => item.id === department.id,
      ),
    ).toBe(false);
  });
});
