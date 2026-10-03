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
  createProgram,
} from "@/modules/academics/program-service";
import {
  createAcademicPeriod,
} from "@/modules/academics/period-service";
import {
  createCohort,
} from "@/modules/academics/cohort-service";
import {
  createSection,
} from "@/modules/academics/section-service";
import {
  createLearnerProgramEnrollment,
  listLearnerProgramEnrollments,
  transitionLearnerProgramEnrollment,
} from "@/modules/academics/enrollment-service";
import {
  assignLearnerToSection,
  listLearnerSectionHistory,
  listSectionRoster,
} from "@/modules/academics/roster-service";
import {
  createSectionFacultyAssignment,
  endSectionFacultyAssignment,
  listSectionFacultyAssignments,
} from "@/modules/academics/faculty-assignment-service";
import {
  cancelSectionScheduleEvent,
  createSectionScheduleEvent,
  listSectionScheduleEvents,
  updateSectionScheduleEvent,
} from "@/modules/academics/schedule-service";
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

const secondLearner = {
  userId: "61000000-0000-4000-8000-000000000001",
  membershipId:
    "62000000-0000-4000-8000-000000000001",
  roleId: "63000000-0000-4000-8000-000000000001",
  identityUid: "a2-test-second-learner",
};

async function cleanupA2() {
  await pool.query(
    `delete from section_schedule_events
     where section_id in (
       select s.id
       from sections s
       join cohorts c on c.id = s.cohort_id
       join programs p on p.id = c.program_id
       where p.code like 'A2-%'
     )`,
  );

  await pool.query(
    `delete from section_faculty_assignments
     where section_id in (
       select s.id
       from sections s
       join cohorts c on c.id = s.cohort_id
       join programs p on p.id = c.program_id
       where p.code like 'A2-%'
     )`,
  );

  await pool.query(
    `delete from section_enrollments
     where learner_enrollment_id in (
       select lpe.id
       from learner_program_enrollments lpe
       join programs p on p.id = lpe.program_id
       where p.code like 'A2-%'
     )`,
  );

  await pool.query(
    `delete from learner_program_enrollments
     where program_id in (
       select id
       from programs
       where code like 'A2-%'
     )`,
  );

  await pool.query(
    `delete from sections
     where cohort_id in (
       select c.id
       from cohorts c
       join programs p on p.id = c.program_id
       where p.code like 'A2-%'
     )`,
  );

  await pool.query(
    `delete from cohorts
     where program_id in (
       select id
       from programs
       where code like 'A2-%'
     )`,
  );

  await pool.query(
    "delete from programs where code like 'A2-%'",
  );
  await pool.query(
    "delete from academic_periods where code like 'A2-%'",
  );

  await pool.query(
    "delete from membership_roles where membership_id = $1",
    [secondLearner.membershipId],
  );
  await pool.query(
    "delete from college_memberships where id = $1",
    [secondLearner.membershipId],
  );
  await pool.query(
    "delete from users where id = $1",
    [secondLearner.userId],
  );
}

async function insertSecondLearner() {
  await pool.query(
    `insert into users
      (id, identity_uid, display_name)
     values ($1, $2, 'A2 Second Learner')`,
    [
      secondLearner.userId,
      secondLearner.identityUid,
    ],
  );

  await pool.query(
    `insert into college_memberships
      (id, user_id, college_id)
     values ($1, $2, $3)`,
    [
      secondLearner.membershipId,
      secondLearner.userId,
      SEED_IDS.collegeA,
    ],
  );

  await pool.query(
    `insert into membership_roles
      (id, membership_id, role)
     values ($1, $2, 'LEARNER')`,
    [
      secondLearner.roleId,
      secondLearner.membershipId,
    ],
  );
}

