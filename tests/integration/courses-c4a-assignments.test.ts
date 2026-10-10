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

async function cleanupC4A() {
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
          SEED_IDS.learnerCollegeAMembership,
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
      { action: "PUBLISH" },
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

  it("enforces one-shot submission, keeps published late work submittable, and checks assignment audience", async () => {
    const structure = await createStructure();
    const assignment =
      await createCourseAssignment(
        collegeAdmin,
        {
          lessonId: structure.lesson.id,
          title: "C4A Submission Task",
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
        SEED_IDS.learnerCollegeAMembership,
      submissionType: "TEXT",
      gradePublished: false,
      pointsAwarded: null,
    });

    await expect(
      submitCourseAssignment(
        learner,
        assignment.id,
        {
          deliveryId:
            structure.deliveryA.id,
          submissionType: "LINK",
          submissionUrl:
            "https://example.com/answer",
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

    const lateSubmission =
      await submitCourseAssignment(
        learner,
        late.id,
        {
          deliveryId:
            structure.deliveryA.id,
          submissionType: "TEXT",
          textContent:
            "Late but still accepted",
        },
      );

    expect(lateSubmission).toMatchObject({
      assignmentId: late.id,
      membershipId:
        SEED_IDS.learnerCollegeAMembership,
    });

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
          dueAt:
            "2027-12-01T12:00:00.000Z",
          maxPoints: 10,
          sequence: 0,
        },
      );
    await transitionCourseAssignment(
      faculty,
      assignment.id,
      { action: "PUBLISH" },
    );

    const submitted =
      await submitCourseAssignment(
        learner,
        assignment.id,
        {
          deliveryId:
            structure.deliveryA.id,
          submissionType: "LINK",
          submissionUrl:
            "https://example.com/submission",
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
        learnerDisplayName: "Seed Learner",
        learnerEmail:
          "learner.seed@example.com",
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
  });

  it("enforces grade bounds and database payload constraints", async () => {
    const structure = await createStructure();
    const assignment =
      await createCourseAssignment(
        collegeAdmin,
        {
          lessonId: structure.lesson.id,
          title: "C4A Constraint Task",
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
         values ($1, $2, $3, 'LINK', 'invalid-shape')`,
        [
          assignment.id,
          structure.deliveryA.id,
          SEED_IDS.facultyCollegeAMembership,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });

    await expect(
      pool.query(
        `insert into course_assignments
          (lesson_id, title, max_points, sequence, created_by_user_id)
         values ($1, 'C4A Bad Points', 0, 5, $2)`,
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
      const result = await pool.query(
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
