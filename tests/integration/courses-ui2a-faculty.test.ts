import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
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
import { listFacultyContacts } from "@/modules/courses/faculty-contacts-service";
import { createSectionScheduleEvent } from "@/modules/academics/schedule-service";
import {
  createFacultyAttendanceSession,
  getFacultyAttendanceWorkspace,
  markFacultyAttendance,
} from "@/modules/attendance/faculty-service";
import { getLearnerAttendanceWorkspace } from "@/modules/attendance/learner-service";
import {
  correctAdminAttendance,
  getAdminAttendanceGrid,
  getAdminAttendanceOptions,
} from "@/modules/attendance/admin-service";
import {
  createCourseDiscussionMessage,
  deleteCourseDiscussionMessage,
  listCourseDiscussionMessages,
  toggleCourseDiscussionPin,
} from "@/modules/courses/discussion-service";
import { getFacultyDeliveryRoster } from "@/modules/attendance/faculty-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { releaseSeedLearnerPlacementEnrollment } from "../support/w04-placement-access-fixture";

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

// Do not reuse the seeded learner: it already owns one active program enrollment.
// The real membership uniqueness constraint must remain enforced.
const facultyFixtureLearnerUserId=randomUUID();
const facultyFixtureLearnerMembershipId=randomUUID();
const facultyFixtureLearnerRoleId=randomUUID();

const learner: RequestContext = {
  user: {
    id: facultyFixtureLearnerUserId,
    identityUid: "faculty-ui2a-" + facultyFixtureLearnerUserId,
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: facultyFixtureLearnerMembershipId,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

async function cleanupUI2A() {
  await releaseSeedLearnerPlacementEnrollment(pool);
  // Remove only events from this disposable course/section fixture. A real
  // notification or scheduled delivery may reference each event with a
  // RESTRICT foreign key, so remove those dependents before the audit row.
  const fixtureEvents=await pool.query<{id:string}>(`select id from activity_events
    where (
      event_type in ('courses.attendance.marked', 'courses.class.scheduled')
      and subject_type = 'attendance_session'
      and subject_id in (
        select e.id::text from section_schedule_events e
        join sections s on s.id=e.section_id
        join cohorts c on c.id=s.cohort_id
        join programs p on p.id=c.program_id
        where p.code like 'FUI2A-%'
      )
    ) or (
      event_type like 'courses.discussion.%'
      and metadata->>'deliveryId' in (
        select d.id::text from course_section_deliveries d
        join course_offerings co on co.id=d.offering_id
        join courses c on c.id=co.course_id
        where c.code like 'FUI2A-%'
      )
    )`);
  const eventIds=fixtureEvents.rows.map(row=>row.id);
  if(eventIds.length>0){
    await pool.query("delete from in_app_notifications where event_id = any($1::uuid[])",[eventIds]);
    await pool.query("delete from notification_delivery_outbox where event_id = any($1::uuid[])",[eventIds]);
    await pool.query("delete from activity_events where id = any($1::uuid[])",[eventIds]);
  }
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
  await pool.query("delete from program_term_courses where course_id in (select id from courses where code like 'FUI2A-%')");
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
  await pool.query("delete from program_terms where program_id in (select id from programs where code like 'FUI2A-%')");
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
          facultyFixtureLearnerMembershipId,
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
      points: 0,
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
      points: 0,
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
      maxAttempts: 2, shuffleQuestions: false, shuffleOptions: false,
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
  // Seed only this suite's learner; preserve unique active membership/program invariants.
  await pool.query("INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING",
    [facultyFixtureLearnerUserId,"faculty-ui2a-"+facultyFixtureLearnerUserId,"Faculty UI2A learner"]);
  await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING",
    [facultyFixtureLearnerMembershipId,facultyFixtureLearnerUserId,SEED_IDS.collegeA]);
  await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER') ON CONFLICT(id) DO NOTHING",
    [facultyFixtureLearnerRoleId,facultyFixtureLearnerMembershipId]);
});