async function createStructure() {
  const program = await createProgram(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "A2 Computer Science",
      code: "A2-CSE",
      durationTerms: 8,
    },
  );

  const period1 = await createAcademicPeriod(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      name: "A2 Semester 1",
      code: "A2-2026-S1",
      startDate: "2026-07-01",
      endDate: "2026-12-15",
    },
  );

  const period2 = await createAcademicPeriod(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      name: "A2 Semester 2",
      code: "A2-2027-S2",
      startDate: "2027-01-05",
      endDate: "2027-05-31",
    },
  );

  const cohort = await createCohort(
    collegeAdmin,
    {
      programId: program.id,
      name: "A2 2026 Intake",
      code: "A2-2026",
      startPeriodId: period1.id,
      expectedEndPeriodId: period2.id,
    },
  );

  const sectionA = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period1.id,
      name: "A2 Section A",
      code: "A2-A",
      capacity: 60,
    },
  );

  const sectionB = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period1.id,
      name: "A2 Section B",
      code: "A2-B",
      capacity: 60,
    },
  );

  const sectionC = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period2.id,
      name: "A2 Section C",
      code: "A2-C",
      capacity: 1,
    },
  );

  return {
    program,
    period1,
    period2,
    cohort,
    sectionA,
    sectionB,
    sectionC,
  };
}

beforeEach(async () => {
  await cleanupA2();
});

afterAll(async () => {
  await cleanupA2();
  await pool.end();
  await closeDatabaseConnection();
});

