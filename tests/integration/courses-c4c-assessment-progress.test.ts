import { deleteDisposableFixtureGradeEvents } from "../support/db045-immutable-grade-fixture-cleanup.mjs";
import { randomUUID } from "node:crypto";
import {
  afterAll,
  beforeAll,
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
import {
  createLearningPath,
  transitionLearningPath,
} from "@/modules/courses/learning-path-service";
import { createCourseLesson } from "@/modules/courses/lesson-service";
import {
  createLessonContent,
  transitionLessonContent,
} from "@/modules/courses/lesson-content-service";
import { saveLearnerContentProgress } from "@/modules/courses/progress-service";
import {
  createCourseAssignment,
  transitionCourseAssignment,
  updateCourseAssignment,
} from "@/modules/courses/assignment-service";
import {
  gradeAssignmentSubmission,
  listAssignmentSubmissionGradeActivity,
  publishAssignmentGrade,
  submitCourseAssignment,
} from "@/modules/courses/assignment-submission-service";
import {
  createCourseQuiz,
  getCourseQuiz,
  transitionCourseQuiz,
  updateCourseQuiz,
} from "@/modules/courses/quiz-service";
import { submitCourseQuiz } from "@/modules/courses/quiz-attempt-service";
import { getLearnerCourseWorkspace } from "@/modules/courses/learner-course-service";
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

// Use a separate learner for C4C: the seed already owns an active program
// enrollment, and sharing it masks assessment assertions behind DB02 uniques.
const learnerUserId = randomUUID();
const learnerMembershipId = randomUUID();
const learner: RequestContext = {
  user: {
    id: learnerUserId,
    identityUid: `c4c-fixture-${learnerUserId}`,
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: learnerMembershipId,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

async function cleanupC4C() {
  await pool.query(
    `delete from quiz_attempt_answers
     where attempt_id in (
       select qa.id from quiz_attempts qa
       join course_quizzes q on q.id = qa.quiz_id
       join course_lessons cl on cl.id = q.lesson_id
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from quiz_attempts
     where quiz_id in (
       select q.id from course_quizzes q
       join course_lessons cl on cl.id = q.lesson_id
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from quiz_options
     where question_id in (
       select qq.id from quiz_questions qq
       join course_quizzes q on q.id = qq.quiz_id
       join course_lessons cl on cl.id = q.lesson_id
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from quiz_questions
     where quiz_id in (
       select q.id from course_quizzes q
       join course_lessons cl on cl.id = q.lesson_id
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from course_quizzes
     where lesson_id in (
       select cl.id from course_lessons cl
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
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
      where c.code like 'C4C-%'
    )`,
  );
  await pool.query(
    `delete from assignment_submissions
     where assignment_id in (
       select a.id from course_assignments a
       join course_lessons cl on cl.id = a.lesson_id
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from course_assignments
     where lesson_id in (
       select cl.id from course_lessons cl
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from learner_content_progress
     where lesson_content_id in (
       select lc.id from lesson_contents lc
       join course_lessons cl on cl.id = lc.lesson_id
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from lesson_contents
     where lesson_id in (
       select cl.id from course_lessons cl
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from course_lessons
     where learning_path_id in (
       select lp.id from course_learning_paths lp
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from course_learning_paths
     where offering_id in (
       select co.id from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from course_teaching_assignments
     where delivery_id in (
       select csd.id from course_section_deliveries csd
       join course_offerings co on co.id = csd.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from course_section_deliveries
     where offering_id in (
       select co.id from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from course_offerings
     where course_id in (
       select id from courses
       where code like 'C4C-%'
     )`,
  );
  await pool.query("delete from program_term_courses where course_id in (select id from courses where code like 'C4C-%')");
  await pool.query(
    "delete from courses where code like 'C4C-%'",
  );
  await pool.query(
    `delete from section_enrollments
     where learner_enrollment_id in (
       select lpe.id from learner_program_enrollments lpe
       join programs p on p.id = lpe.program_id
       where p.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from learner_program_enrollments
     where program_id in (
       select id from programs
       where code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from sections
     where cohort_id in (
       select c.id from cohorts c
       join programs p on p.id = c.program_id
       where p.code like 'C4C-%'
     )`,
  );
  await pool.query(
    `delete from cohorts
     where program_id in (
       select id from programs
       where code like 'C4C-%'
     )`,
  );
  await pool.query("delete from program_terms where program_id in (select id from programs where code like 'C4C-%')");
  await pool.query(
    "delete from programs where code like 'C4C-%'",
  );
  await pool.query(
    "delete from academic_periods where code like 'C4C-%'",
  );
}

async function createStructure() {
  const program = await createProgram(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "C4C Computer Science",
      code: "C4C-PROGRAM",
      durationTerms: 8,
    },
  );
  const period = await createAcademicPeriod(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      name: "C4C Semester 1",
      code: "C4C-PERIOD",
      startDate: "2026-07-01",
      endDate: "2027-12-31",
    },
  );
  const cohort = await createCohort(
    collegeAdmin,
    {
      programId: program.id,
      name: "C4C 2026 Intake",
      code: "C4C-COHORT",
      startPeriodId: period.id,
    },
  );
  const sectionA = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "C4C Section A",
      code: "C4C-A",
    },
  );
  const sectionB = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "C4C Section B",
      code: "C4C-B",
    },
  );
  const course = await createCourse(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "C4C Data Structures",
      code: "C4C-DS",
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
  const enrollment =
    await createLearnerProgramEnrollment(
      collegeAdmin,
      {
        membershipId:
          learnerMembershipId,
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
      title: "C4C Learning Path",
    },
  );
  const lesson = await createCourseLesson(
    collegeAdmin,
    {
      learningPathId: path.id,
      name: "C4C Arrays",
      sequence: 0,
    },
  );

  const resource = await createLessonContent(
    collegeAdmin,
    {
      lessonId: lesson.id,
      contentType: "RESOURCE",
      points: 1,
      title: "C4C Notes",
      notes: "Read the notes",
      sequence: 0,
    },
  );
  await transitionLessonContent(
    collegeAdmin,
    resource.id,
    { action: "PUBLISH" },
  );

  const assignment =
    await createCourseAssignment(
      collegeAdmin,
      {
        lessonId: lesson.id,
        title: "C4C Practice",
        dueAt:
          "2027-12-01T12:00:00.000Z",
        maxPoints: 10,
        sequence: 1,
      },
    );
  await transitionCourseAssignment(
    collegeAdmin,
    assignment.id,
    { action: "PUBLISH" },
  );

  const quiz = await createCourseQuiz(
    collegeAdmin,
    {
      lessonId: lesson.id,
      title: "C4C Checkpoint",
      dueAt:
        "2027-12-01T12:00:00.000Z",
      maxAttempts: 1, shuffleQuestions: false, shuffleOptions: false,
      sequence: 2,
      questions: [
        {
          type: "SINGLE_CHOICE",
          prompt: "FIFO means?",
          points: 5,
          sequence: 0,
          options: [
            {
              text: "First in first out",
              correct: true,
              sequence: 0,
            },
            {
              text: "First in last out",
              correct: false,
              sequence: 1,
            },
          ],
        },
      ],
    },
  );
  await transitionCourseQuiz(
    collegeAdmin,
    quiz.id,
    { action: "PUBLISH" },
  );

  const siblingAssignment =
    await createCourseAssignment(
      collegeAdmin,
      {
        lessonId: lesson.id,
        deliveryId: deliveryB.id,
        title: "C4C Section B Assignment",
        dueAt:
          "2027-12-01T12:00:00.000Z",
        maxPoints: 10,
        sequence: 3,
      },
    );
  await transitionCourseAssignment(
    collegeAdmin,
    siblingAssignment.id,
    { action: "PUBLISH" },
  );

  const siblingQuiz = await createCourseQuiz(
    collegeAdmin,
    {
      lessonId: lesson.id,
      deliveryId: deliveryB.id,
      title: "C4C Section B Quiz",
      dueAt:
        "2027-12-01T12:00:00.000Z",
      maxAttempts: 1, shuffleQuestions: false, shuffleOptions: false,
      sequence: 4,
      questions: [
        {
          type: "SINGLE_CHOICE",
          prompt: "Section B only?",
          points: 1,
          sequence: 0,
          options: [
            {
              text: "Yes",
              correct: true,
              sequence: 0,
            },
            {
              text: "No",
              correct: false,
              sequence: 1,
            },
          ],
        },
      ],
    },
  );
  await transitionCourseQuiz(
    collegeAdmin,
    siblingQuiz.id,
    { action: "PUBLISH" },
  );

  await transitionLearningPath(
    collegeAdmin,
    path.id,
    { action: "PUBLISH" },
  );

  return {
    deliveryA,
    deliveryB,
    lesson,
    resource,
    assignment,
    quiz,
    siblingAssignment,
    siblingQuiz,
  };
}