afterAll(async () => {
  await cleanupUI2A();
  // Keep the actor shell if an immutable audit references it. Never delete audit evidence.
  const audit=await pool.query<{used:boolean}>(
    "SELECT EXISTS(SELECT 1 FROM activity_events WHERE actor_user_id=$1 OR actor_membership_id=$2) AS used",
    [facultyFixtureLearnerUserId,facultyFixtureLearnerMembershipId]);
  if(!audit.rows[0]?.used){
    await pool.query("DELETE FROM membership_roles WHERE id=$1",[facultyFixtureLearnerRoleId]);
    await pool.query("DELETE FROM college_memberships WHERE id=$1",[facultyFixtureLearnerMembershipId]);
    await pool.query("DELETE FROM users WHERE id=$1",[facultyFixtureLearnerUserId]);
  }
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
      contents: 1,
      assignments: 1,
      quizzes: 1,
      draftItems: 3,
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
      [structure.exact.id, structure.deliveryA.id],
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
        // Scheduling in the past is only allowed inside a short grace window.
        startsAt: new Date(Date.now() - 3 * 60_000).toISOString(),
        endsAt: new Date(Date.now() + 57 * 60_000).toISOString(),
        location: "Lab 1",
      },
    );

    const scheduleAudit = await pool.query(
      `select event_type, actor_user_id, metadata from activity_events
        where event_type = 'courses.class.scheduled' and subject_id = $1`,
      [session.id],
    );
    expect(scheduleAudit.rows).toHaveLength(1);
    expect(scheduleAudit.rows[0]).toMatchObject({
      event_type: "courses.class.scheduled",
      actor_user_id: faculty.user.id,
      metadata: { deliveryId: structure.deliveryA.id },
    });

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
      facultyFixtureLearnerMembershipId,
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
    ).rejects.toBeInstanceOf(ZodError);

    const absentResult =
      await markFacultyAttendance(
        faculty,
        session.id,
        {
          deliveryId:
            structure.deliveryA.id,
          absentMembershipIds: [
            facultyFixtureLearnerMembershipId,
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

    const markedWorkspace =
      await getFacultyAttendanceWorkspace(
        faculty,
        structure.deliveryA.id,
      );
    const markedAt = markedWorkspace.sessions.find(
      (row) => row.id === session.id,
    )?.markedAt;
    expect(markedAt).toBeTruthy();
    const corrected =
      await markFacultyAttendance(
        faculty,
        session.id,
        {
          deliveryId:
            structure.deliveryA.id,
          absentMembershipIds: [],
          presentMembershipIds: [
            facultyFixtureLearnerMembershipId,
          ],
          expectedMarkedAt: new Date(markedAt!).toISOString(),
          correctionReason: "Marked absent by mistake",
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
    // DB06 retains the explicit PRESENT correction as current state/history.
    expect(exceptionRows.rows).toEqual([{ status: "PRESENT" }]);

    const audits = await pool.query<{
      event_type: string;
      subject_id: string;
      actor_user_id: string;
      college_id: string;
      metadata: {
        deliveryId: string;
        markedAbsent: number;
        markedPresent: number;
        correction: boolean;
      };
      summary: string;
    }>(
      `select event_type, subject_id, actor_user_id, college_id, metadata, summary
         from activity_events
        where event_type = 'courses.attendance.marked'
          and subject_type = 'attendance_session'
          and subject_id = $1
        order by occurred_at, id`,
      [session.id],
    );
    expect(audits.rows).toHaveLength(2);
    expect(audits.rows.map((row) => row.metadata)).toEqual([
      expect.objectContaining({
        deliveryId: structure.deliveryA.id,
        markedAbsent: 1,
        markedPresent: 0,
        correction: false,
      }),
      expect.objectContaining({
        deliveryId: structure.deliveryA.id,
        markedAbsent: 0,
        markedPresent: 1,
        correction: true,
      }),
    ]);
    expect(audits.rows.every((row) =>
      row.subject_id === session.id &&
      row.actor_user_id === faculty.user.id &&
      row.college_id === SEED_IDS.collegeA
    )).toBe(true);
    expect(JSON.stringify(audits.rows)).not.toContain(facultyFixtureLearnerMembershipId);

    const future = await createFacultyAttendanceSession(faculty, {
      deliveryId: structure.deliveryA.id,
      title: "FUI2A Future Attendance",
      startsAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      endsAt: new Date(Date.now() + 120 * 60_000).toISOString(),
    });
    await expect(markFacultyAttendance(faculty, future.id, {
      deliveryId: structure.deliveryA.id,
      absentMembershipIds: [facultyFixtureLearnerMembershipId],
      presentMembershipIds: [],
    })).rejects.toMatchObject({ code: "ATTENDANCE_NOT_STARTED" });

    const expired = await createFacultyAttendanceSession(faculty, {
      deliveryId: structure.deliveryA.id,
      title: "FUI2A Expired Attendance",
      startsAt: new Date(Date.now() + 240 * 60_000).toISOString(),
      endsAt: new Date(Date.now() + 300 * 60_000).toISOString(),
    });
    // Past classes cannot be scheduled, so age the row directly.
    await pool.query(
      "update section_schedule_events set starts_at = $1, ends_at = $2 where id = $3",
      [new Date(Date.now() - 72 * 60 * 60_000).toISOString(),
        new Date(Date.now() - 71 * 60 * 60_000).toISOString(), expired.id],
    );
    await expect(markFacultyAttendance(faculty, expired.id, {
      deliveryId: structure.deliveryA.id,
      absentMembershipIds: [facultyFixtureLearnerMembershipId],
      presentMembershipIds: [],
    })).rejects.toMatchObject({ code: "ATTENDANCE_CORRECTION_WINDOW_EXPIRED" });

    const state = await getFacultyAttendanceWorkspace(faculty, structure.deliveryA.id);
    expect(state.sessions.filter((session) => [future.id, expired.id].includes(session.id))
      .every((session) => session.attendanceStatus === null)).toBe(true);
    const rejectedAudits = await pool.query(
      `select id from activity_events where event_type = 'courses.attendance.marked'
         and subject_id in ($1, $2)`,
      [future.id, expired.id],
    );
    expect(rejectedAudits.rows).toHaveLength(0);
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
            "2099-10-01T09:00:00.000Z",
          endsAt:
            "2099-10-01T10:00:00.000Z",
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
            "2099-10-01T09:00:00.000Z",
          endsAt:
            "2099-10-01T10:00:00.000Z",
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
      facultyFixtureLearnerMembershipId,
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
      facultyFixtureLearnerMembershipId,
    ]);
  });

  it("uses the exact delivery roster for Students and keeps Faculty discussion moderation section-scoped", async () => {
    const structure = await createStructure();

    const rosterScope =
      await getFacultyDeliveryRoster(
        faculty,
        structure.deliveryA.id,
      );
    expect(
      rosterScope.roster.map(
        (row) => row.membershipId,
      ),
    ).toEqual([
      facultyFixtureLearnerMembershipId,
    ]);
    await expect(
      getFacultyDeliveryRoster(
        faculty,
        structure.deliveryB.id,
      ),
    ).rejects.toMatchObject({
      code:
        "FACULTY_TEACHING_SCOPE_REQUIRED",
    });

    const learnerMessage =
      await createCourseDiscussionMessage(
        learner,
        structure.deliveryA.id,
        {
          messageText:
            "Can you explain the queue example?",
        },
      );

    const facultyMessage =
      await createCourseDiscussionMessage(
        faculty,
        structure.deliveryA.id,
        {
          messageText:
            "Yes — I will pin the key explanation.",
        },
      );

    await expect(
      toggleCourseDiscussionPin(
        learner,
        facultyMessage.id,
      ),
    ).rejects.toMatchObject({
      code:
        "DISCUSSION_MODERATION_ACCESS_DENIED",
    });

    await expect(
      toggleCourseDiscussionPin(
        faculty,
        facultyMessage.id,
        structure.deliveryB.id,
      ),
    ).rejects.toMatchObject({
      code: "DISCUSSION_MESSAGE_NOT_FOUND",
    });
    await expect(
      deleteCourseDiscussionMessage(
        faculty,
        learnerMessage.id,
        structure.deliveryB.id,
      ),
    ).rejects.toMatchObject({
      code: "DISCUSSION_MESSAGE_NOT_FOUND",
    });

    const pinned =
      await toggleCourseDiscussionPin(
        faculty,
        facultyMessage.id,
        structure.deliveryA.id,
      );
    expect(pinned.pinned).toBe(true);

    // Concurrent toggles must apply independently against the persisted row,
    // not both write the same stale boolean read before either update.
    const concurrent = await Promise.all([
      toggleCourseDiscussionPin(faculty, facultyMessage.id, structure.deliveryA.id),
      toggleCourseDiscussionPin(faculty, facultyMessage.id, structure.deliveryA.id),
    ]);
    expect(concurrent.map((row) => row.pinned).sort())
      .toEqual([false, true]);

    const feed =
      await listCourseDiscussionMessages(
        faculty,
        structure.deliveryA.id,
      );
    expect(feed.canPost).toBe(true);
    expect(
      feed.messages.map((message) => [
        message.id,
        message.pinned,
      ]),
    ).toEqual([
      [learnerMessage.id, false],
      [facultyMessage.id, true],
    ]);

    await deleteCourseDiscussionMessage(
      faculty,
      learnerMessage.id,
      structure.deliveryA.id,
    );
    const afterDelete =
      await listCourseDiscussionMessages(
        faculty,
        structure.deliveryA.id,
      );
    expect(
      afterDelete.messages.map(
        (message) => message.id,
      ),
    ).toEqual([facultyMessage.id]);
    const history = await pool.query(
      `select event_type, college_id, actor_user_id, metadata
         from activity_events
        where subject_type='course_discussion_message'
          and subject_id in ($1, $2)`,
      [learnerMessage.id, facultyMessage.id],
    );
    expect(history.rows).toHaveLength(6);
    expect(history.rows.map(row => row.event_type).sort()).toEqual([
      "courses.discussion.deleted",
      "courses.discussion.pin_changed",
      "courses.discussion.pin_changed",
      "courses.discussion.pin_changed",
      "courses.discussion.posted",
      "courses.discussion.posted",
    ]);
    expect(history.rows.every(row =>
      row.college_id === SEED_IDS.collegeA &&
      row.metadata.deliveryId === structure.deliveryA.id
    )).toBe(true);
    expect(JSON.stringify(history.rows)).not.toContain("Can you explain the queue example?");
    expect(JSON.stringify(history.rows)).not.toContain("Yes — I will pin");


    await expect(
      listCourseDiscussionMessages(
        faculty,
        structure.deliveryB.id,
      ),
    ).rejects.toMatchObject({
      code:
        "FACULTY_TEACHING_SCOPE_REQUIRED",
    });
  });

  it("pages a busy Faculty discussion without skipping microsecond-neighbor messages", async () => {
    const structure = await createStructure();
    const messages: string[] = [];
    for (let index = 0; index < 7; index++) {
      const message = await createCourseDiscussionMessage(faculty, structure.deliveryA.id, {
        messageText: "Paged class discussion " + index,
      });
      messages.push(message.id);
      // All seven are inside the same millisecond. The server must retain
      // PostgreSQL's microsecond precision in its cursor, not a JS Date.
      await pool.query(
        "update course_discussion_messages set created_at = $2::timestamptz + ($3::int * interval '1 microsecond') where id = $1",
        [message.id, "2026-10-14T08:00:00.123000Z", index],
      );
    }
    const first = await listCourseDiscussionMessages(faculty, structure.deliveryA.id, { limit: 3 });
    expect(first.messages.map(message => message.id)).toEqual(messages.slice(4));
    expect(first.nextCursor).toMatchObject({ beforeId: messages[4] });
    expect(first.nextCursor!.beforeCreatedAt).toMatch(/\.123004Z$/);
    expect(first.messages.map(row => row.createdAtExact)).toEqual([
      "2026-10-14T08:00:00.123004Z",
      "2026-10-14T08:00:00.123005Z",
      "2026-10-14T08:00:00.123006Z",
    ]);
    expect(first.highlightedPinned).toBeNull();

    // A moderator can pin a message well outside the most recent page.
    // All authorized readers should still see the pin banner immediately.
    await toggleCourseDiscussionPin(faculty, messages[0]!, structure.deliveryA.id);
    const withPinned = await listCourseDiscussionMessages(
      faculty, structure.deliveryA.id, { limit: 3 },
    );
    expect(withPinned.messages.map(row => row.id)).toEqual(messages.slice(4));
    expect(withPinned.highlightedPinned).toMatchObject({
      id: messages[0],
      messageText: "Paged class discussion 0",
    });
    const learnerPinned = await listCourseDiscussionMessages(
      learner, structure.deliveryA.id, { limit: 2 },
    );
    expect(learnerPinned.highlightedPinned?.id).toBe(messages[0]);
    await toggleCourseDiscussionPin(faculty, messages[0]!, structure.deliveryA.id);
    const noPinned = await listCourseDiscussionMessages(
      faculty, structure.deliveryA.id, { limit: 3 },
    );
    expect(noPinned.highlightedPinned).toBeNull();

    const second = await listCourseDiscussionMessages(faculty, structure.deliveryA.id, {
      limit: 3, ...first.nextCursor!,
    });
    expect(second.messages.map(message => message.id)).toEqual(messages.slice(1, 4));
    const third = await listCourseDiscussionMessages(faculty, structure.deliveryA.id, {
      limit: 3, ...second.nextCursor!,
    });
    expect(third.messages.map(message => message.id)).toEqual([messages[0]]);
    expect(third.nextCursor).toBeNull();
    expect(new Set([...first.messages, ...second.messages, ...third.messages].map(m => m.id)).size).toBe(7);

    for (const invalid of [
      { limit: 0 },
      { limit: 101 },
      { beforeId: messages[1] },
      { beforeCreatedAt: first.nextCursor!.beforeCreatedAt },
      { unknownField: "other college" },
    ]) {
      await expect(listCourseDiscussionMessages(faculty, structure.deliveryA.id, invalid))
        .rejects.toBeDefined();
    }
    await expect(listCourseDiscussionMessages(faculty, structure.deliveryB.id, {
      limit: 3, ...first.nextCursor!,
    })).rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
  });

  it("keeps Faculty Contacts same-college and role-filtered", async () => {
    const learners = await listFacultyContacts(
      faculty,
      {
        tab: "LEARNER",
        search: "",
        page: 1,
        pageSize: 20,
      },
    );
    expect(learners.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        membershipId:
          facultyFixtureLearnerMembershipId,
        departmentName: null,
        roles: expect.arrayContaining([
          "LEARNER",
        ]),
      }),
    ]));

    const teachers = await listFacultyContacts(
      faculty,
      {
        tab: "FACULTY",
        search: "faculty",
        page: 1,
        pageSize: 20,
      },
    );
    expect(
      teachers.items.some(
        (person) =>
          person.membershipId ===
          SEED_IDS.facultyCollegeAMembership,
      ),
    ).toBe(true);

    // College A cannot see the same human's second Faculty membership
    // in college B. The persisted college scope is applied before search,
    // pagination, and any role-filter joins.
    const allCollegeA = await listFacultyContacts(faculty, {
      tab: "ALL", page: 1, pageSize: 10,
    });
    expect(allCollegeA.pageSize).toBe(10);
    expect(allCollegeA.items.map((item) => item.membershipId))
      .toContain(facultyFixtureLearnerMembershipId);
    expect(allCollegeA.items.map((item) => item.membershipId))
      .not.toContain(SEED_IDS.facultyCollegeBMembership);
    const facultyInCollegeB = {
      ...faculty,
      membership: {
        ...faculty.membership!,
        id: SEED_IDS.facultyCollegeBMembership,
        collegeId: SEED_IDS.collegeB,
      },
    };
    const allCollegeB = await listFacultyContacts(facultyInCollegeB, {
      tab: "ALL", page: 1, pageSize: 10,
    });
    expect(allCollegeB.items.map((item) => item.membershipId))
      .toContain(SEED_IDS.facultyCollegeBMembership);
    expect(allCollegeB.items.map((item) => item.membershipId))
      .not.toContain(facultyFixtureLearnerMembershipId);

    const stalePage = await listFacultyContacts(faculty, {
      tab: "ALL", page: 99999, pageSize: 10,
    });
    expect(stalePage.page).toBe(stalePage.totalPages);
    expect(stalePage.items.length).toBeGreaterThan(0);
    const literalWildcard = await listFacultyContacts(faculty, {
      tab: "ALL", search: "%", page: 1, pageSize: 10,
    });
    expect(literalWildcard.total).toBe(0);
    expect(literalWildcard.items).toHaveLength(0);

    await expect(
      listFacultyContacts(learner, {
        tab: "ALL",
        page: 1,
        pageSize: 20,
      }),
    ).rejects.toMatchObject({
      code:
        "FACULTY_TEACHING_SCOPE_REQUIRED",
    });
  });

  it("gives College Admin a scoped attendance grid and correction path without granting Faculty admin access", async () => {
    const structure = await createStructure();
    // This is a live correction path, not an expiry test. Keep the fixture
    // within the configured correction window rather than pinning it to a
    // calendar date that becomes invalid as CI moves forward.
    const startsAt = new Date(Date.now() - 3 * 60_000);
    const endsAt = new Date(Date.now() + 57 * 60_000);
    const localParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(startsAt);
    const sessionMonth =
      localParts.find((part) => part.type === "year")!.value + "-" +
      localParts.find((part) => part.type === "month")!.value;
    const session =
      await createFacultyAttendanceSession(
        faculty,
        {
          deliveryId:
            structure.deliveryA.id,
          title: "FUI2A Admin Review",
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        },
      );

    const options =
      await getAdminAttendanceOptions(
        collegeAdmin,
        SEED_IDS.collegeA,
      );
    expect(
      options.deliveries.some(
        (delivery) =>
          delivery.deliveryId ===
          structure.deliveryA.id,
      ),
    ).toBe(true);
    expect(options.policy).toMatchObject({
      eligibilityThresholdPercent:
        expect.any(Number),
      correctionWindowHours:
        expect.any(Number),
    });

    const initial =
      await getAdminAttendanceGrid(
        collegeAdmin,
        {
          collegeId: SEED_IDS.collegeA,
          deliveryId:
            structure.deliveryA.id,
          month: sessionMonth,
        },
      );
    expect(
      initial.roster.map(
        (row) => row.membershipId,
      ),
    ).toEqual([
      facultyFixtureLearnerMembershipId,
    ]);
    expect(initial.sessions).toEqual([
      expect.objectContaining({
        id: session.id,
        attendanceStatus: null,
      }),
    ]);

    await correctAdminAttendance(
      collegeAdmin,
      session.id,
      {
        collegeId: SEED_IDS.collegeA,
        deliveryId:
          structure.deliveryA.id,
        membershipId:
          facultyFixtureLearnerMembershipId,
        status: "EXCUSED",
      },
    );

    const excused =
      await getAdminAttendanceGrid(
        collegeAdmin,
        {
          collegeId: SEED_IDS.collegeA,
          deliveryId:
            structure.deliveryA.id,
          month: sessionMonth,
        },
      );
    expect(excused.records).toEqual([
      expect.objectContaining({
        membershipId:
          facultyFixtureLearnerMembershipId,
        status: "EXCUSED",
        markedByUserId:
          SEED_IDS.collegeAdminUser,
      }),
    ]);
    // Correcting an individual record is not a bulk marking of the Section.
    expect(excused.sessions[0]).toMatchObject({
      attendanceStatus: null,
      attendanceMarkedByUserId: null,
    });

    await correctAdminAttendance(
      collegeAdmin,
      session.id,
      {
        collegeId: SEED_IDS.collegeA,
        deliveryId:
          structure.deliveryA.id,
        membershipId:
          facultyFixtureLearnerMembershipId,
        status: "PRESENT",
      },
    );
    const corrected =
      await getAdminAttendanceGrid(
        collegeAdmin,
        {
          collegeId: SEED_IDS.collegeA,
          deliveryId:
            structure.deliveryA.id,
          month: sessionMonth,
        },
      );
    expect(corrected.records).toHaveLength(0);

    await expect(
      getAdminAttendanceOptions(
        faculty,
        SEED_IDS.collegeA,
      ),
    ).rejects.toMatchObject({
      code: "LEARNING_ACCESS_DENIED",
    });

    if ("collegeB" in SEED_IDS) {
      await expect(
        getAdminAttendanceOptions(
          collegeAdmin,
          SEED_IDS.collegeB,
        ),
      ).rejects.toMatchObject({
        code: "LEARNING_ACCESS_DENIED",
      });
    }
  });

});
