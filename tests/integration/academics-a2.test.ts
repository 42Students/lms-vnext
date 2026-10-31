import { insertDisposableAttendanceMark, deleteDisposableAttendanceEvents } from "../support/db045-attendance-fixture.mjs";
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
import {
  createCourse,
} from "@/modules/courses/course-service";
import {
  createCourseOffering,
} from "@/modules/courses/offering-service";
import {
  createCourseSectionDelivery,
} from "@/modules/courses/delivery-service";
import {
  getLearnerClassSchedule,
} from "@/modules/academics/learner-schedule-service";
import {
  getLearnerAttendanceWorkspace,
} from "@/modules/attendance/learner-service";
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
  // P5-R11 holds one connection while a second observes the service's
  // blocked PostgreSQL lock, so a single-connection pool would deadlock.
  max: 2,
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

const primaryLearner = {
  userId: "64000000-0000-4000-8000-000000000001",
  membershipId: "65000000-0000-4000-8000-000000000001",
  roleId: "66000000-0000-4000-8000-000000000001",
  identityUid: "a2-test-primary-learner",
};
const learner: RequestContext = {
  user: {
    id: primaryLearner.userId,
    identityUid: primaryLearner.identityUid,
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: primaryLearner.membershipId,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
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
  const attendanceEvents=await pool.query<{id:string}>(`
    select e.id from section_schedule_events e
    join sections s on s.id=e.section_id
    join cohorts c on c.id=s.cohort_id
    join programs p on p.id=c.program_id
    where p.code like 'A2-%'`);
  await deleteDisposableAttendanceEvents(pool,attendanceEvents.rows.map(r=>r.id));
  // DB014 0325 forbids CASCADE deletion of still-marked attendance rows.
  await pool.query("delete from attendance_records where schedule_event_id=any($1::uuid[])",
    [attendanceEvents.rows.map(r=>r.id)]);
  await pool.query("delete from attendance_sessions where schedule_event_id=any($1::uuid[])",
    [attendanceEvents.rows.map(r=>r.id)]);
  await pool.query(
    `delete from course_section_deliveries
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'A2-SCHED-%'
     )
     and id not in (
       select delivery_id
       from section_schedule_event_courses
     )`,
  );
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
    `delete from course_section_deliveries
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'A2-SCHED-%'
     )`,
  );
  await pool.query(
    `delete from course_offerings
     where course_id in (
       select id from courses
       where code like 'A2-SCHED-%'
     )`,
  );
  await pool.query("delete from program_term_courses where course_id in (select id from courses where code like 'A2-SCHED-%')");
  await pool.query(
    "delete from courses where code like 'A2-SCHED-%'",
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

  await pool.query("delete from program_terms where program_id in (select id from programs where code like 'A2-%')");
  await pool.query(
    "delete from programs where code like 'A2-%'",
  );
  await pool.query(
    "delete from academic_periods where code like 'A2-%'",
  );

  await pool.query(
    "delete from membership_roles where membership_id in ($1,$2)",
    [primaryLearner.membershipId,secondLearner.membershipId],
  );
  await pool.query(
    "delete from college_memberships where id in ($1,$2)",
    [primaryLearner.membershipId,secondLearner.membershipId],
  );
  await pool.query(
    "delete from users where id in ($1,$2)",
    [primaryLearner.userId,secondLearner.userId],
  );
}

async function insertPrimaryLearner(){
  await pool.query(
    `INSERT INTO users(id,identity_uid,display_name)
       VALUES($1,$2,'A2 Primary Learner')`,
    [primaryLearner.userId,primaryLearner.identityUid],
  );
  await pool.query(
    `INSERT INTO college_memberships(id,user_id,college_id)
       VALUES($1,$2,$3)`,
    [primaryLearner.membershipId,primaryLearner.userId,SEED_IDS.collegeA],
  );
  await pool.query(
    `INSERT INTO membership_roles(id,membership_id,role)
       VALUES($1,$2,'LEARNER')`,
    [primaryLearner.roleId,primaryLearner.membershipId],
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
  await insertPrimaryLearner();
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
            primaryLearner.membershipId,
          programId: structure.program.id,
          cohortId: structure.cohort.id,
        },
      );

    await expect(
      createLearnerProgramEnrollment(
        collegeAdmin,
        {
          membershipId:
            primaryLearner.membershipId,
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
          primaryLearner.membershipId,
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
            primaryLearner.membershipId,
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
            primaryLearner.membershipId,
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
            primaryLearner.membershipId,
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


  it("links scheduled classes to an exact Course delivery and exposes only the learner's active Section schedule", async () => {
    const structure = await createStructure();

    const enrollment =
      await createLearnerProgramEnrollment(
        collegeAdmin,
        {
          membershipId:
            primaryLearner.membershipId,
          programId: structure.program.id,
          cohortId: structure.cohort.id,
        },
      );

    await assignLearnerToSection(
      collegeAdmin,
      {
        learnerEnrollmentId: enrollment.id,
        sectionId: structure.sectionA.id,
      },
    );

    const course = await createCourse(
      collegeAdmin,
      {
        departmentId: SEED_IDS.departmentA,
        name: "A2 Schedule Course",
        code: "A2-SCHED-COURSE",
      },
    );
    const offering =
      await createCourseOffering(
        collegeAdmin,
        {
          courseId: course.id,
          cohortId: structure.cohort.id,
          academicPeriodId:
            structure.period1.id,
          type: "CORE",
          credits: 3,
          displayOrder: 0,
        },
      );
    const delivery =
      await createCourseSectionDelivery(
        collegeAdmin,
        {
          offeringId: offering.id,
          sectionId: structure.sectionA.id,
        },
      );
    const otherDelivery =
      await createCourseSectionDelivery(
        collegeAdmin,
        {
          offeringId: offering.id,
          sectionId: structure.sectionB.id,
        },
      );

    const event =
      await createSectionScheduleEvent(
        collegeAdmin,
        {
          sectionId: structure.sectionA.id,
          deliveryId: delivery.id,
          facultyMembershipId:
            SEED_IDS.facultyCollegeAMembership,
          title: "A2 Data Structures",
          startsAt:
            "2026-10-05T04:30:00.000Z",
          endsAt:
            "2026-10-05T05:30:00.000Z",
          location: "Room A2",
        },
      );

    await expect(
      createSectionScheduleEvent(
        collegeAdmin,
        {
          sectionId: structure.sectionA.id,
          deliveryId: otherDelivery.id,
          title: "A2 Wrong Section Course",
          startsAt:
            "2026-10-06T04:30:00.000Z",
          endsAt:
            "2026-10-06T05:30:00.000Z",
        },
      ),
    ).rejects.toMatchObject({
      code: "SCHEDULE_COURSE_DELIVERY_MISMATCH",
    });

    await pool.query(
      `insert into attendance_sessions
        (schedule_event_id, status, marked_by_user_id, marked_at)
       values ($1, 'MARKED', $2, now())`,
      [
        event.id,
        SEED_IDS.collegeAdminUser,
      ],
    );
    await insertDisposableAttendanceMark(pool,{
      scheduleEventId:event.id,deliveryId:delivery.id,
      membershipId:primaryLearner.membershipId,collegeId:SEED_IDS.collegeA,
      actorUserId:SEED_IDS.collegeAdminUser,
      actorMembershipId:SEED_IDS.collegeAdminMembership,
      actorRole:"COLLEGE_ADMIN",status:"ABSENT",
      note:"A2 learner absence",
    });

    const schedule =
      await getLearnerClassSchedule(learner);

    expect(schedule.events).toEqual([
      expect.objectContaining({
        id: event.id,
        sectionId: structure.sectionA.id,
        deliveryId: delivery.id,
        courseId: course.id,
        courseName: "A2 Schedule Course",
        facultyName: expect.any(String),
        location: "Room A2",
      }),
    ]);
    expect(schedule.courses).toEqual([
      expect.objectContaining({
        deliveryId: delivery.id,
        courseId: course.id,
      }),
    ]);

    const attendance =
      await getLearnerAttendanceWorkspace(
        learner,
      );
    expect(attendance.records).toEqual([
      expect.objectContaining({
        id: event.id,
        deliveryId: delivery.id,
        courseId: course.id,
        status: "ABSENT",
      }),
    ]);
    expect(attendance.overall).toMatchObject({
      heldSessions: 1,
      markedSessions: 1,
      present: 0,
      absent: 1,
      percentage: 0,
    });

    await expect(
      getLearnerAttendanceWorkspace(
        faculty,
      ),
    ).rejects.toBeDefined();

    await expect(
      getLearnerClassSchedule(faculty),
    ).rejects.toMatchObject({
      code: "LEARNER_SCHEDULE_ACCESS_DENIED",
    });
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
          expectedUpdatedAt: event.updatedAt.toISOString(),
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

  it("P5-R12 serializes concurrent COMPLETE versus WITHDRAW across parent and active section enrollments", async () => {
    const structure=await createStructure();
    const enrollment=await createLearnerProgramEnrollment(collegeAdmin,{
      membershipId:primaryLearner.membershipId,
      programId:structure.program.id,cohortId:structure.cohort.id,
    });
    const section=await assignLearnerToSection(collegeAdmin,{
      learnerEnrollmentId:enrollment.id,sectionId:structure.sectionA.id,
    });
    expect(section.status).toBe("ACTIVE");

    const blocker=await pool.connect();
    let locked=false;
    let attempts:Promise<Awaited<ReturnType<typeof transitionLearnerProgramEnrollment>>>[]=[];
    try {
      await blocker.query("BEGIN");
      locked=true;
      await blocker.query(
        "select id from learner_program_enrollments where id=$1 for update",
        [enrollment.id],
      );
      attempts=["COMPLETE","WITHDRAW"].map(action=>
        transitionLearnerProgramEnrollment(collegeAdmin,enrollment.id,{
          action:action as "COMPLETE"|"WITHDRAW",
        }),
      );
      let blocked=0;
      try{
        const deadline=Date.now()+10_000;
        while(Date.now()<deadline){
          const state=await pool.query<{n:string}>(`
            select count(*)::text as n from pg_stat_activity
             where datname=current_database() and pid<>pg_backend_pid()
               and wait_event_type='Lock'
               and query ilike '%learner_program_enrollments%'`);
          blocked=Number(state.rows[0]?.n??0);
          if(blocked>=2)break;
          await new Promise(resolve=>setTimeout(resolve,25));
        }
      } finally {
        await blocker.query("COMMIT");
        locked=false;
      }
      const results=await Promise.allSettled(attempts);
      expect(blocked,"Both exit producers must reach the blocked PostgreSQL parent row").toBeGreaterThanOrEqual(2);
      expect(results.filter(x=>x.status==="fulfilled")).toHaveLength(1);
      expect(results.filter(x=>x.status==="rejected")).toHaveLength(1);
      expect(results.find(x=>x.status==="rejected")).toMatchObject({
        status:"rejected",reason:{code:"LEARNER_ENROLLMENT_NOT_ACTIVE"},
      });
      const winner=results.find(x=>x.status==="fulfilled");
      if(!winner||winner.status!=="fulfilled")throw new Error("No committed program exit");
      const terminal=winner.value.status;
      expect(["COMPLETED","WITHDRAWN"]).toContain(terminal);
      const parent=await pool.query<{
        status:string;completed_at:Date|null;withdrawn_at:Date|null;
      }>(
        "select status,completed_at,withdrawn_at from learner_program_enrollments where id=$1",
        [enrollment.id],
      );
      expect(parent.rows).toHaveLength(1);
      expect(parent.rows[0]?.status).toBe(terminal);
      expect(parent.rows[0]?.completed_at!==null).toBe(terminal==="COMPLETED");
      expect(parent.rows[0]?.withdrawn_at!==null).toBe(terminal==="WITHDRAWN");
      const history=await pool.query<{status:string;ended_at:Date|null}>(
        "select status,ended_at from section_enrollments where learner_enrollment_id=$1",
        [enrollment.id],
      );
      expect(history.rows).toHaveLength(1);
      expect(history.rows[0]?.status).toBe(terminal);
      expect(history.rows[0]?.ended_at).toBeInstanceOf(Date);
    } finally {
      if(locked)await blocker.query("ROLLBACK").catch(()=>{});
      blocker.release();
    }
  });

  it("P5-R11 rejects schedule create and update after a concurrent period close", async () => {
    const structure = await createStructure();
    const closeDuring = async (operation: () => Promise<unknown>) => {
      const closer = await pool.connect();
      try {
        // The uncommitted CLOSE is invisible to preflight reads, but holds the
        // period row lock until the schedule transaction reaches its recheck.
        await closer.query("BEGIN");
        await closer.query(
          "UPDATE academic_periods SET status='CLOSED' WHERE id=$1",
          [structure.period1.id],
        );
        const outcome = Promise.resolve().then(operation).then(
          () => ({ok: true}),
          (error: unknown) => ({ok: false, error}),
        );
        // Prove this is an actual two-session race: the schedule service has
        // reached the locked academic-period row before committing CLOSE.
        // A fixed delay can pass without ever exercising the TOCTOU window.
        const deadline = Date.now() + 5_000;
        let writerBlocked = false;
        while (Date.now() < deadline) {
          const waiting = await pool.query<{pid: number}>(
            `SELECT pid FROM pg_stat_activity
              WHERE datname=current_database()
                AND pid <> pg_backend_pid()
                AND wait_event_type='Lock'
                AND query ILIKE '%academic_periods%'
              LIMIT 1`,
          );
          if (waiting.rowCount) { writerBlocked = true; break; }
          await new Promise(resolve => setTimeout(resolve, 25));
        }
        expect(writerBlocked, "The schedule writer never reached the period lock").toBe(true);
        await closer.query("COMMIT");
        expect(await outcome).toMatchObject({
          ok: false, error: {code: "ACADEMIC_PERIOD_CLOSED"},
        });
      } finally {
        await closer.query("ROLLBACK");
        closer.release();
      }
    };

    await closeDuring(() => createSectionScheduleEvent(collegeAdmin, {
      sectionId: structure.sectionA.id,
      title: "P5-R11 must not persist a session after period closure",
      startsAt: "2026-07-11T04:30:00.000Z",
      endsAt: "2026-07-11T05:30:00.000Z",
    }));
    await pool.query(
      "UPDATE academic_periods SET status='ACTIVE' WHERE id=$1",
      [structure.period1.id],
    );
    const existing = await createSectionScheduleEvent(collegeAdmin, {
      sectionId: structure.sectionA.id,
      title: "P5-R11 original session",
      startsAt: "2026-07-12T04:30:00.000Z",
      endsAt: "2026-07-12T05:30:00.000Z",
    });
    await closeDuring(() => updateSectionScheduleEvent(
      collegeAdmin, existing.id, {
        expectedUpdatedAt: existing.updatedAt.toISOString(),
        title: "P5-R11 forbidden stale edit",
      },
    ));
    const persisted = await pool.query<{title: string}>(
      "SELECT title FROM section_schedule_events WHERE section_id=$1",
      [structure.sectionA.id],
    );
    expect(persisted.rows).toEqual([{title: "P5-R11 original session"}]);
  });

  it("P5-R22 rejects the losing schedule editor with two PostgreSQL writers", async () => {
    const structure = await createStructure();
    const event = await createSectionScheduleEvent(collegeAdmin, {
      sectionId: structure.sectionA.id,
      title: "P5-R22 initial",
      startsAt: "2026-07-13T04:30:00.000Z",
      endsAt: "2026-07-13T05:30:00.000Z",
    });
    const expectedUpdatedAt = event.updatedAt.toISOString();
    const blocker = await pool.connect();
    let attempts: Promise<Awaited<ReturnType<typeof updateSectionScheduleEvent>>>[] = [];
    try {
      await blocker.query("BEGIN");
      await blocker.query(
        "SELECT id FROM section_schedule_events WHERE id=$1 FOR UPDATE",
        [event.id],
      );
      // Two independent requests carry the same last-seen timestamp.
      // Hold an external row lock to prove both writers reach PostgreSQL
      // before either is permitted to commit.
      attempts = ["P5-R22 writer A", "P5-R22 writer B"].map((title) =>
        updateSectionScheduleEvent(collegeAdmin, event.id, {
          expectedUpdatedAt,
          title,
        }),
      );
      const deadline = Date.now() + 10_000;
      let blocked = 0;
      while (Date.now() < deadline) {
        const activity = await pool.query<{ blocked: string }>(
          `SELECT count(*)::text AS blocked FROM pg_stat_activity
           WHERE datname=current_database()
             AND pid <> pg_backend_pid()
             AND wait_event_type='Lock'
             AND query ILIKE '%section_schedule_events%'`,
        );
        blocked = Number(activity.rows[0]?.blocked ?? 0);
        if (blocked >= 2) break;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(blocked, "Both independent schedule writers must reach the held event row").toBeGreaterThanOrEqual(2);
    } finally {
      await blocker.query("ROLLBACK");
      blocker.release();
    }
    const results = await Promise.allSettled(attempts);
    const successes = results.filter((result) => result.status === "fulfilled");
    const failures = results.filter((result) => result.status === "rejected");
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      status: "rejected",
      reason: { code: "SCHEDULE_EVENT_STALE_VERSION" },
    });
    const winner = successes[0];
    expect(winner?.status).toBe("fulfilled");
    if (winner?.status !== "fulfilled") throw new Error("Expected one committed writer");
    expect(winner.value.updatedAt.getTime()).toBeGreaterThan(event.updatedAt.getTime());
    const persisted = await pool.query<{title: string; updated_at: Date}>(
      "SELECT title, updated_at FROM section_schedule_events WHERE id=$1",
      [event.id],
    );
    expect(persisted.rows[0]?.title).toBe(winner.value.title);
    expect(persisted.rows[0]?.updated_at.getTime()).toBe(winner.value.updatedAt.getTime());
    await expect(updateSectionScheduleEvent(collegeAdmin, event.id, {
      expectedUpdatedAt,
      title: "P5-R22 stale replay",
    })).rejects.toMatchObject({code:"SCHEDULE_EVENT_STALE_VERSION"});
  });

});