beforeAll(async () => {
  await pool.query(
    "insert into users (id, identity_uid, display_name) values ($1,$2,$3)",
    [learnerUserId, `c4c-fixture-${learnerUserId}`, "C4C learner fixture"],
  );
  await pool.query(
    "insert into college_memberships (id, user_id, college_id) values ($1,$2,$3)",
    [learnerMembershipId, learnerUserId, SEED_IDS.collegeA],
  );
  await pool.query(
    "insert into membership_roles (membership_id, role) values ($1,'LEARNER')",
    [learnerMembershipId],
  );
});

beforeEach(async () => {
  await cleanupC4C();
});

afterAll(async () => {
  await cleanupC4C();
  // Audit history may retain this disposable actor; CI removes the database.
  await pool.end();
  await closeDatabaseConnection();
});

describe("courses C4C assessment aggregation", () => {
  it("moves Continue Learning across content, assignment and quiz in deterministic order", async () => {
    const structure = await createStructure();

    const initial =
      await getLearnerCourseWorkspace(
        learner,
        structure.deliveryA.id,
      );

    expect(
      initial.lessons[0]?.items.map(
        (item) => [
          item.kind,
          item.id,
          item.sequence,
        ],
      ),
    ).toEqual([
      ["CONTENT", structure.resource.id, 0],
      [
        "ASSIGNMENT",
        structure.assignment.id,
        1,
      ],
      ["QUIZ", structure.quiz.id, 2],
    ]);
    expect(
      initial.lessons[0]?.assignments.some(
        (item) =>
          item.id ===
          structure.siblingAssignment.id,
      ),
    ).toBe(false);
    expect(
      initial.lessons[0]?.quizzes.some(
        (item) =>
          item.id === structure.siblingQuiz.id,
      ),
    ).toBe(false);
    expect(initial.summary).toMatchObject({
      overallPercent: 0,
      contentsTotal: 1,
      assignmentsTotal: 1,
      quizzesTotal: 1,
      itemsTotal: 3,
      itemsCompleted: 0,
    });
    expect(initial.nextItem).toMatchObject({
      kind: "CONTENT",
      itemId: structure.resource.id,
    });

    await saveLearnerContentProgress(
      learner,
      structure.resource.id,
      {
        deliveryId: structure.deliveryA.id,
        completed: true,
      },
    );

    const afterContent =
      await getLearnerCourseWorkspace(
        learner,
        structure.deliveryA.id,
      );
    expect(afterContent.summary.overallPercent).toBe(
      33,
    );
    expect(afterContent.nextItem).toMatchObject({
      kind: "ASSIGNMENT",
      itemId: structure.assignment.id,
    });

    const submission =
      await submitCourseAssignment(
        learner,
        structure.assignment.id,
        {
          deliveryId: structure.deliveryA.id,
          submissionType: "TEXT",
          textContent: "My answer",
        },
      );

    const graded =
      await gradeAssignmentSubmission(
        collegeAdmin,
        submission.id,
        {
          pointsAwarded: 8,
          feedback:
            "Good explanation of the queue behavior.",
          expectedVersion: 0,
        },
      );
    await publishAssignmentGrade(
      collegeAdmin,
      submission.id,
      {
        expectedVersion: graded.version,
      },
    );

    const gradeLedger = (await pool.query<{
      action:string;previous_points:number|null;new_points:number|null;
      submission_version_before:number;submission_version_after:number;
    }>(
      `select action,previous_points,new_points,
        submission_version_before,submission_version_after
       from assignment_grade_events where assignment_submission_id=$1
       order by submission_version_after`,
      [submission.id],
    )).rows;
    // Grading and publishing are separately committed immutable versions.
    expect(gradeLedger).toMatchObject([
      {action:"GRADE",previous_points:null,new_points:8,
        submission_version_before:0,submission_version_after:1},
      {action:"PUBLISH_GRADE",previous_points:8,new_points:8,
        submission_version_before:1,submission_version_after:2},
    ]);

    const staffGradeHistory=await listAssignmentSubmissionGradeActivity(collegeAdmin,submission.id);
    expect(staffGradeHistory.detailedPointsHistoryAvailable).toBe(true);
    expect(staffGradeHistory.gradeEvents.map(event=>event.action))
      .toEqual(["PUBLISH_GRADE","GRADE"]);

    const afterAssignment =
      await getLearnerCourseWorkspace(
        learner,
        structure.deliveryA.id,
      );
    expect(
      afterAssignment.summary.overallPercent,
    ).toBe(67);
    expect(afterAssignment.summary).toMatchObject({
      assignmentsCompleted: 1,
      itemsCompleted: 2,
    });
    expect(afterAssignment.nextItem).toMatchObject({
      kind: "QUIZ",
      itemId: structure.quiz.id,
    });
    expect(
      afterAssignment.lessons[0]
        ?.assignments[0],
    ).toMatchObject({
      gradePublished: true,
      pointsAwarded: 8,
      feedback:
        "Good explanation of the queue behavior.",
      gradingStatus: "GRADED",
      progress: {
        status: "COMPLETED",
        percentComplete: 100,
      },
    });

    const quizView = await getCourseQuiz(
      collegeAdmin,
      structure.quiz.id,
    );
    const question = quizView.questions[0]!;
    const correct = question.options
      .filter((option) => option.correct)
      .map((option) => option.id);

    await submitCourseQuiz(
      learner,
      structure.quiz.id,
      {
        deliveryId: structure.deliveryA.id,
        answers: [
          {
            questionId: question.id,
            selectedOptionIds: correct,
          },
        ],
      },
    );

    const complete =
      await getLearnerCourseWorkspace(
        learner,
        structure.deliveryA.id,
      );
    expect(complete.summary).toMatchObject({
      overallPercent: 100,
      lessonsCompleted: 1,
      contentsCompleted: 1,
      assignmentsCompleted: 1,
      quizzesCompleted: 1,
      itemsCompleted: 3,
      itemsTotal: 3,
      itemsMissed: 0,
    });
    expect(complete.nextItem).toBeNull();
    expect(
      complete.lessons[0]?.quizzes[0],
    ).toMatchObject({
      attemptsUsed: 1,
      attemptsRemaining: 0,
      progress: {
        status: "COMPLETED",
        percentComplete: 100,
      },
    });
  });

  it("keeps overdue assignments actionable while expired quizzes are MISSED", async () => {
    const structure = await createStructure();

    await updateCourseAssignment(
      collegeAdmin,
      structure.assignment.id,
      {
        dueAt:
          "2020-01-01T12:00:00.000Z",
      },
    );
    await updateCourseQuiz(
      collegeAdmin,
      structure.quiz.id,
      {
        dueAt:
          "2020-01-01T12:00:00.000Z",
      },
    );
    await saveLearnerContentProgress(
      learner,
      structure.resource.id,
      {
        deliveryId: structure.deliveryA.id,
        completed: true,
      },
    );

    const workspace =
      await getLearnerCourseWorkspace(
        learner,
        structure.deliveryA.id,
      );

    expect(workspace.summary).toMatchObject({
      overallPercent: 33,
      assignmentsMissed: 0,
      quizzesMissed: 1,
      itemsCompleted: 1,
      itemsMissed: 1,
      itemsTotal: 3,
    });
    expect(
      workspace.lessons[0]?.assignments[0]
        ?.progress.status,
    ).toBe("NOT_STARTED");
    expect(
      workspace.lessons[0]?.quizzes[0]
        ?.progress.status,
    ).toBe("MISSED");
    // Late assignment submission remains legal in the legacy LMS and this
    // must stay a valid Continue Learning action, unlike an expired quiz.
    expect(workspace.nextItem).toMatchObject({
      kind: "ASSIGNMENT",
      itemId: structure.assignment.id,
    });
    expect(
      workspace.summary.lessonsCompleted,
    ).toBe(0);
  });
});
