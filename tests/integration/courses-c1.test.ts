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
import { createProgram } from "@/modules/academics/program-service";
import { createAcademicPeriod } from "@/modules/academics/period-service";
import { createCohort } from "@/modules/academics/cohort-service";
import { createSection } from "@/modules/academics/section-service";
import {
  archiveCourse,
  createCourse,
  listCourses,
} from "@/modules/courses/course-service";
import {
  archiveCourseOffering,
  createCourseOffering,
  updateCourseOffering,
} from "@/modules/courses/offering-service";
import {
  createCourseSectionDelivery,
  endCourseSectionDelivery,
} from "@/modules/courses/delivery-service";
import {
  createCourseTeachingAssignment,
  endCourseTeachingAssignment,
  listCourseTeachingAssignments,
} from "@/modules/courses/teaching-assignment-service";
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

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-superadmin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

const secondFaculty = {
  userId: "71000000-0000-4000-8000-000000000001",
  membershipId:
    "72000000-0000-4000-8000-000000000001",
  roleId: "73000000-0000-4000-8000-000000000001",
  identityUid: "c1-test-second-faculty",
};

async function cleanupC1() {
  await pool.query(
    `delete from course_teaching_assignments
     where delivery_id in (
       select csd.id
       from course_section_deliveries csd
       join course_offerings co on co.id = csd.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C1-%'
     )`,
  );
  await pool.query(
    `delete from course_section_deliveries
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'C1-%'
     )`,
  );
  await pool.query(
    `delete from course_offerings
     where course_id in (
       select id from courses where code like 'C1-%'
     )`,
  );
  await pool.query("delete from program_term_courses where course_id in (select id from courses where code like 'C1-%')");
  await pool.query(
    "delete from courses where code like 'C1-%'",
  );

  await pool.query(
    `delete from sections
     where cohort_id in (
       select c.id
       from cohorts c
       join programs p on p.id = c.program_id
       where p.code like 'C1-%'
     )`,
  );
  await pool.query(
    `delete from cohorts
     where program_id in (
       select id from programs where code like 'C1-%'
     )`,
  );
  await pool.query("delete from program_terms where program_id in (select id from programs where code like 'C1-%')");
  await pool.query(
    "delete from programs where code like 'C1-%'",
  );
  await pool.query(
    "delete from academic_periods where code like 'C1-%'",
  );

  await pool.query(
    "delete from membership_roles where membership_id = $1",
    [secondFaculty.membershipId],
  );
  await pool.query(
    "delete from college_memberships where id = $1",
    [secondFaculty.membershipId],
  );
  await pool.query(
    "delete from users where id = $1",
    [secondFaculty.userId],
  );
}

async function insertSecondFaculty() {
  await pool.query(
    `insert into users
      (id, identity_uid, display_name)
     values ($1, $2, 'C1 Second Faculty')`,
    [
      secondFaculty.userId,
      secondFaculty.identityUid,
    ],
  );
  await pool.query(
    `insert into college_memberships
      (id, user_id, college_id)
     values ($1, $2, $3)`,
    [
      secondFaculty.membershipId,
      secondFaculty.userId,
      SEED_IDS.collegeA,
    ],
  );
  await pool.query(
    `insert into membership_roles
      (id, membership_id, role)
     values ($1, $2, 'FACULTY')`,
    [
      secondFaculty.roleId,
      secondFaculty.membershipId,
    ],
  );
}

async function createAcademicStructure() {
  const program = await createProgram(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "C1 Computer Science",
      code: "C1-PROGRAM",
      durationTerms: 8,
    },
  );
  const period = await createAcademicPeriod(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      name: "C1 Semester 1",
      code: "C1-PERIOD",
      startDate: "2026-07-01",
      endDate: "2026-12-15",
    },
  );
  const cohort = await createCohort(
    collegeAdmin,
    {
      programId: program.id,
      name: "C1 2026 Intake",
      code: "C1-COHORT",
      startPeriodId: period.id,
    },
  );
  const section = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "C1 Section A",
      code: "C1-A",
      capacity: 60,
    },
  );

  return { program, period, cohort, section };
}

beforeEach(async () => {
  await cleanupC1();
});

