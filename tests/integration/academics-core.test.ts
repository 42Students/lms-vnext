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
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  archiveProgram,
  createProgram,
  listPrograms,
  updateProgram,
} from "@/modules/academics/program-service";
import {
  createAcademicPeriod,
  listAcademicPeriods,
  transitionAcademicPeriod,
  updateAcademicPeriod,
} from "@/modules/academics/period-service";
import {
  createCohort,
  listCohorts,
  transitionCohort,
} from "@/modules/academics/cohort-service";
import {
  archiveSection,
  createSection,
  listSections,
  updateSection,
} from "@/modules/academics/section-service";
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

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

const collegeAdmin: RequestContext = {
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

const faculty: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "MENTOR"],
  },
};

async function cleanupAcademics() {
  await pool.query(
    `delete from sections
     where cohort_id in (
       select c.id
       from cohorts c
       join programs p on p.id = c.program_id
       where p.code like 'A1-%'
     )`,
  );
  await pool.query(
    `delete from cohorts
     where program_id in (
       select id from programs where code like 'A1-%'
     )`,
  );
  await pool.query(
    "delete from programs where code like 'A1-%'",
  );
  await pool.query(
    "delete from academic_periods where code like 'A1-%'",
  );
}

beforeEach(async () => {
  await cleanupAcademics();
});

afterAll(async () => {
  await cleanupAcademics();
  await pool.end();
  await closeDatabaseConnection();
});

