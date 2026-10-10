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
import { createProgram } from "@/modules/academics/program-service";
import { createAcademicPeriod } from "@/modules/academics/period-service";
import { createCohort } from "@/modules/academics/cohort-service";
import { createSection } from "@/modules/academics/section-service";
import { createLearnerProgramEnrollment } from "@/modules/academics/enrollment-service";
import { assignLearnerToSection } from "@/modules/academics/roster-service";
import { createCourse } from "@/modules/courses/course-service";
import { createCourseOffering } from "@/modules/courses/offering-service";
import { createCourseSectionDelivery } from "@/modules/courses/delivery-service";
import { createCourseTeachingAssignment } from "@/modules/courses/teaching-assignment-service";
import { createLearningPath } from "@/modules/courses/learning-path-service";
import { createCourseLesson } from "@/modules/courses/lesson-service";
import { createLessonContent } from "@/modules/courses/lesson-content-service";
import { createCourseAssignment } from "@/modules/courses/assignment-service";
import { createCourseQuiz } from "@/modules/courses/quiz-service";
import {
  getFacultyCourseWorkspace,
  listFacultyCourseDeliveries,
} from "@/modules/courses/faculty-course-service";
import { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";
import {
  getFacultyAssignmentReport,
  getFacultyQuizReport,
} from "@/modules/courses/faculty-assessment-report-service";
import { getFacultyClassSchedule } from "@/modules/courses/faculty-schedule-service";
import { createSectionScheduleEvent } from "@/modules/academics/schedule-service";
import {
  createFacultyAttendanceSession,
  getFacultyAttendanceWorkspace,
  markFacultyAttendance,
} from "@/modules/attendance/faculty-service";
import { getLearnerAttendanceWorkspace } from "@/modules/attendance/learner-service";
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

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "seed-learner",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

async function cleanupUI2A() {
  // Schedule link FKs must go before the Section and delivery fixtures.
  await pool.query(`delete from section_schedule_event_courses
   where schedule_event_id in (
     select e.id from section_schedule_events e
     join sections s on s.id=e.section_id
     join cohorts c on c.id=s.cohort_id
     join programs p on p.id=c.program_id
     where p.code like 'FUI2A-%'
   )`);
  await pool.query(`delete from section_schedule_events
   where section_id in (
     select s.id from sections s
     join cohorts c on c.id=s.cohort_id
     join programs p on p.id=c.program_id
     where p.code like 'FUI2A-%'
   )`);
  await pool.query(
    `delete from quiz_options
     where question_id in (
       select qq.id
       from quiz_questions qq
       join course_quizzes q on q.id = qq.quiz_id
       join course_lessons cl on cl.id = q.lesson_id
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    `delete from quiz_questions
     where quiz_id in (
       select q.id
       from course_quizzes q
       join course_lessons cl on cl.id = q.lesson_id
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    `delete from course_quizzes
     where lesson_id in (
       select cl.id
       from course_lessons cl
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    `delete from course_assignments
     where lesson_id in (
       select cl.id
       from course_lessons cl
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    `delete from lesson_contents
     where lesson_id in (
       select cl.id
       from course_lessons cl
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    `delete from course_lessons
     where learning_path_id in (
       select lp.id
       from course_learning_paths lp
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    `delete from course_learning_paths
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    `delete from course_teaching_assignments
     where delivery_id in (
       select csd.id
       from course_section_deliveries csd
       join course_offerings co on co.id = csd.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    `delete from course_section_deliveries
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    `delete from course_offerings
     where course_id in (
       select id from courses
       where code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    "delete from courses where code like 'FUI2A-%'",
  );
  await pool.query(
    `delete from section_enrollments
     where learner_enrollment_id in (
       select lpe.id
       from learner_program_enrollments lpe
       join programs p on p.id = lpe.program_id
       where p.code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    `delete from learner_program_enrollments
     where program_id in (
       select id from programs
       where code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    `delete from sections
     where cohort_id in (
       select c.id
       from cohorts c
       join programs p on p.id = c.program_id
       where p.code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    `delete from cohorts
     where program_id in (
       select id from programs
       where code like 'FUI2A-%'
     )`,
  );
  await pool.query(
    "delete from programs where code like 'FUI2A-%'",
  );
  await pool.query(
    "delete from academic_periods where code like 'FUI2A-%'",
  );
}

async function createStructure() {
  const program = await createProgram(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "FUI2A Computer Science",
      code: "FUI2A-PROGRAM",
      durationTerms: 8,
    },
  );
  const period = await createAcademicPeriod(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      name: "FUI2A Semester 1",
      code: "FUI2A-PERIOD",
      startDate: "2026-07-01",
      endDate: "2027-12-31",
    },
  );
  const cohort = await createCohort(
    collegeAdmin,
    {
      programId: program.id,
      name: "FUI2A 2026 Intake",
      code: "FUI2A-COHORT",
      startPeriodId: period.id,
    },
  );
  const sectionA = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "FUI2A Section A",
      code: "FUI2A-A",
    },
  );
  const sectionB = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "FUI2A Section B",
      code: "FUI2A-B",
    },
  );
  const course = await createCourse(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "FUI2A Data Structures",
      code: "FUI2A-DS",
    },
  );
  const offering = await createCourseOffering(
    collegeAdmin,
    {
      courseId: course.id,
      cohortId: cohort.id,
      academicPeriodId: period.id,
      type: "CORE",
      credits: 4,
      displayOrder: 0,
    },
  );
  const deliveryA =
    await createCourseSectionDelivery(
      collegeAdmin,
      {
        offeringId: offering.id,
        sectionId: sectionA.id,
      },
    );
  const deliveryB =
    await createCourseSectionDelivery(
      collegeAdmin,
      {
        offeringId: offering.id,
        sectionId: sectionB.id,
      },
    );

  // FUI2A learner enrollment is required for Faculty attendance roster tests.
  const learnerEnrollment =
    await createLearnerProgramEnrollment(
      collegeAdmin,
      {
        membershipId:
          SEED_IDS.learnerCollegeAMembership,
        programId: program.id,
        cohortId: cohort.id,
      },
    );
  await assignLearnerToSection(
    collegeAdmin,
    {
      learnerEnrollmentId:
        learnerEnrollment.id,
      sectionId: sectionA.id,
    },
  );

  await createCourseTeachingAssignment(
    collegeAdmin,
    {
      deliveryId: deliveryA.id,
      membershipId:
        SEED_IDS.facultyCollegeAMembership,
      role: "PRIMARY",
    },
  );

  const path = await createLearningPath(
    collegeAdmin,
    {
      offeringId: offering.id,
      title: "FUI2A Learning Path",
    },
  );
  const lesson = await createCourseLesson(
    collegeAdmin,
    {
      learningPathId: path.id,
      name: "FUI2A Arrays",
      sequence: 0,
    },
  );

  const shared = await createLessonContent(
    collegeAdmin,
    {
      lessonId: lesson.id,
      contentType: "RESOURCE",
      title: "FUI2A Shared Notes",
      externalUrl:
        "https://example.com/shared",
      sequence: 0,
    },
  );
  const exact = await createLessonContent(
    faculty,
    {
      lessonId: lesson.id,
      deliveryId: deliveryA.id,
      contentType: "RESOURCE",
      title: "FUI2A Section Notes",
      externalUrl:
        "https://example.com/section-a",
      sequence: 1,
    },
  );
  const assignment =
    await createCourseAssignment(
      faculty,
      {
        lessonId: lesson.id,
        deliveryId: deliveryA.id,
        title: "FUI2A Section Assignment",
        maxPoints: 10,
        sequence: 2,
      },
    );
  const quiz = await createCourseQuiz(
    faculty,
    {
      lessonId: lesson.id,
      deliveryId: deliveryA.id,
      title: "FUI2A Section Quiz",
      maxAttempts: 2,
      sequence: 3,
      questions: [
        {
          type: "SINGLE_CHOICE",
          prompt: "Which one is FIFO?",
          points: 5,
          sequence: 0,
          options: [
            {
              text: "Queue",
              correct: true,
              sequence: 0,
            },
            {
              text: "Stack",
              correct: false,
              sequence: 1,
            },
          ],
        },
      ],
    },
  );

  return {
    sectionA,
    sectionB,
    deliveryA,
    deliveryB,
    path,
    lesson,
    shared,
    exact,
    assignment,
    quiz,
  };
}

beforeEach(async () => {
  await cleanupUI2A();
});

afterAll(async () => {
  await cleanupUI2A();
  await pool.end();
  await closeDatabaseConnection();
});

describe("courses UI2A faculty read model", () => {
  it("discovers only exact active teaching deliveries and composes shared plus Section items", async () => {
    const structure =
      await createStructure();

    const courses =
      await listFacultyCourseDeliveries(
        faculty,
      );

    expect(courses).toHaveLength(1);
    expect(courses[0]).toMatchObject({
      deliveryId: structure.deliveryA.id,
      courseCode: "FUI2A-DS",
      sectionCode: "FUI2A-A",
      teachingRole: "PRIMARY",
    });

    const workspace =
      await getFacultyCourseWorkspace(
        faculty,
        structure.deliveryA.id,
      );

    expect(workspace.learningPath).toMatchObject({
      id: structure.path.id,
      status: "DRAFT",
    });
    expect(workspace.summary).toMatchObject({
      lessons: 1,
      contents: 2,
      assignments: 1,
      quizzes: 1,
      draftItems: 4,
      publishedItems: 0,
    });
    expect(
      workspace.lessons[0]?.contents.map(
        (item) => [
          item.id,
          item.deliveryId,
        ],
      ),
    ).toEqual([
      [structure.shared.id, null],
      [
        structure.exact.id,
        structure.deliveryA.id,
      ],
    ]);
    expect(
      workspace.lessons[0]?.assignments[0],
    ).toMatchObject({
      id: structure.assignment.id,
      deliveryId: structure.deliveryA.id,
    });
    expect(
      workspace.lessons[0]?.quizzes[0],
    ).toMatchObject({
      id: structure.quiz.id,
      deliveryId: structure.deliveryA.id,
    });

    await expect(
      getFacultyCourseWorkspace(
        faculty,
        structure.deliveryB.id,
      ),
    ).rejects.toMatchObject({
      code:
        "FACULTY_TEACHING_SCOPE_REQUIRED",
    });
  });

  it("rejects non-faculty memberships from the faculty read model", async () => {
    await expect(
      listFacultyCourseDeliveries(learner),
    ).rejects.toMatchObject({
      code:
        "FACULTY_TEACHING_SCOPE_REQUIRED",
    });
  });
  it("builds standalone Faculty All Quizzes and All Assignments from teaching scopes", async () => {
    const structure = await createStructure();
    const overview = await getFacultyAssessmentOverview(faculty);
    expect(overview.courses.map((course) => course.deliveryId))
      .toEqual([structure.deliveryA.id]);
    expect(overview.assignments).toEqual([
      expect.objectContaining({
        kind: "ASSIGNMENT",
        id: structure.assignment.id,
        deliveryId: structure.deliveryA.id,
        authoredDeliveryId: structure.deliveryA.id,
        facultyOwned: true,
        lessonName: "FUI2A Arrays",
      }),
    ]);
    expect(overview.quizzes).toEqual([
      expect.objectContaining({
        kind: "QUIZ",
        id: structure.quiz.id,
        deliveryId: structure.deliveryA.id,
        authoredDeliveryId: structure.deliveryA.id,
        facultyOwned: true,
      }),
    ]);
    expect(overview.quizzes.some(
      (quiz) => quiz.deliveryId === structure.deliveryB.id,
    )).toBe(false);
    await expect(getFacultyAssessmentOverview(learner)).rejects.toMatchObject({
      code: "FACULTY_TEACHING_SCOPE_REQUIRED",
    });
  });

  it("keeps Faculty Class Schedule Section-scoped, includes general events and links exact deliveries", async () => {
    const structure = await createStructure();
    const [ownCourseEvent, ownSectionEvent, unrelatedEvent] = await Promise.all([
      createSectionScheduleEvent(collegeAdmin, {
        sectionId: structure.sectionA.id,
        deliveryId: structure.deliveryA.id,
        facultyMembershipId: SEED_IDS.facultyCollegeAMembership,
        title: "FUI2A Course Lab",
        startsAt: "2026-11-12T09:00:00.000Z",
        endsAt: "2026-11-12T10:00:00.000Z",
      }),
      createSectionScheduleEvent(collegeAdmin, {
        sectionId: structure.sectionA.id,
        title: "FUI2A General Briefing",
        startsAt: "2026-11-12T11:00:00.000Z",
        endsAt: "2026-11-12T12:00:00.000Z",
      }),
      createSectionScheduleEvent(collegeAdmin, {
        sectionId: structure.sectionB.id,
        deliveryId: structure.deliveryB.id,
        title: "FUI2A Other Section",
        startsAt: "2026-11-12T13:00:00.000Z",
        endsAt: "2026-11-12T14:00:00.000Z",
      }),
    ]);

    const schedule = await getFacultyClassSchedule(faculty);
    expect(schedule.courses.map((row) => row.deliveryId))
      .toEqual([structure.deliveryA.id]);
    expect(schedule.sections.map((row) => row.sectionId))
      .toEqual([structure.sectionA.id]);
    expect(schedule.events.map((event) => event.id))
      .toEqual([ownCourseEvent.id, ownSectionEvent.id]);
    expect(schedule.events[0]).toMatchObject({
      courseCode: "FUI2A-DS",
      deliveryId: structure.deliveryA.id,
    });
    expect(schedule.events[1]).toMatchObject({ deliveryId: null });
    expect(schedule.events.some((event) => event.id === unrelatedEvent.id))
      .toBe(false);
    await expect(getFacultyClassSchedule(learner)).rejects.toMatchObject({
      code: "FACULTY_TEACHING_SCOPE_REQUIRED",
    });
  });

  it("round-trips Faculty attendance marking into the learner view and supports correction back to present", async () => {
    const structure = await createStructure();
    const session = await createFacultyAttendanceSession(
      faculty,
      {
        deliveryId: structure.deliveryA.id,
        title: "FUI2A Attendance Lab",
        startsAt: "2026-10-01T09:00:00.000Z",
        endsAt: "2026-10-01T10:00:00.000Z",
        location: "Lab 1",
      },
    );

    const initial =
      await getFacultyAttendanceWorkspace(
        faculty,
        structure.deliveryA.id,
      );
    expect(
      initial.roster.map(
        (row) => row.membershipId,
      ),
    ).toEqual([
      SEED_IDS.learnerCollegeAMembership,
    ]);
    expect(initial.sessions).toEqual([
      expect.objectContaining({
        id: session.id,
        attendanceStatus: null,
      }),
    ]);

    await expect(
      markFacultyAttendance(
        faculty,
        session.id,
        {
          deliveryId:
            structure.deliveryA.id,
          absentMembershipIds: [],
          presentMembershipIds: [],
        },
      ),
    ).rejects.toMatchObject({
      code: "ATTENDANCE_ROSTER_CONFLICT",
    });

    const absentResult =
      await markFacultyAttendance(
        faculty,
        session.id,
        {
          deliveryId:
            structure.deliveryA.id,
          absentMembershipIds: [
            SEED_IDS.learnerCollegeAMembership,
          ],
          presentMembershipIds: [],
        },
      );
    expect(absentResult).toMatchObject({
      markedAbsent: 1,
      markedPresent: 0,
    });

    const absentWorkspace =
      await getLearnerAttendanceWorkspace(
        learner,
      );
    const absentRecord =
      absentWorkspace.records.find(
        (row) => row.id === session.id,
      );
    expect(absentRecord).toMatchObject({
      status: "ABSENT",
    });

    const corrected =
      await markFacultyAttendance(
        faculty,
        session.id,
        {
          deliveryId:
            structure.deliveryA.id,
          absentMembershipIds: [],
          presentMembershipIds: [
            SEED_IDS.learnerCollegeAMembership,
          ],
        },
      );
    expect(corrected).toMatchObject({
      markedAbsent: 0,
      markedPresent: 1,
    });

    const correctedWorkspace =
      await getLearnerAttendanceWorkspace(
        learner,
      );
    const correctedRecord =
      correctedWorkspace.records.find(
        (row) => row.id === session.id,
      );
    expect(correctedRecord).toMatchObject({
      status: "PRESENT",
    });

    const exceptionRows =
      await pool.query(
        `select status
           from attendance_records
          where schedule_event_id = $1`,
        [session.id],
      );
    expect(exceptionRows.rows).toHaveLength(0);
  });

  it("keeps Faculty attendance scheduling and marking inside exact teaching scope", async () => {
    const structure = await createStructure();

    await expect(
      createFacultyAttendanceSession(
        learner,
        {
          deliveryId:
            structure.deliveryA.id,
          title: "Unauthorized session",
          startsAt:
            "2026-10-01T09:00:00.000Z",
          endsAt:
            "2026-10-01T10:00:00.000Z",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "FACULTY_TEACHING_SCOPE_REQUIRED",
    });

    await expect(
      createFacultyAttendanceSession(
        faculty,
        {
          deliveryId:
            structure.deliveryB.id,
          title: "Wrong Section",
          startsAt:
            "2026-10-01T09:00:00.000Z",
          endsAt:
            "2026-10-01T10:00:00.000Z",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "FACULTY_TEACHING_SCOPE_REQUIRED",
    });
  });

  it("reports current eligible learners who have not submitted or attempted", async () => {
    const structure = await createStructure();

    const assignmentReport =
      await getFacultyAssignmentReport(
        faculty,
        structure.assignment.id,
        structure.deliveryA.id,
      );
    expect(
      assignmentReport.metrics,
    ).toMatchObject({
      eligibleLearners: 1,
      submitted: 0,
      missing: 1,
    });
    expect(
      assignmentReport.missingLearners.map(
        (row) => row.membershipId,
      ),
    ).toEqual([
      SEED_IDS.learnerCollegeAMembership,
    ]);

    const quizReport =
      await getFacultyQuizReport(
        faculty,
        structure.quiz.id,
        structure.deliveryA.id,
      );
    expect(quizReport.metrics).toMatchObject({
      eligibleLearners: 1,
      uniqueLearners: 0,
      notAttempted: 1,
      averagePercent: null,
    });
    expect(
      quizReport.notAttemptedLearners.map(
        (row) => row.membershipId,
      ),
    ).toEqual([
      SEED_IDS.learnerCollegeAMembership,
    ]);
  });

});