afterAll(async () => {
  await cleanupC1();
  await pool.end();
  await closeDatabaseConnection();
});

describe("courses C1 against PostgreSQL", () => {
  it("runs catalog -> offering -> section delivery -> teaching assignment lifecycle", async () => {
    const academic =
      await createAcademicStructure();
    const course = await createCourse(
      collegeAdmin,
      {
        departmentId: SEED_IDS.departmentA,
        name: "C1 Data Structures",
        code: "C1-DS",
        description: "Core data structures",
      },
    );

    await expect(
      listCourses(
        faculty,
        SEED_IDS.collegeA,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: course.id,
          code: "C1-DS",
        }),
      ]),
    );

    const offering =
      await createCourseOffering(
        collegeAdmin,
        {
          courseId: course.id,
          cohortId: academic.cohort.id,
          academicPeriodId:
            academic.period.id,
          type: "CORE",
          credits: 4,
          displayOrder: 1,
        },
      );

    const updated =
      await updateCourseOffering(
        collegeAdmin,
        offering.id,
        {
          type: "ELECTIVE",
          credits: 3,
        },
      );
    expect(updated.type).toBe("ELECTIVE");

    const delivery =
      await createCourseSectionDelivery(
        collegeAdmin,
        {
          offeringId: offering.id,
          sectionId: academic.section.id,
        },
      );

    const assignment =
      await createCourseTeachingAssignment(
        collegeAdmin,
        {
          deliveryId: delivery.id,
          membershipId:
            SEED_IDS.facultyCollegeAMembership,
          role: "PRIMARY",
        },
      );

    await expect(
      listCourseTeachingAssignments(
        faculty,
        delivery.id,
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        id: assignment.id,
        role: "PRIMARY",
      }),
    ]);

    await expect(
      archiveCourse(
        collegeAdmin,
        course.id,
      ),
    ).rejects.toMatchObject({
      code: "COURSE_HAS_ACTIVE_OFFERINGS",
    });

    await expect(
      endCourseSectionDelivery(
        collegeAdmin,
        delivery.id,
      ),
    ).rejects.toMatchObject({
      code: "DELIVERY_HAS_ACTIVE_TEACHERS",
    });

    await endCourseTeachingAssignment(
      collegeAdmin,
      assignment.id,
    );
    await endCourseSectionDelivery(
      collegeAdmin,
      delivery.id,
    );
    await archiveCourseOffering(
      collegeAdmin,
      offering.id,
    );

    await expect(
      archiveCourse(
        collegeAdmin,
        course.id,
      ),
    ).resolves.toMatchObject({
      status: "ARCHIVED",
    });
  });

  it("enforces structural admin authority and exact tenant/cohort/period scope", async () => {
    const academic =
      await createAcademicStructure();

    await expect(
      createCourse(faculty, {
        departmentId: SEED_IDS.departmentA,
        name: "C1 Faculty Mutation",
        code: "C1-FAC",
      }),
    ).rejects.toBeInstanceOf(
      AuthorizationError,
    );

    const course = await createCourse(
      collegeAdmin,
      {
        departmentId: SEED_IDS.departmentA,
        name: "C1 Secure Course",
        code: "C1-SECURE",
      },
    );

    const foreignProgram = await createProgram(
      superAdmin,
      {
        departmentId: SEED_IDS.departmentB,
        name: "C1 Foreign Program",
        code: "C1-FOREIGN-P",
        durationTerms: 4,
      },
    );
    const foreignPeriod =
      await createAcademicPeriod(
        superAdmin,
        {
          collegeId: SEED_IDS.collegeB,
          name: "C1 Foreign Period",
          code: "C1-FOREIGN-PERIOD",
          startDate: "2026-07-01",
          endDate: "2026-12-15",
        },
      );
    const foreignCohort = await createCohort(
      superAdmin,
      {
        programId: foreignProgram.id,
        name: "C1 Foreign Cohort",
        code: "C1-FOREIGN-C",
        startPeriodId: foreignPeriod.id,
      },
    );
    const foreignSection = await createSection(
      superAdmin,
      {
        cohortId: foreignCohort.id,
        academicPeriodId:
          foreignPeriod.id,
        name: "C1 Foreign Section",
        code: "C1-FOREIGN-S",
      },
    );

    await expect(
      createCourseOffering(
        superAdmin,
        {
          courseId: course.id,
          cohortId: foreignCohort.id,
          academicPeriodId:
            foreignPeriod.id,
          type: "CORE",
          credits: 3,
          displayOrder: 0,
        },
      ),
    ).rejects.toMatchObject({
      code: "COURSE_COLLEGE_MISMATCH",
    });

    const offering =
      await createCourseOffering(
        collegeAdmin,
        {
          courseId: course.id,
          cohortId: academic.cohort.id,
          academicPeriodId:
            academic.period.id,
          type: "CORE",
          credits: 3,
          displayOrder: 0,
        },
      );

    await expect(
      createCourseSectionDelivery(
        collegeAdmin,
        {
          offeringId: offering.id,
          sectionId: foreignSection.id,
        },
      ),
    ).rejects.toMatchObject({
      code: "SECTION_NOT_DELIVERABLE",
    });

    const delivery =
      await createCourseSectionDelivery(
        collegeAdmin,
        {
          offeringId: offering.id,
          sectionId: academic.section.id,
        },
      );

    await expect(
      createCourseTeachingAssignment(
        collegeAdmin,
        {
          deliveryId: delivery.id,
          membershipId:
            SEED_IDS.learnerCollegeAMembership,
          role: "TA",
        },
      ),
    ).rejects.toMatchObject({
      code: "FACULTY_ROLE_REQUIRED",
    });

    await expect(
      createCourseTeachingAssignment(
        collegeAdmin,
        {
          deliveryId: delivery.id,
          membershipId:
            SEED_IDS.facultyCollegeBMembership,
          role: "TA",
        },
      ),
    ).rejects.toMatchObject({
      code: "MEMBERSHIP_COLLEGE_MISMATCH",
    });
  });

  it("uses database constraints for duplicate and concurrent-looking writes", async () => {
    const academic =
      await createAcademicStructure();
    await insertSecondFaculty();

    const course = await createCourse(
      collegeAdmin,
      {
        departmentId: SEED_IDS.departmentA,
        name: "C1 Algorithms",
        code: "C1-ALG",
      },
    );

    await expect(
      createCourse(collegeAdmin, {
        departmentId: SEED_IDS.departmentA,
        name: "C1 Algorithms Duplicate",
        code: "c1-alg",
      }),
    ).rejects.toMatchObject({
      code: "COURSE_CODE_CONFLICT",
    });

    const offering =
      await createCourseOffering(
        collegeAdmin,
        {
          courseId: course.id,
          cohortId: academic.cohort.id,
          academicPeriodId:
            academic.period.id,
          type: "CORE",
          credits: 4,
          displayOrder: 0,
        },
      );

    await expect(
      createCourseOffering(
        collegeAdmin,
        {
          courseId: course.id,
          cohortId: academic.cohort.id,
          academicPeriodId:
            academic.period.id,
          type: "ELECTIVE",
          credits: 2,
          displayOrder: 1,
        },
      ),
    ).rejects.toMatchObject({
      code: "OFFERING_CONFLICT",
    });

    const delivery =
      await createCourseSectionDelivery(
        collegeAdmin,
        {
          offeringId: offering.id,
          sectionId: academic.section.id,
        },
      );

    await expect(
      createCourseSectionDelivery(
        collegeAdmin,
        {
          offeringId: offering.id,
          sectionId: academic.section.id,
        },
      ),
    ).rejects.toMatchObject({
      code: "SECTION_DELIVERY_CONFLICT",
    });

    await createCourseTeachingAssignment(
      collegeAdmin,
      {
        deliveryId: delivery.id,
        membershipId:
          SEED_IDS.facultyCollegeAMembership,
        role: "PRIMARY",
      },
    );

    await expect(
      createCourseTeachingAssignment(
        collegeAdmin,
        {
          deliveryId: delivery.id,
          membershipId:
            secondFaculty.membershipId,
          role: "PRIMARY",
        },
      ),
    ).rejects.toMatchObject({
      code: "PRIMARY_TEACHER_CONFLICT",
    });

    await expect(
      pool.query(
        `update course_offerings
         set credits = 0
         where id = $1`,
        [offering.id],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });
  });
});