describe("academics A2 against PostgreSQL", () => {
  it("preserves learner roster history across moves and promotions", async () => {
    const structure = await createStructure();

    const enrollment =
      await createLearnerProgramEnrollment(
        collegeAdmin,
        {
          membershipId:
            SEED_IDS.learnerCollegeAMembership,
          programId: structure.program.id,
          cohortId: structure.cohort.id,
        },
      );

    await expect(
      createLearnerProgramEnrollment(
        collegeAdmin,
        {
          membershipId:
            SEED_IDS.learnerCollegeAMembership,
          programId: structure.program.id,
          cohortId: structure.cohort.id,
        },
      ),
    ).rejects.toMatchObject({
      code: "LEARNER_ALREADY_ENROLLED",
    });

    const first = await assignLearnerToSection(
      collegeAdmin,
      {
        learnerEnrollmentId: enrollment.id,
        sectionId: structure.sectionA.id,
      },
    );

    expect(first.status).toBe("ACTIVE");

    const moved = await assignLearnerToSection(
      collegeAdmin,
      {
        learnerEnrollmentId: enrollment.id,
        sectionId: structure.sectionB.id,
      },
    );

    expect(moved.status).toBe("ACTIVE");

    const afterMove =
      await listLearnerSectionHistory(
        faculty,
        enrollment.id,
      );

    expect(afterMove).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sectionId: structure.sectionA.id,
          status: "MOVED",
        }),
        expect.objectContaining({
          sectionId: structure.sectionB.id,
          status: "ACTIVE",
        }),
      ]),
    );

    const promoted =
      await assignLearnerToSection(
        collegeAdmin,
        {
          learnerEnrollmentId: enrollment.id,
          sectionId: structure.sectionC.id,
        },
      );

    expect(promoted.status).toBe("ACTIVE");

    const afterPromotion =
      await listLearnerSectionHistory(
        faculty,
        enrollment.id,
      );

    expect(afterPromotion).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sectionId: structure.sectionB.id,
          status: "COMPLETED",
        }),
        expect.objectContaining({
          sectionId: structure.sectionC.id,
          status: "ACTIVE",
        }),
      ]),
    );

    await expect(
      assignLearnerToSection(
        collegeAdmin,
        {
          learnerEnrollmentId: enrollment.id,
          sectionId: structure.sectionA.id,
        },
      ),
    ).rejects.toMatchObject({
      code: "SECTION_PERIOD_REGRESSION",
    });

    const roster = await listSectionRoster(
      faculty,
      structure.sectionC.id,
    );

    expect(roster).toEqual([
      expect.objectContaining({
        learnerEnrollmentId: enrollment.id,
        membershipId:
          SEED_IDS.learnerCollegeAMembership,
        status: "ACTIVE",
      }),
    ]);

    const completed =
      await transitionLearnerProgramEnrollment(
        collegeAdmin,
        enrollment.id,
        { action: "COMPLETE" },
      );

    expect(completed.status).toBe("COMPLETED");

    const completedHistory =
      await listLearnerSectionHistory(
        faculty,
        enrollment.id,
      );

    expect(completedHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sectionId: structure.sectionC.id,
          status: "COMPLETED",
        }),
      ]),
    );

    const listed =
      await listLearnerProgramEnrollments(
        faculty,
        structure.program.id,
        structure.cohort.id,
      );

    expect(listed).toEqual([
      expect.objectContaining({
        id: enrollment.id,
        status: "COMPLETED",
      }),
    ]);
  });

  it("enforces learner role, college, cohort and capacity boundaries", async () => {
    const structure = await createStructure();
    await insertSecondLearner();

    await expect(
      createLearnerProgramEnrollment(
        collegeAdmin,
        {
          membershipId:
            SEED_IDS.facultyCollegeAMembership,
          programId: structure.program.id,
          cohortId: structure.cohort.id,
        },
      ),
    ).rejects.toMatchObject({
      code: "LEARNER_ROLE_REQUIRED",
    });

    const enrollment1 =
      await createLearnerProgramEnrollment(
        collegeAdmin,
        {
          membershipId:
            SEED_IDS.learnerCollegeAMembership,
          programId: structure.program.id,
          cohortId: structure.cohort.id,
        },
      );

    const enrollment2 =
      await createLearnerProgramEnrollment(
        collegeAdmin,
        {
          membershipId:
            secondLearner.membershipId,
          programId: structure.program.id,
          cohortId: structure.cohort.id,
        },
      );

    await assignLearnerToSection(
      collegeAdmin,
      {
        learnerEnrollmentId: enrollment1.id,
        sectionId: structure.sectionC.id,
      },
    );

    await expect(
      assignLearnerToSection(
        collegeAdmin,
        {
          learnerEnrollmentId: enrollment2.id,
          sectionId: structure.sectionC.id,
        },
      ),
    ).rejects.toMatchObject({
      code: "SECTION_CAPACITY_REACHED",
    });

    const foreignProgram = await createProgram(
      superAdmin,
      {
        departmentId: SEED_IDS.departmentB,
        name: "A2 Foreign Program",
        code: "A2-FOREIGN",
        durationTerms: 4,
      },
    );

    const foreignPeriod =
      await createAcademicPeriod(
        superAdmin,
        {
          collegeId: SEED_IDS.collegeB,
          name: "A2 Foreign Period",
          code: "A2-FOREIGN-P",
          startDate: "2026-07-01",
          endDate: "2026-12-01",
        },
      );

    const foreignCohort = await createCohort(
      superAdmin,
      {
        programId: foreignProgram.id,
        name: "A2 Foreign Cohort",
        code: "A2-FOREIGN-C",
        startPeriodId: foreignPeriod.id,
      },
    );

    await expect(
      createLearnerProgramEnrollment(
        superAdmin,
        {
          membershipId:
            SEED_IDS.learnerCollegeAMembership,
          programId: foreignProgram.id,
          cohortId: foreignCohort.id,
        },
      ),
    ).rejects.toMatchObject({
      code: "ENROLLMENT_COLLEGE_MISMATCH",
    });
  });

  it("manages section Faculty responsibilities without creating course teaching assignments", async () => {
    const structure = await createStructure();

    const assignment =
      await createSectionFacultyAssignment(
        collegeAdmin,
        {
          sectionId: structure.sectionA.id,
          membershipId:
            SEED_IDS.facultyCollegeAMembership,
          role: "ADVISOR",
        },
      );

    await expect(
      createSectionFacultyAssignment(
        collegeAdmin,
        {
          sectionId: structure.sectionA.id,
          membershipId:
            SEED_IDS.facultyCollegeAMembership,
          role: "ADVISOR",
        },
      ),
    ).rejects.toMatchObject({
      code: "FACULTY_ASSIGNMENT_CONFLICT",
    });

    await expect(
      createSectionFacultyAssignment(
        collegeAdmin,
        {
          sectionId: structure.sectionA.id,
          membershipId:
            SEED_IDS.learnerCollegeAMembership,
          role: "COORDINATOR",
        },
      ),
    ).rejects.toMatchObject({
      code: "FACULTY_ROLE_REQUIRED",
    });

    await expect(
      createSectionFacultyAssignment(
        collegeAdmin,
        {
          sectionId: structure.sectionA.id,
          membershipId:
            SEED_IDS.facultyCollegeBMembership,
          role: "COORDINATOR",
        },
      ),
    ).rejects.toMatchObject({
      code: "MEMBERSHIP_COLLEGE_MISMATCH",
    });

    const active =
      await listSectionFacultyAssignments(
        faculty,
        structure.sectionA.id,
      );

    expect(active).toEqual([
      expect.objectContaining({
        id: assignment.id,
        role: "ADVISOR",
      }),
    ]);

    const ended =
      await endSectionFacultyAssignment(
        collegeAdmin,
        assignment.id,
      );

    expect(ended.endedAt).toBeInstanceOf(Date);

    await expect(
      listSectionFacultyAssignments(
        faculty,
        structure.sectionA.id,
      ),
    ).resolves.toEqual([]);

    const history =
      await listSectionFacultyAssignments(
        faculty,
        structure.sectionA.id,
        true,
      );

    expect(history).toEqual([
      expect.objectContaining({
        id: assignment.id,
      }),
    ]);
  });

  it("keeps section schedule events inside period and faculty tenant boundaries", async () => {
    const structure = await createStructure();

    const event = await createSectionScheduleEvent(
      collegeAdmin,
      {
        sectionId: structure.sectionA.id,
        facultyMembershipId:
          SEED_IDS.facultyCollegeAMembership,
        title: "A2 Orientation",
        startsAt: "2026-07-10T04:30:00.000Z",
        endsAt: "2026-07-10T05:30:00.000Z",
        location: "Room 101",
      },
    );

    await expect(
      createSectionScheduleEvent(
        collegeAdmin,
        {
          sectionId: structure.sectionA.id,
          facultyMembershipId:
            SEED_IDS.facultyCollegeBMembership,
          title: "A2 Cross College",
          startsAt:
            "2026-07-11T04:30:00.000Z",
          endsAt:
            "2026-07-11T05:30:00.000Z",
        },
      ),
    ).rejects.toMatchObject({
      code: "MEMBERSHIP_COLLEGE_MISMATCH",
    });

    await expect(
      createSectionScheduleEvent(
        collegeAdmin,
        {
          sectionId: structure.sectionA.id,
          title: "A2 Outside Period",
          startsAt:
            "2027-01-01T04:30:00.000Z",
          endsAt:
            "2027-01-01T05:30:00.000Z",
        },
      ),
    ).rejects.toMatchObject({
      code: "SCHEDULE_EVENT_OUTSIDE_PERIOD",
    });

    const updated =
      await updateSectionScheduleEvent(
        collegeAdmin,
        event.id,
        {
          title: "A2 Orientation Updated",
          location: "Auditorium",
        },
      );

    expect(updated).toMatchObject({
      title: "A2 Orientation Updated",
      location: "Auditorium",
    });

    const events =
      await listSectionScheduleEvents(
        faculty,
        structure.sectionA.id,
      );

    expect(events).toEqual([
      expect.objectContaining({
        id: event.id,
        status: "SCHEDULED",
      }),
    ]);

    const cancelled =
      await cancelSectionScheduleEvent(
        collegeAdmin,
        event.id,
        { action: "CANCEL" },
      );

    expect(cancelled.status).toBe("CANCELLED");

    await expect(
      pool.query(
        `insert into section_schedule_events
          (section_id, title, starts_at, ends_at)
         values ($1, 'A2 Invalid Time', $2, $3)`,
        [
          structure.sectionA.id,
          "2026-07-12T06:00:00.000Z",
          "2026-07-12T05:00:00.000Z",
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });
  });
});
