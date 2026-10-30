import { deleteDisposableFixtureGradeEvents } from "../support/db045-immutable-grade-fixture-cleanup.mjs";
import { facultyAssessmentFixtureToken } from "../support/faculty-assessment-token";
import { randomUUID } from "node:crypto";
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
import { createLearnerProgramEnrollment } from "@/modules/academics/enrollment-service";
import { assignLearnerToSection } from "@/modules/academics/roster-service";
import { createCourse } from "@/modules/courses/course-service";
import { createCourseOffering } from "@/modules/courses/offering-service";
import { createCourseSectionDelivery } from "@/modules/courses/delivery-service";
import { createCourseTeachingAssignment } from "@/modules/courses/teaching-assignment-service";
import {
  createLearningPath,
  transitionLearningPath,
} from "@/modules/courses/learning-path-service";
import { createCourseLesson } from "@/modules/courses/lesson-service";
import {
  createCourseAssignment,
  listCourseAssignments,
  transitionCourseAssignment,
  updateCourseAssignment,
} from "@/modules/courses/assignment-service";
import {
  getMyAssignmentSubmission,
  gradeAssignmentSubmission,
  listAssignmentSubmissions,
  publishAssignmentGrade,
  submitCourseAssignment,
} from "@/modules/courses/assignment-submission-service";
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

// Dedicated disposable learner: other PG suites reuse the seeded learner for placement access.
// Never change an unrelated program enrollment just to set up assessment tests.
const c4aUserId=randomUUID();
const c4aMembershipId=randomUUID();
const c4aEmail="c4a-"+c4aUserId+"@example.test";
const learner: RequestContext = {
  user: {
    id: c4aUserId,
    identityUid: "c4a-"+c4aUserId,
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: c4aMembershipId,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

async function cleanupC4A() {
  // The immutable grade ledger retains strict submission identity. Fixture
  // teardown clears only its test-owned rows before removing the parent.
  await deleteDisposableFixtureGradeEvents(pool, 
    `delete from assignment_grade_events where assignment_submission_id in (
      select s.id from assignment_submissions s
      join course_assignments a on a.id=s.assignment_id
      join course_lessons cl on cl.id=a.lesson_id
      join course_learning_paths lp on lp.id=cl.learning_path_id
      join course_offerings co on co.id=lp.offering_id
      join courses c on c.id=co.course_id
      where c.code like 'C4A-%'
    )`,
  );
  await pool.query(
    `delete from assignment_submissions
     where assignment_id in (
       select a.id
       from course_assignments a
       join course_lessons cl on cl.id = a.lesson_id
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4A-%'
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
       where c.code like 'C4A-%'
     )`,
  );
  await pool.query(
    `delete from course_lessons
     where learning_path_id in (
       select lp.id
       from course_learning_paths lp
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4A-%'
     )`,
  );
  await pool.query(
    `delete from course_learning_paths
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'C4A-%'
     )`,
  );
  await pool.query(
    `delete from course_teaching_assignments
     where delivery_id in (
       select csd.id
       from course_section_deliveries csd
       join course_offerings co on co.id = csd.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4A-%'
     )`,
  );
  await pool.query(
    `delete from course_section_deliveries
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'C4A-%'
     )`,
  );
  await pool.query(
    `delete from course_offerings
     where course_id in (
       select id from courses
       where code like 'C4A-%'
     )`,
  );
  await pool.query("delete from program_term_courses where course_id in (select id from courses where code like 'C4A-%')");
  await pool.query(
    "delete from courses where code like 'C4A-%'",
  );
  await pool.query(
    `delete from section_enrollments
     where learner_enrollment_id in (
       select lpe.id
       from learner_program_enrollments lpe
       join programs p on p.id = lpe.program_id
       where p.code like 'C4A-%'
     )`,
  );
  await pool.query(
    `delete from learner_program_enrollments
     where program_id in (
       select id from programs
       where code like 'C4A-%'
     )`,
  );
  await pool.query(
    `delete from sections
     where cohort_id in (
       select c.id
       from cohorts c
       join programs p on p.id = c.program_id
       where p.code like 'C4A-%'
     )`,
  );
  await pool.query(
    `delete from cohorts
     where program_id in (
       select id from programs
       where code like 'C4A-%'
     )`,
  );
  await pool.query("delete from program_terms where program_id in (select id from programs where code like 'C4A-%')");
  await pool.query(
    "delete from programs where code like 'C4A-%'",
  );
  await pool.query(
    "delete from academic_periods where code like 'C4A-%'",
  );
}

async function createStructure() {
  const program = await createProgram(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "C4A Computer Science",
      code: "C4A-PROGRAM",
      durationTerms: 8,
    },
  );
  const period = await createAcademicPeriod(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      name: "C4A Semester 1",
      code: "C4A-PERIOD",
      startDate: "2026-07-01",
      endDate: "2027-12-31",
    },
  );
  const cohort = await createCohort(
    collegeAdmin,
    {
      programId: program.id,
      name: "C4A 2026 Intake",
      code: "C4A-COHORT",
      startPeriodId: period.id,
    },
  );
  const sectionA = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "C4A Section A",
      code: "C4A-A",
      capacity: 60,
    },
  );
  const sectionB = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "C4A Section B",
      code: "C4A-B",
      capacity: 60,
    },
  );
  const course = await createCourse(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "C4A Data Structures",
      code: "C4A-DS",
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

  await createCourseTeachingAssignment(
    collegeAdmin,
    {
      deliveryId: deliveryA.id,
      membershipId:
        SEED_IDS.facultyCollegeAMembership,
      role: "PRIMARY",
    },
  );

  const enrollment =
    await createLearnerProgramEnrollment(
      collegeAdmin,
      {
        membershipId:
          c4aMembershipId,
        programId: program.id,
        cohortId: cohort.id,
      },
    );
  await assignLearnerToSection(
    collegeAdmin,
    {
      learnerEnrollmentId: enrollment.id,
      sectionId: sectionA.id,
    },
  );

  const path = await createLearningPath(
    collegeAdmin,
    {
      offeringId: offering.id,
      title: "C4A Learning Path",
    },
  );
  const lesson = await createCourseLesson(
    collegeAdmin,
    {
      learningPathId: path.id,
      name: "C4A Arrays",
      sequence: 0,
    },
  );
  await transitionLearningPath(
    collegeAdmin,
    path.id,
    { action: "PUBLISH" },
  );

  return {
    course,
    offering,
    deliveryA,
    deliveryB,
    path,
    lesson,
  };
}