describe("academics A1 against PostgreSQL", () => {
  it("builds the Program -> Period -> Cohort -> Section hierarchy", async () => {
    const program = await createProgram(
      collegeAdmin,
      {
        departmentId: SEED_IDS.departmentA,
        name: "A1 Computer Science Engineering",
        code: "A1-CSE",
        durationTerms: 8,
      },
    );

    const updatedProgram = await updateProgram(
      collegeAdmin,
      program.id,
      {
        name: "A1 Computer Science",
        durationTerms: 8,
      },
    );

    expect(updatedProgram.name).toBe(
      "A1 Computer Science",
    );

    const period1 = await createAcademicPeriod(
      collegeAdmin,
      {
        collegeId: SEED_IDS.collegeA,
        name: "A1 Semester 1",
        code: "A1-2026-S1",
        startDate: "2026-07-01",
        endDate: "2026-12-15",
      },
    );
    const period2 = await createAcademicPeriod(
      collegeAdmin,
      {
        collegeId: SEED_IDS.collegeA,
        name: "A1 Semester 2",
        code: "A1-2027-S2",
        startDate: "2027-01-05",
        endDate: "2027-05-31",
      },
    );

    await updateAcademicPeriod(
      collegeAdmin,
      period2.id,
      {
        name: "A1 Spring Semester",
      },
    );

    const cohort = await createCohort(
      collegeAdmin,
      {
        programId: program.id,
        name: "A1 2026 Intake",
        code: "A1-2026",
        startPeriodId: period1.id,
        expectedEndPeriodId: period2.id,
      },
    );

    const section = await createSection(
      collegeAdmin,
      {
        cohortId: cohort.id,
        academicPeriodId: period1.id,
        name: "A1 Section A",
        code: "A1-A",
        capacity: 60,
      },
    );

    await expect(
      listPrograms(
        collegeAdmin,
        SEED_IDS.collegeA,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: program.id,
          departmentId: SEED_IDS.departmentA,
          code: "A1-CSE",
        }),
      ]),
    );

    await expect(
      listPrograms(
        faculty,
        SEED_IDS.collegeA,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: program.id,
        }),
      ]),
    );

    await expect(
      listAcademicPeriods(
        faculty,
        SEED_IDS.collegeA,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: period1.id,
        }),
        expect.objectContaining({
          id: period2.id,
        }),
      ]),
    );

    await expect(
      listCohorts(faculty, program.id),
    ).resolves.toEqual([
      expect.objectContaining({
        id: cohort.id,
        status: "PLANNED",
      }),
    ]);

    await expect(
      listSections(
        faculty,
        cohort.id,
        period1.id,
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        id: section.id,
        capacity: 60,
      }),
    ]);

    await transitionAcademicPeriod(
      collegeAdmin,
      period1.id,
      { action: "ACTIVATE" },
    );
    await transitionCohort(
      collegeAdmin,
      cohort.id,
      { action: "ACTIVATE" },
    );

    const updatedSection = await updateSection(
      collegeAdmin,
      section.id,
      {
        name: "A1 Section Alpha",
        capacity: 72,
      },
    );

    expect(updatedSection).toMatchObject({
      name: "A1 Section Alpha",
      capacity: 72,
    });

    await transitionAcademicPeriod(
      collegeAdmin,
      period1.id,
      { action: "CLOSE" },
    );
    await transitionCohort(
      collegeAdmin,
      cohort.id,
      { action: "COMPLETE" },
    );
    await archiveSection(
      collegeAdmin,
      section.id,
    );
    await transitionCohort(
      collegeAdmin,
      cohort.id,
      { action: "ARCHIVE" },
    );

    await expect(
      archiveProgram(
        collegeAdmin,
        program.id,
      ),
    ).resolves.toMatchObject({
      status: "ARCHIVED",
    });
  });

  it("rejects cross-college academic relationships and unauthorized mutation", async () => {
    const program = await createProgram(
      collegeAdmin,
      {
        departmentId: SEED_IDS.departmentA,
        name: "A1 Tenant Program",
        code: "A1-TENANT",
        durationTerms: 4,
      },
    );

    const ownPeriod = await createAcademicPeriod(
      collegeAdmin,
      {
        collegeId: SEED_IDS.collegeA,
        name: "A1 Own Period",
        code: "A1-OWN",
        startDate: "2026-07-01",
        endDate: "2026-12-01",
      },
    );

    const foreignPeriod =
      await createAcademicPeriod(
        superAdmin,
        {
          collegeId: SEED_IDS.collegeB,
          name: "A1 Foreign Period",
          code: "A1-FOREIGN",
          startDate: "2026-07-01",
          endDate: "2026-12-01",
        },
      );

    await expect(
      createCohort(collegeAdmin, {
        programId: program.id,
        name: "A1 Bad Cohort",
        code: "A1-BAD",
        startPeriodId: foreignPeriod.id,
      }),
    ).rejects.toMatchObject({
      code: "ACADEMIC_PERIOD_COLLEGE_MISMATCH",
    });

    const cohort = await createCohort(
      collegeAdmin,
      {
        programId: program.id,
        name: "A1 Good Cohort",
        code: "A1-GOOD",
        startPeriodId: ownPeriod.id,
      },
    );

    await expect(
      createSection(collegeAdmin, {
        cohortId: cohort.id,
        academicPeriodId: foreignPeriod.id,
        name: "A1 Cross Section",
        code: "A1-X",
      }),
    ).rejects.toMatchObject({
      code: "ACADEMIC_PERIOD_COLLEGE_MISMATCH",
    });

    await expect(
      createProgram(faculty, {
        departmentId: SEED_IDS.departmentA,
        name: "A1 Faculty Mutation",
        code: "A1-FAC",
        durationTerms: 2,
      }),
    ).rejects.toBeInstanceOf(
      AuthorizationError,
    );

    const scopedSuperAdmin: RequestContext = {
      ...superAdmin,
      adminScope: {
        organizationId: SEED_IDS.organization,
        collegeId: SEED_IDS.collegeA,
      },
    };

    await expect(
      createProgram(scopedSuperAdmin, {
        departmentId: SEED_IDS.departmentB,
        name: "A1 Outside Scope",
        code: "A1-OUT",
        durationTerms: 2,
      }),
    ).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("rejects invalid lifecycle transitions, duplicates and database-invalid values", async () => {
    const program = await createProgram(
      collegeAdmin,
      {
        departmentId: SEED_IDS.departmentA,
        name: "A1 Lifecycle Program",
        code: "A1-LIFE",
        durationTerms: 6,
      },
    );

    await expect(
      createProgram(collegeAdmin, {
        departmentId: SEED_IDS.departmentA,
        name: "A1 Lifecycle Program Duplicate",
        code: "a1-life",
        durationTerms: 6,
      }),
    ).rejects.toMatchObject({
      code: "PROGRAM_CODE_CONFLICT",
    });

    const period = await createAcademicPeriod(
      collegeAdmin,
      {
        collegeId: SEED_IDS.collegeA,
        name: "A1 Lifecycle Period",
        code: "A1-LIFE-P",
        startDate: "2026-07-01",
        endDate: "2026-12-01",
      },
    );

    await expect(
      transitionAcademicPeriod(
        collegeAdmin,
        period.id,
        { action: "CLOSE" },
      ),
    ).rejects.toMatchObject({
      code: "INVALID_ACADEMIC_PERIOD_TRANSITION",
    });

    const cohort = await createCohort(
      collegeAdmin,
      {
        programId: program.id,
        name: "A1 Lifecycle Cohort",
        code: "A1-LIFE-C",
        startPeriodId: period.id,
      },
    );

    await expect(
      archiveProgram(
        collegeAdmin,
        program.id,
      ),
    ).rejects.toMatchObject({
      code: "PROGRAM_HAS_COHORTS",
    });

    await transitionCohort(
      collegeAdmin,
      cohort.id,
      { action: "ACTIVATE" },
    );

    await expect(
      transitionCohort(
        collegeAdmin,
        cohort.id,
        { action: "ARCHIVE" },
      ),
    ).rejects.toMatchObject({
      code: "INVALID_COHORT_TRANSITION",
    });

    await expect(
      pool.query(
        `insert into programs
           (department_id, name, code, duration_terms)
         values ($1, 'A1 Invalid Duration', 'A1-DB-BAD', 0)`,
        [SEED_IDS.departmentA],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });
  });
});
