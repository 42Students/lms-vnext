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
  createCourseQuiz,
  getCourseQuiz,
  listCourseQuizzes,
  setCourseQuizResults,
  transitionCourseQuiz,
  updateCourseQuiz,
} from "@/modules/courses/quiz-service";
import {
  getMyQuizAttempts,
  listQuizAttempts,
  submitCourseQuiz,
} from "@/modules/courses/quiz-attempt-service";
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
  max: 4,
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

async function cleanupC4B() {
  await pool.query(
    `delete from quiz_attempt_answers
     where attempt_id in (
       select qa.id
       from quiz_attempts qa
       join course_quizzes q on q.id = qa.quiz_id
       join course_lessons cl on cl.id = q.lesson_id
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4B-%'
     )`,
  );
  await pool.query(
    `delete from quiz_attempts
     where quiz_id in (
       select q.id
       from course_quizzes q
       join course_lessons cl on cl.id = q.lesson_id
       join course_learning_paths lp on lp.id = cl.learning_path_id
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4B-%'
     )`,
  );
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
       where c.code like 'C4B-%'
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
       where c.code like 'C4B-%'
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
       where c.code like 'C4B-%'
     )`,
  );
  await pool.query(
    `delete from course_lessons
     where learning_path_id in (
       select lp.id
       from course_learning_paths lp
       join course_offerings co on co.id = lp.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4B-%'
     )`,
  );
  await pool.query(
    `delete from course_learning_paths
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'C4B-%'
     )`,
  );
  await pool.query(
    `delete from course_teaching_assignments
     where delivery_id in (
       select csd.id
       from course_section_deliveries csd
       join course_offerings co on co.id = csd.offering_id
       join courses c on c.id = co.course_id
       where c.code like 'C4B-%'
     )`,
  );
  await pool.query(
    `delete from course_section_deliveries
     where offering_id in (
       select co.id
       from course_offerings co
       join courses c on c.id = co.course_id
       where c.code like 'C4B-%'
     )`,
  );
  await pool.query(
    `delete from course_offerings
     where course_id in (
       select id from courses
       where code like 'C4B-%'
     )`,
  );
  await pool.query(
    "delete from courses where code like 'C4B-%'",
  );
  await pool.query(
    `delete from section_enrollments
     where learner_enrollment_id in (
       select lpe.id
       from learner_program_enrollments lpe
       join programs p on p.id = lpe.program_id
       where p.code like 'C4B-%'
     )`,
  );
  await pool.query(
    `delete from learner_program_enrollments
     where program_id in (
       select id from programs
       where code like 'C4B-%'
     )`,
  );
  await pool.query(
    `delete from sections
     where cohort_id in (
       select c.id
       from cohorts c
       join programs p on p.id = c.program_id
       where p.code like 'C4B-%'
     )`,
  );
  await pool.query(
    `delete from cohorts
     where program_id in (
       select id from programs
       where code like 'C4B-%'
     )`,
  );
  await pool.query(
    "delete from programs where code like 'C4B-%'",
  );
  await pool.query(
    "delete from academic_periods where code like 'C4B-%'",
  );
}

async function createStructure() {
  const program = await createProgram(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "C4B Computer Science",
      code: "C4B-PROGRAM",
      durationTerms: 8,
    },
  );
  const period = await createAcademicPeriod(
    collegeAdmin,
    {
      collegeId: SEED_IDS.collegeA,
      name: "C4B Semester 1",
      code: "C4B-PERIOD",
      startDate: "2026-07-01",
      endDate: "2027-12-31",
    },
  );
  const cohort = await createCohort(
    collegeAdmin,
    {
      programId: program.id,
      name: "C4B 2026 Intake",
      code: "C4B-COHORT",
      startPeriodId: period.id,
    },
  );
  const sectionA = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "C4B Section A",
      code: "C4B-A",
      capacity: 60,
    },
  );
  const sectionB = await createSection(
    collegeAdmin,
    {
      cohortId: cohort.id,
      academicPeriodId: period.id,
      name: "C4B Section B",
      code: "C4B-B",
      capacity: 60,
    },
  );
  const course = await createCourse(
    collegeAdmin,
    {
      departmentId: SEED_IDS.departmentA,
      name: "C4B Data Structures",
      code: "C4B-DS",
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
      title: "C4B Learning Path",
    },
  );
  const lesson = await createCourseLesson(
    collegeAdmin,
    {
      learningPathId: path.id,
      name: "C4B Arrays",
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

function quizQuestions() {
  return [
    {
      type: "SINGLE_CHOICE" as const,
      prompt: "Which structure uses FIFO?",
      points: 4,
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
    {
      type: "MULTIPLE_CHOICE" as const,
      prompt: "Select linear structures",
      points: 6,
      sequence: 1,
      options: [
        {
          text: "Array",
          correct: true,
          sequence: 0,
        },
        {
          text: "Linked list",
          correct: true,
          sequence: 1,
        },
        {
          text: "Tree",
          correct: false,
          sequence: 2,
        },
      ],
    },
  ];
}

async function answerKey(
  quizId: string,
  deliveryId: string,
) {
  const view = await getCourseQuiz(
    faculty,
    quizId,
    deliveryId,
  );

  return {
    view,
    answers: view.questions.map(
      (question) => ({
        questionId: question.id,
        selectedOptionIds:
          question.options
            .filter(
              (option) =>
                option.correct === true,
            )
            .map((option) => option.id),
      }),
    ),
  };
}

beforeEach(async () => {
  await cleanupC4B();
});

afterAll(async () => {
  await cleanupC4B();
  await pool.end();
  await closeDatabaseConnection();
});

describe("courses C4B quizzes against PostgreSQL", () => {
  it("keeps generic quizzes admin-owned, exact quizzes teacher-scoped and learner keys hidden", async () => {
    const structure = await createStructure();

    const generic = await createCourseQuiz(
      collegeAdmin,
      {
        lessonId: structure.lesson.id,
        title: "C4B Shared Quiz",
        dueAt:
          "2027-12-01T12:00:00.000Z",
        maxAttempts: 1,
        sequence: 0,
        questions: quizQuestions(),
      },
    );

    await expect(
      createCourseQuiz(faculty, {
        lessonId: structure.lesson.id,
        title: "C4B Unsafe Shared Quiz",
        maxAttempts: 1,
        sequence: 1,
        questions: quizQuestions(),
      }),
    ).rejects.toBeInstanceOf(
      AuthorizationError,
    );

    const exact = await createCourseQuiz(
      faculty,
      {
        lessonId: structure.lesson.id,
        deliveryId: structure.deliveryA.id,
        title: "C4B Section A Quiz",
        dueAt:
          "2027-12-01T12:00:00.000Z",
        maxAttempts: 2,
        sequence: 1,
        questions: quizQuestions(),
      },
    );

    await expect(
      createCourseQuiz(faculty, {
        lessonId: structure.lesson.id,
        deliveryId: structure.deliveryB.id,
        title: "C4B Section B Unsafe",
        maxAttempts: 1,
        sequence: 2,
        questions: quizQuestions(),
      }),
    ).rejects.toMatchObject({
      code: "FACULTY_TEACHING_SCOPE_REQUIRED",
    });

    await transitionCourseQuiz(
      collegeAdmin,
      generic.id,
      { action: "PUBLISH" },
    );
    await transitionCourseQuiz(
      faculty,
      exact.id,
      { action: "PUBLISH" },
    );

    const quizzes = await listCourseQuizzes(
      learner,
      structure.lesson.id,
      structure.deliveryA.id,
    );

    expect(
      quizzes.map((quiz) => quiz.id),
    ).toEqual([generic.id, exact.id]);

    const learnerView = await getCourseQuiz(
      learner,
      exact.id,
      structure.deliveryA.id,
    );

    expect(learnerView.resultsVisible).toBe(
      false,
    );
    for (const question of learnerView.questions) {
      for (const option of question.options) {
        expect(option).not.toHaveProperty(
          "correct",
        );
      }
    }

    await expect(
      getCourseQuiz(
        learner,
        exact.id,
        structure.deliveryB.id,
      ),
    ).rejects.toMatchObject({
      code:
        "LEARNER_ENROLLMENT_SCOPE_REQUIRED",
    });
  });

  it("scores exact answers, enforces attempt limits and freezes question changes after attempts", async () => {
    const structure = await createStructure();
    const quiz = await createCourseQuiz(
      faculty,
      {
        lessonId: structure.lesson.id,
        deliveryId: structure.deliveryA.id,
        title: "C4B Attempts Quiz",
        dueAt:
          "2027-12-01T12:00:00.000Z",
        maxAttempts: 2,
        sequence: 0,
        questions: quizQuestions(),
      },
    );
    await transitionCourseQuiz(
      faculty,
      quiz.id,
      { action: "PUBLISH" },
    );

    const key = await answerKey(
      quiz.id,
      structure.deliveryA.id,
    );

    const firstAnswers = key.answers.map(
      (answer, index) =>
        index === 0
          ? answer
          : {
              questionId:
                answer.questionId,
              selectedOptionIds: [],
            },
    );

    await submitCourseQuiz(
      learner,
      quiz.id,
      {
        deliveryId: structure.deliveryA.id,
        answers: firstAnswers,
      },
    );

    const facultyAttempts =
      await listQuizAttempts(
        faculty,
        quiz.id,
        structure.deliveryA.id,
      );
    expect(facultyAttempts).toHaveLength(1);
    expect(facultyAttempts[0]).toMatchObject({
      attemptNumber: 1,
      score: 4,
      maxScore: 10,
      learnerDisplayName: "Seed Learner",
      learnerEmail:
        "learner.seed@example.com",
    });

    const hidden = await getMyQuizAttempts(
      learner,
      quiz.id,
      structure.deliveryA.id,
    );
    expect(hidden[0]).toMatchObject({
      score: null,
      maxScore: null,
      resultsVisible: false,
    });

    await expect(
      updateCourseQuiz(faculty, quiz.id, {
        questions: quizQuestions(),
      }),
    ).rejects.toMatchObject({
      code: "QUIZ_HAS_ATTEMPTS",
    });

    await expect(
      updateCourseQuiz(faculty, quiz.id, {
        maxAttempts: 3,
      }),
    ).rejects.toMatchObject({
      code: "QUIZ_HAS_ATTEMPTS",
    });

    await submitCourseQuiz(
      learner,
      quiz.id,
      {
        deliveryId: structure.deliveryA.id,
        answers: key.answers,
      },
    );

    await expect(
      submitCourseQuiz(
        learner,
        quiz.id,
        {
          deliveryId:
            structure.deliveryA.id,
          answers: key.answers,
        },
      ),
    ).rejects.toMatchObject({
      code: "QUIZ_MAX_ATTEMPTS_REACHED",
    });
  });

  it("requires close before result publication and preserves attempt snapshots", async () => {
    const structure = await createStructure();
    const quiz = await createCourseQuiz(
      faculty,
      {
        lessonId: structure.lesson.id,
        deliveryId: structure.deliveryA.id,
        title: "C4B Results Quiz",
        dueAt:
          "2027-12-01T12:00:00.000Z",
        maxAttempts: 3,
        sequence: 0,
        questions: quizQuestions(),
      },
    );
    await transitionCourseQuiz(
      faculty,
      quiz.id,
      { action: "PUBLISH" },
    );

    const key = await answerKey(
      quiz.id,
      structure.deliveryA.id,
    );

    await submitCourseQuiz(
      learner,
      quiz.id,
      {
        deliveryId: structure.deliveryA.id,
        answers: key.answers,
      },
    );

    await expect(
      setCourseQuizResults(
        faculty,
        quiz.id,
        { published: true },
      ),
    ).rejects.toMatchObject({
      code: "INVALID_QUIZ_TRANSITION",
    });

    const firstCorrectOption =
      key.view.questions[0]?.options.find(
        (option) => option.correct,
      );
    expect(firstCorrectOption).toBeDefined();

    await pool.query(
      `update quiz_options
       set is_correct = false
       where id = $1`,
      [firstCorrectOption!.id],
    );

    await transitionCourseQuiz(
      faculty,
      quiz.id,
      { action: "CLOSE" },
    );
    await setCourseQuizResults(
      faculty,
      quiz.id,
      { published: true },
    );

    const attempts =
      await getMyQuizAttempts(
        learner,
        quiz.id,
        structure.deliveryA.id,
      );

    expect(attempts[0]).toMatchObject({
      score: 10,
      maxScore: 10,
      resultsVisible: true,
    });
    expect(
      attempts[0]?.answers[0],
    ).toMatchObject({
      correct: true,
      pointsAwarded: 4,
    });
    const firstSnapshot =
      attempts[0]?.answers[0];
    expect(firstSnapshot).toBeDefined();
    if (
      !firstSnapshot ||
      !("options" in firstSnapshot) ||
      !firstSnapshot.options
    ) {
      throw new Error(
        "Expected published answer snapshot",
      );
    }
    expect(
      firstSnapshot.options.some(
        (option) =>
          option.id ===
            firstCorrectOption!.id &&
          option.correct === true,
      ),
    ).toBe(true);

    const learnerView = await getCourseQuiz(
      learner,
      quiz.id,
      structure.deliveryA.id,
    );
    expect(learnerView.resultsVisible).toBe(
      true,
    );

    await expect(
      submitCourseQuiz(
        learner,
        quiz.id,
        {
          deliveryId:
            structure.deliveryA.id,
          answers: key.answers,
        },
      ),
    ).rejects.toMatchObject({
      code: "QUIZ_NOT_PUBLISHED",
    });
  });

  it("allows only one concurrent final attempt and enforces database score bounds", async () => {
    const structure = await createStructure();
    const quiz = await createCourseQuiz(
      faculty,
      {
        lessonId: structure.lesson.id,
        deliveryId: structure.deliveryA.id,
        title: "C4B Race Quiz",
        dueAt:
          "2027-12-01T12:00:00.000Z",
        maxAttempts: 1,
        sequence: 0,
        questions: quizQuestions(),
      },
    );
    await transitionCourseQuiz(
      faculty,
      quiz.id,
      { action: "PUBLISH" },
    );
    const key = await answerKey(
      quiz.id,
      structure.deliveryA.id,
    );

    const results = await Promise.allSettled([
      submitCourseQuiz(
        learner,
        quiz.id,
        {
          deliveryId:
            structure.deliveryA.id,
          answers: key.answers,
        },
      ),
      submitCourseQuiz(
        learner,
        quiz.id,
        {
          deliveryId:
            structure.deliveryA.id,
          answers: key.answers,
        },
      ),
    ]);

    expect(
      results.filter(
        (result) =>
          result.status === "fulfilled",
      ),
    ).toHaveLength(1);
    expect(
      results.filter(
        (result) =>
          result.status === "rejected",
      ),
    ).toHaveLength(1);

    const count = await pool.query<{
      count: string;
    }>(
      `select count(*)::text as count
       from quiz_attempts
       where quiz_id = $1
         and membership_id = $2`,
      [
        quiz.id,
        SEED_IDS.learnerCollegeAMembership,
      ],
    );
    expect(count.rows[0]?.count).toBe("1");

    await expect(
      pool.query(
        `insert into quiz_attempts
          (quiz_id, delivery_id, membership_id, attempt_number, score, max_score)
         values ($1, $2, $3, 2, 11, 10)`,
        [
          quiz.id,
          structure.deliveryA.id,
          SEED_IDS.facultyCollegeAMembership,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });
  });
  it("rejects a quiz submission when a faculty close commits during the race", async () => {
    const structure = await createStructure();
    const quiz = await createCourseQuiz(faculty, {
      lessonId: structure.lesson.id,
      deliveryId: structure.deliveryA.id,
      title: "C4B Close Race Quiz",
      dueAt: "2027-12-01T12:00:00.000Z",
      maxAttempts: 2,
      sequence: 0,
      questions: quizQuestions(),
    });
    await transitionCourseQuiz(faculty, quiz.id, { action: "PUBLISH" });
    const holder = await pool.connect();
    let began = false;
    try {
      await holder.query("begin");
      began = true;
      await holder.query("update course_quizzes set status='CLOSED' where id=$1", [quiz.id]);
      const submission = submitCourseQuiz(learner, quiz.id, {
        deliveryId: structure.deliveryA.id,
        answers: [],
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
      await holder.query("commit");
      began = false;
      await expect(submission).rejects.toMatchObject({
        code: "QUIZ_NOT_PUBLISHED",
      });
      const result = await pool.query(
        "select count(*)::int as n from quiz_attempts where quiz_id=$1",
        [quiz.id],
      );
      expect(result.rows[0].n).toBe(0);
    } finally {
      if (began) await holder.query("rollback");
      holder.release();
    }
  });

});