beforeEach(async () => {
  await cleanupC4A();
  // Keep canonical identities for immutable audit references after the suite.
  await pool.query(
    "INSERT INTO users(id,identity_uid,display_name,email,platform_status) VALUES($1,$2,'C4A Learner',$3,'ACTIVE') ON CONFLICT(id) DO NOTHING",
    [c4aUserId,"c4a-"+c4aUserId,c4aEmail],
  );
  await pool.query(
    "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1,$2,$3,'ACTIVE') ON CONFLICT(id) DO NOTHING",
    [c4aMembershipId,c4aUserId,SEED_IDS.collegeA],
  );
  await pool.query(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'LEARNER') ON CONFLICT(membership_id,role) DO NOTHING",
    [c4aMembershipId],
  );
});

afterAll(async () => {
  await cleanupC4A();
  await pool.end();
  await closeDatabaseConnection();
});

describe("courses C4A assignments against PostgreSQL", () => {
  it("keeps generic assignment structure admin-owned and exact delivery assignments teacher-scoped", async () => {
    const structure = await createStructure();

    const generic =
      await createCourseAssignment(
        collegeAdmin,
        {
          lessonId: structure.lesson.id,
          title: "C4A Shared Assignment",
          description: "Shared task",
          dueAt:
            "2027-12-01T12:00:00.000Z",
          maxPoints: 10,
          sequence: 0,
        },
      );

    await expect(
      createCourseAssignment(faculty, {
        lessonId: structure.lesson.id,
        title: "C4A Unsafe Shared",
        maxPoints: 10,
        sequence: 1,
      }),
    ).rejects.toBeInstanceOf(
      AuthorizationError,
    );

    const exact =
      await createCourseAssignment(
        faculty,
        {
          lessonId: structure.lesson.id,
          deliveryId:
            structure.deliveryA.id,
          title: "C4A Section A Assignment",
          dueAt:
            "2027-12-01T12:00:00.000Z",
          maxPoints: 20,
          sequence: 1,
        },
      );

    await expect(
      createCourseAssignment(faculty, {
        lessonId: structure.lesson.id,
        deliveryId:
          structure.deliveryB.id,
        title: "C4A Section B Unauthorized",
        maxPoints: 20,
        sequence: 2,
      }),
    ).rejects.toMatchObject({
      code: "FACULTY_TEACHING_SCOPE_REQUIRED",
    });

    await transitionCourseAssignment(
      collegeAdmin,
      generic.id,
      { action: "PUBLISH" },
    );
    await transitionCourseAssignment(
      faculty,
      exact.id,
      {...await facultyAssessmentFixtureToken(pool,"ASSIGNMENT",exact.id),  action: "PUBLISH" },
    );

    const learnerAssignments =
      await listCourseAssignments(
        learner,
        structure.lesson.id,
        structure.deliveryA.id,
      );

    expect(
      learnerAssignments.map(
        (item) => item.id,
      ),
    ).toEqual([generic.id, exact.id]);

    const publishEvents =
      await pool.query<{
        subject_id: string;
      }>(
        `select subject_id
           from activity_events
          where event_type =
            'courses.assignment.published'
            and subject_id = any($1::text[])`,
        [[generic.id, exact.id]],
      );
    expect(
      new Set(
        publishEvents.rows.map(
          (row) => row.subject_id,
        ),
      ),
    ).toEqual(
      new Set([generic.id, exact.id]),
    );

    await expect(
      listCourseAssignments(
        learner,
        structure.lesson.id,
        structure.deliveryB.id,
      ),
    ).rejects.toMatchObject({
      code:
        "LEARNER_ENROLLMENT_SCOPE_REQUIRED",
    });
  });

  it("enforces one-shot submission, rejects late or missing-deadline submissions, and checks assignment audience", async () => {
    const structure = await createStructure();
    const assignment =
      await createCourseAssignment(
        collegeAdmin,
        {
          lessonId: structure.lesson.id,
          title: "C4A Submission Task",
          allowedMethods: ["WRITTEN_RESPONSE","REPOSITORY_LINK","EXTERNAL_LINK"],
          dueAt:
            "2027-12-01T12:00:00.000Z",
          maxPoints: 10,
          sequence: 0,
        },
      );
    await transitionCourseAssignment(
      collegeAdmin,
      assignment.id,
      { action: "PUBLISH" },
    );

    const submission =
      await submitCourseAssignment(
        learner,
        assignment.id,
        {
          deliveryId:
            structure.deliveryA.id,
          submissionType: "TEXT",
          textContent:
            "My assignment answer",
        },
      );

    expect(submission).toMatchObject({
      assignmentId: assignment.id,
      deliveryId: structure.deliveryA.id,
      membershipId:
        c4aMembershipId,
      submissionType: "TEXT",
      gradePublished: false,
      pointsAwarded: null,
    });

    // A previously accepted submission must remain one-shot even if a
    // migrated assignment's allowed methods are later narrowed in SQL.
    await pool.query(
      "update course_assignments set allowed_submission_methods = $1::jsonb where id = $2",
      [JSON.stringify(["PDF_UPLOAD"]), assignment.id],
    );

    await expect(
      submitCourseAssignment(
        learner,
        assignment.id,
        {
          deliveryId:
            structure.deliveryA.id,
          submissionType: "TEXT",
          textContent:
            "Duplicate submission must be rejected",
        },
      ),
    ).rejects.toMatchObject({
      code: "ASSIGNMENT_ALREADY_SUBMITTED",
    });

    await expect(
      submitCourseAssignment(
        learner,
        assignment.id,
        {
          deliveryId:
            structure.deliveryB.id,
          submissionType: "TEXT",
          textContent: "Wrong section",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "LEARNER_ENROLLMENT_SCOPE_REQUIRED",
    });

    await expect(
      updateCourseAssignment(
        collegeAdmin,
        assignment.id,
        { maxPoints: 20 },
      ),
    ).rejects.toMatchObject({
      code: "ASSIGNMENT_HAS_SUBMISSIONS",
    });

    const late =
      await createCourseAssignment(
        collegeAdmin,
        {
          lessonId: structure.lesson.id,
          title: "C4A Late Submission Task",
          dueAt:
            "2027-12-02T12:00:00.000Z",
          maxPoints: 5,
          sequence: 2,
        },
      );
    await transitionCourseAssignment(
      collegeAdmin,
      late.id,
      { action: "PUBLISH" },
    );
    await pool.query(
      "update course_assignments set due_at = $1 where id = $2",
      ["2020-01-01T12:00:00.000Z", late.id],
    );

    await expect(submitCourseAssignment(learner,late.id,{
      deliveryId:structure.deliveryA.id,submissionType:"TEXT",textContent:"Too late",
    })).rejects.toMatchObject({code:"ASSIGNMENT_DEADLINE_PASSED"});
    const [lateCount] = (await pool.query<{n:number}>(
      "select count(*)::int as n from assignment_submissions where assignment_id=$1", [late.id],
    )).rows;
    expect(lateCount?.n).toBe(0);

    const undated=await createCourseAssignment(collegeAdmin,{
      lessonId:structure.lesson.id,title:"C4A No Deadline Task",maxPoints:5,sequence:3,
    });
    // Publishing now requires a future deadline, so legacy undated rows are simulated in SQL.
    await expect(transitionCourseAssignment(collegeAdmin,undated.id,{action:"PUBLISH"}))
      .rejects.toMatchObject({code:"ASSIGNMENT_DEADLINE_PASSED"});
    await pool.query(
      "update course_assignments set due_at = $1 where id = $2",
      ["2027-12-03T12:00:00.000Z", undated.id],
    );
    await transitionCourseAssignment(collegeAdmin,undated.id,{action:"PUBLISH"});
    await pool.query("update course_assignments set due_at = null where id = $1",[undated.id]);
    await expect(submitCourseAssignment(learner,undated.id,{
      deliveryId:structure.deliveryA.id,submissionType:"TEXT",textContent:"No deadline",
    })).rejects.toMatchObject({code:"ASSIGNMENT_DEADLINE_NOT_CONFIGURED"});

    const expired =
      await createCourseAssignment(
        collegeAdmin,
        {
          lessonId: structure.lesson.id,
          title: "C4A Expired Task",
          dueAt:
            "2020-01-01T12:00:00.000Z",
          maxPoints: 5,
          sequence: 1,
        },
      );

    await expect(
      transitionCourseAssignment(
        collegeAdmin,
        expired.id,
        { action: "PUBLISH" },
      ),
    ).rejects.toMatchObject({
      code: "ASSIGNMENT_DEADLINE_PASSED",
    });
  });

  it("hides unpublished grades and rejects stale concurrent grading", async () => {
    const structure = await createStructure();
    const assignment =
      await createCourseAssignment(
        faculty,
        {
          lessonId: structure.lesson.id,
          deliveryId:
            structure.deliveryA.id,
          title: "C4A Graded Task",
          allowedMethods: ["WRITTEN_RESPONSE"],
          dueAt:
            "2027-12-01T12:00:00.000Z",
          maxPoints: 10,
          sequence: 0,
        },
      );
    await transitionCourseAssignment(
      faculty,
      assignment.id,
      {...await facultyAssessmentFixtureToken(pool,"ASSIGNMENT",assignment.id),  action: "PUBLISH" },
    );

    // A written-response-only assignment must reject a link before a valid submission exists.
    await expect(submitCourseAssignment(learner, assignment.id, {
      deliveryId: structure.deliveryA.id,
      submissionType: "LINK",
      submissionUrl: "https://example.com/submission",
    })).rejects.toMatchObject({code:"ASSIGNMENT_METHOD_NOT_ALLOWED"});

    const submitted =
      await submitCourseAssignment(
        learner,
        assignment.id,
        {
          deliveryId:
            structure.deliveryA.id,
          submissionType: "TEXT",
          textContent:
            "Grading workflow submission",
        },
      );

    const rows =
      await listAssignmentSubmissions(
        faculty,
        assignment.id,
        structure.deliveryA.id,
      );
    expect(rows).toEqual([
      expect.objectContaining({
        id: submitted.id,
        version: 0,
        learnerDisplayName: "C4A Learner",
        learnerEmail:
          c4aEmail,
      }),
    ]);

    const graded =
      await gradeAssignmentSubmission(
        faculty,
        submitted.id,
        {
          pointsAwarded: 8,
          feedback: "Good work",
          expectedVersion: 0,
        },
      );

    expect(graded).toMatchObject({
      pointsAwarded: 8,
      feedback: "Good work",
      gradingStatus: "GRADED",
      gradePublished: false,
      version: 1,
    });
    // DB045: real grading producer persists a row; unlike disposable
    // fixture cleanup, normal SQL cannot rewrite or erase its history.
    await expect(pool.query(
      "UPDATE assignment_grade_events SET action=action WHERE assignment_submission_id=$1",
      [submitted.id],
    )).rejects.toMatchObject({ code: "23514" });
    await expect(pool.query(
      "DELETE FROM assignment_grade_events WHERE assignment_submission_id=$1",
      [submitted.id],
    )).rejects.toMatchObject({ code: "23514" });


    const hidden =
      await getMyAssignmentSubmission(
        learner,
        assignment.id,
        structure.deliveryA.id,
      );

    expect(hidden).toMatchObject({
      pointsAwarded: null,
      feedback: null,
      gradingStatus: "NOT_GRADED",
      gradePublished: false,
    });

    await expect(
      gradeAssignmentSubmission(
        faculty,
        submitted.id,
        {
          pointsAwarded: 9,
          expectedVersion: 0,
        },
      ),
    ).rejects.toMatchObject({
      code:
        "ASSIGNMENT_SUBMISSION_CONFLICT",
    });

    const published =
      await publishAssignmentGrade(
        faculty,
        submitted.id,
        { expectedVersion: 1 },
      );

    expect(published).toMatchObject({
      pointsAwarded: 8,
      gradePublished: true,
      version: 2,
    });

    // Published idempotency is allowed only at the CURRENT version.
    // A stale browser token must not silently succeed or create an audit.
    await expect(publishAssignmentGrade(
      faculty,submitted.id,{expectedVersion:1},
    )).rejects.toMatchObject({code:"ASSIGNMENT_SUBMISSION_CONFLICT"});
    const repeated = await publishAssignmentGrade(
      faculty,submitted.id,{expectedVersion:2},
    );
    expect(repeated.version).toBe(2);
    await expect(publishAssignmentGrade(
      learner,submitted.id,{expectedVersion:2},
    )).rejects.toBeDefined();
    await expect(gradeAssignmentSubmission(
      learner,submitted.id,{
        pointsAwarded:10,feedback:"Forged",expectedVersion:2,
      },
    )).rejects.toBeDefined();
    const injectedGrade = {
      pointsAwarded:10,feedback:"Forged",expectedVersion:2,
      collegeId:SEED_IDS.collegeB,
    };
    await expect(gradeAssignmentSubmission(
      faculty,submitted.id,injectedGrade,
    )).rejects.toBeDefined();

    const visible =
      await getMyAssignmentSubmission(
        learner,
        assignment.id,
        structure.deliveryA.id,
      );

    expect(visible).toMatchObject({
      pointsAwarded: 8,
      feedback: "Good work",
      gradingStatus: "GRADED",
      gradePublished: true,
    });

    const regraded =
      await gradeAssignmentSubmission(
        faculty,
        submitted.id,
        {
          pointsAwarded: 9,
          feedback: "Regraded",
          expectedVersion: 2,
        },
      );

    expect(regraded).toMatchObject({
      pointsAwarded: 9,
      gradePublished: false,
      version: 3,
    });

    const hiddenAgain =
      await getMyAssignmentSubmission(
        learner,
        assignment.id,
        structure.deliveryA.id,
      );

    expect(hiddenAgain?.pointsAwarded).toBeNull();

    // Only successful versioned transitions create an activity event.
    // The stale-version failure above must not leave a phantom grade audit.
    const audit = await pool.query<{
      event_type: string;
      actor_user_id: string;
      metadata: Record<string, unknown>;
      summary: string;
    }>(
      `select event_type, actor_user_id, metadata, summary
         from activity_events
        where subject_type = 'assignment_submission' and subject_id = $1
        order by occurred_at, id`,
      [submitted.id],
    );
    expect(audit.rows.map((row) => row.event_type).sort()).toEqual([
      "courses.assignment.grade_published",
      "courses.assignment.graded",
      "courses.assignment.graded",
    ].sort());
    expect(audit.rows.every((row) => row.actor_user_id === faculty.user.id))
      .toBe(true);
    expect(audit.rows.map((row) => (row.metadata as { version: number }).version).sort())
      .toEqual([1, 2, 3]);
    expect(JSON.stringify(audit.rows)).not.toContain("Good work");
    expect(JSON.stringify(audit.rows)).not.toContain("Regraded");
    expect(audit.rows.every((row) => !("pointsAwarded" in row.metadata)))
      .toBe(true);
  });

  it("enforces grade bounds and database payload constraints", async () => {
    const structure = await createStructure();
    const assignment =
      await createCourseAssignment(
        collegeAdmin,
        {
          lessonId: structure.lesson.id,
          title: "C4A Constraint Task",
          allowedMethods: ["WRITTEN_RESPONSE"],
          dueAt:
            "2027-12-01T12:00:00.000Z",
          maxPoints: 10,
          sequence: 0,
        },
      );
    await transitionCourseAssignment(
      collegeAdmin,
      assignment.id,
      { action: "PUBLISH" },
    );

    const submission =
      await submitCourseAssignment(
        learner,
        assignment.id,
        {
          deliveryId:
            structure.deliveryA.id,
          submissionType: "TEXT",
          textContent: "Constraint answer",
        },
      );

    // DB045: a direct SQL grade or feedback edit cannot commit without its
    // immutable 0205 ledger transition. A denied write must preserve the CAS token.
    await expect(pool.query(
      `update assignment_submissions set grading_status='GRADED',
         points_awarded=3, graded_by_user_id=$2, graded_at=now(),
         version=version+1 where id=$1`,
      [submission.id, faculty.user.id],
    )).rejects.toMatchObject({ code: "23514" });
    await expect(pool.query(
      `update assignment_submissions set feedback='unaudited edit',
         version=version+1 where id=$1`,
      [submission.id],
    )).rejects.toMatchObject({ code: "23514" });
    const unaltered = await pool.query<{version:number, grading_status:string}>(
      "select version,grading_status from assignment_submissions where id=$1",
      [submission.id],
    );
    expect(unaltered.rows[0]).toMatchObject({ version: 0, grading_status: "NOT_GRADED" });

    await expect(
      gradeAssignmentSubmission(
        collegeAdmin,
        submission.id,
        {
          pointsAwarded: 11,
          expectedVersion: 0,
        },
      ),
    ).rejects.toMatchObject({
      code: "ASSIGNMENT_GRADE_INVALID",
    });

    await expect(
      pool.query(
        `insert into assignment_submissions
          (assignment_id, delivery_id, membership_id, submission_type, text_content)
         values ($1, $2, $3, 'TEXT', '    ')`,
        [
          assignment.id,
          structure.deliveryA.id,
          SEED_IDS.facultyCollegeAMembership,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });

    // The database permits zero-point legacy tasks; negative points are invalid.
    await expect(
      pool.query(
        `insert into course_assignments
          (lesson_id, title, max_points, sequence, created_by_user_id)
         values ($1, 'C4A Bad Points', -1, 5, $2)`,
        [
          structure.lesson.id,
          SEED_IDS.collegeAdminUser,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });
  });
  it("rejects submission if a faculty archive commits during the write race", async () => {
    const structure = await createStructure();
    const assignment = await createCourseAssignment(collegeAdmin, {
      lessonId: structure.lesson.id,
      title: "C4A Archive Race Task",
      allowedMethods: ["WRITTEN_RESPONSE"],
      dueAt: "2027-12-01T12:00:00.000Z",
      maxPoints: 10,
      sequence: 0,
    });
    await transitionCourseAssignment(collegeAdmin, assignment.id, { action: "PUBLISH" });
    const holder = await pool.connect();
    let began = false;
    try {
      await holder.query("begin");
      began = true;
      await holder.query(
        "update course_assignments set status='ARCHIVED' where id=$1",
        [assignment.id],
      );
      const submission = submitCourseAssignment(learner, assignment.id, {
        deliveryId: structure.deliveryA.id,
        submissionType: "TEXT",
        textContent: "Should never be saved",
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
      await holder.query("commit");
      began = false;
      await expect(submission).rejects.toMatchObject({
        code: "ASSIGNMENT_NOT_PUBLISHED",
      });
      // The fixture pool has max:1 and holder is still checked out here.
      // Querying pool.query would self-deadlock until the test times out.
      const result = await holder.query(
        "select count(*)::int as n from assignment_submissions where assignment_id=$1",
        [assignment.id],
      );
      expect(result.rows[0].n).toBe(0);
    } finally {
      if (began) await holder.query("rollback");
      holder.release();
    }
  });

});
