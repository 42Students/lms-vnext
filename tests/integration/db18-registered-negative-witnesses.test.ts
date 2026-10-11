import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

// This suite performs rejected writes in transactions. Never contact the
// application database, even for rollback-only tests.
const databaseUrl = process.env.TEST_DATABASE_URL;
const isolated =
  process.env.DB018_ISOLATED_TEST_DATABASE === "1" ||
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (!databaseUrl || !isolated) {
  throw new Error(
    "DB-018 direct-SQL witnesses require explicit TEST_DATABASE_URL and an isolated database flag",
  );
}

const pool = new Pool({ connectionString: databaseUrl, max: 2 });

afterAll(async () => {
  await pool.end();
});

async function withRollback(
  fn: (client: PoolClient) => Promise<void>,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await fn(client);
  } finally {
    await client.query("ROLLBACK").catch(() => undefined);
    client.release();
  }
}

async function expectSqlState(
  client: PoolClient,
  sql: string,
  params: readonly unknown[],
  expectedCode = "23514",
) {
  const savepoint = "db18_expected_rejection";
  await client.query(`SAVEPOINT ${savepoint}`);
  let thrown: unknown;
  try {
    await client.query(sql, [...params]);
  } catch (error) {
    thrown = error;
  }
  await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
  await client.query(`RELEASE SAVEPOINT ${savepoint}`);

  expect(thrown).toBeDefined();
  expect((thrown as { code?: string }).code).toBe(expectedCode);
}

async function createCollegeAGroup(client: PoolClient) {
  const id = randomUUID();
  await client.query(
    `insert into lms_groups
       (id, kind, owner_scope, college_id, name, status, created_by_user_id)
     values ($1, 'GENERAL', 'COLLEGE', $2, $3, 'ACTIVE', $4)`,
    [
      id,
      SEED_IDS.collegeA,
      `DB18 group ${id.slice(0, 8)}`,
      SEED_IDS.collegeAdminUser,
    ],
  );
  return id;
}

type AcademicFixture = {
  programId: string;
  periodId: string;
  cohortId: string;
  sectionId: string;
  learnerEnrollmentId: string;
  courseAId: string;
  courseBId: string;
  offeringAId: string;
  offeringBId: string;
  deliveryAId: string;
  deliveryBId: string;
  learningPathAId: string;
  lessonAId: string;
};

async function createAcademicFixture(
  client: PoolClient,
): Promise<AcademicFixture> {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
  const ids: AcademicFixture = {
    programId: randomUUID(),
    periodId: randomUUID(),
    cohortId: randomUUID(),
    sectionId: randomUUID(),
    learnerEnrollmentId: randomUUID(),
    courseAId: randomUUID(),
    courseBId: randomUUID(),
    offeringAId: randomUUID(),
    offeringBId: randomUUID(),
    deliveryAId: randomUUID(),
    deliveryBId: randomUUID(),
    learningPathAId: randomUUID(),
    lessonAId: randomUUID(),
  };

  await client.query(
    `insert into academic_periods
       (id, college_id, name, code, start_date, end_date, status)
     values ($1, $2, $3, $4, '2026-01-01', '2026-06-30', 'ACTIVE')`,
    [
      ids.periodId,
      SEED_IDS.collegeA,
      `DB18 period ${suffix}`,
      `DB18-P-${suffix}`,
    ],
  );

  await client.query(
    `insert into programs
       (id, department_id, name, code, duration_terms, status)
     values ($1, $2, $3, $4, 8, 'ACTIVE')`,
    [
      ids.programId,
      SEED_IDS.departmentA,
      `DB18 program ${suffix}`,
      `DB18-PR-${suffix}`,
    ],
  );

  await client.query(
    `insert into cohorts
       (id, program_id, name, code, start_period_id, status)
     values ($1, $2, $3, $4, $5, 'ACTIVE')`,
    [
      ids.cohortId,
      ids.programId,
      `DB18 cohort ${suffix}`,
      `DB18-C-${suffix}`,
      ids.periodId,
    ],
  );

  await client.query(
    `insert into sections
       (id, cohort_id, academic_period_id, name, code, status)
     values ($1, $2, $3, $4, $5, 'ACTIVE')`,
    [
      ids.sectionId,
      ids.cohortId,
      ids.periodId,
      `DB18 section ${suffix}`,
      `DB18-S-${suffix}`,
    ],
  );

  await client.query(
    `insert into learner_program_enrollments
       (id, membership_id, program_id, cohort_id, status)
     values ($1, $2, $3, $4, 'ACTIVE')`,
    [
      ids.learnerEnrollmentId,
      SEED_IDS.learnerCollegeAMembership,
      ids.programId,
      ids.cohortId,
    ],
  );

  await client.query(
    `insert into section_enrollments
       (learner_enrollment_id, section_id, academic_period_id, status)
     values ($1, $2, $3, 'ACTIVE')`,
    [ids.learnerEnrollmentId, ids.sectionId, ids.periodId],
  );

  await client.query(
    `insert into courses
       (id, department_id, name, code, status)
     values
       ($1, $3, $4, $5, 'ACTIVE'),
       ($2, $3, $6, $7, 'ACTIVE')`,
    [
      ids.courseAId,
      ids.courseBId,
      SEED_IDS.departmentA,
      `DB18 course A ${suffix}`,
      `DB18-CA-${suffix}`,
      `DB18 course B ${suffix}`,
      `DB18-CB-${suffix}`,
    ],
  );

  await client.query(
    `insert into course_offerings
       (id, course_id, cohort_id, academic_period_id, type, status)
     values
       ($1, $3, $5, $6, 'CORE', 'ACTIVE'),
       ($2, $4, $5, $6, 'CORE', 'ACTIVE')`,
    [
      ids.offeringAId,
      ids.offeringBId,
      ids.courseAId,
      ids.courseBId,
      ids.cohortId,
      ids.periodId,
    ],
  );

  await client.query(
    `insert into course_section_deliveries
       (id, offering_id, section_id)
     values ($1, $3, $5), ($2, $4, $5)`,
    [
      ids.deliveryAId,
      ids.deliveryBId,
      ids.offeringAId,
      ids.offeringBId,
      ids.sectionId,
    ],
  );

  await client.query(
    `insert into course_learning_paths
       (id, offering_id, title, status)
     values ($1, $2, $3, 'PUBLISHED')`,
    [
      ids.learningPathAId,
      ids.offeringAId,
      `DB18 path ${suffix}`,
    ],
  );

  await client.query(
    `insert into course_lessons
       (id, learning_path_id, name, sequence, status)
     values ($1, $2, $3, 0, 'ACTIVE')`,
    [
      ids.lessonAId,
      ids.learningPathAId,
      `DB18 lesson ${suffix}`,
    ],
  );

  return ids;
}

async function createQuiz(
  client: PoolClient,
  fixture: AcademicFixture,
  sequence: number,
) {
  const id = randomUUID();
  await client.query(
    `insert into course_quizzes
       (id, lesson_id, delivery_id, title, max_attempts, total_points,
        sequence, status, created_by_user_id)
     values ($1, $2, $3, $4, 2, 10, $5, 'PUBLISHED', $6)`,
    [
      id,
      fixture.lessonAId,
      fixture.deliveryAId,
      `DB18 quiz ${sequence} ${id.slice(0, 8)}`,
      sequence,
      SEED_IDS.facultyUser,
    ],
  );
  return id;
}

describe("DB-018 registered negative PostgreSQL witnesses", () => {
  it("rejects a direct cross-college group membership insert", async () => {
    await withRollback(async (client) => {
      const groupId = await createCollegeAGroup(client);
      await expectSqlState(
        client,
        `insert into lms_group_members
           (group_id, membership_id, member_type, state, source)
         values ($1, $2, 'FACULTY', 'ACTIVE', 'MANUAL')`,
        [groupId, SEED_IDS.facultyCollegeBMembership],
      );
    });
  });

  it("rejects a direct group member_type that the membership does not hold", async () => {
    await withRollback(async (client) => {
      const groupId = await createCollegeAGroup(client);
      await expectSqlState(
        client,
        `insert into lms_group_members
           (group_id, membership_id, member_type, state, source)
         values ($1, $2, 'FACULTY', 'ACTIVE', 'MANUAL')`,
        [groupId, SEED_IDS.learnerCollegeAMembership],
      );
    });
  });

  it("rejects changing a populated group to another college", async () => {
    await withRollback(async (client) => {
      const groupId = await createCollegeAGroup(client);
      await client.query(
        `insert into lms_group_members
           (group_id, membership_id, member_type, state, source)
         values ($1, $2, 'LEARNER', 'ACTIVE', 'MANUAL')`,
        [groupId, SEED_IDS.learnerCollegeAMembership],
      );

      await expectSqlState(
        client,
        "update lms_groups set college_id = $2 where id = $1",
        [groupId, SEED_IDS.collegeB],
      );
    });
  });

  it("rejects an elective slot whose program belongs to another college", async () => {
    await withRollback(async (client) => {
      const programId = randomUUID();
      await client.query(
        `insert into programs
           (id, department_id, name, code, duration_terms, status)
         values ($1, $2, $3, $4, 8, 'ACTIVE')`,
        [
          programId,
          SEED_IDS.departmentA,
          `DB18 elective program ${programId.slice(0, 8)}`,
          `DB18-EP-${programId.slice(0, 8)}`,
        ],
      );

      await expectSqlState(
        client,
        `insert into elective_slots
           (college_id, program_id, semester_number, name, credits, min_pick, max_pick, status)
         values ($1, $2, 1, 'DB18 invalid slot', 3, 1, 1, 'ACTIVE')`,
        [SEED_IDS.collegeB, programId],
      );
    });
  });

  it("rejects a quiz bound to a delivery from another offering", async () => {
    await withRollback(async (client) => {
      const fixture = await createAcademicFixture(client);
      await expectSqlState(
        client,
        `insert into course_quizzes
           (lesson_id, delivery_id, title, max_attempts, total_points,
            sequence, status, created_by_user_id)
         values ($1, $2, 'DB18 invalid quiz', 1, 10, 0, 'PUBLISHED', $3)`,
        [
          fixture.lessonAId,
          fixture.deliveryBId,
          SEED_IDS.facultyUser,
        ],
      );
    });
  });

  it("rejects a quiz attempt using a different delivery than its quiz", async () => {
    await withRollback(async (client) => {
      const fixture = await createAcademicFixture(client);
      const quizId = await createQuiz(client, fixture, 0);

      await expectSqlState(
        client,
        `insert into quiz_attempts
           (quiz_id, delivery_id, membership_id, attempt_number, score, max_score)
         values ($1, $2, $3, 1, 0, 10)`,
        [
          quizId,
          fixture.deliveryBId,
          SEED_IDS.learnerCollegeAMembership,
        ],
      );
    });
  });

  it("rejects an answer whose question belongs to a different quiz", async () => {
    await withRollback(async (client) => {
      const fixture = await createAcademicFixture(client);
      const quizA = await createQuiz(client, fixture, 0);
      const quizB = await createQuiz(client, fixture, 1);
      const questionB = randomUUID();

      await client.query(
        `insert into quiz_questions
           (id, quiz_id, question_type, prompt, points, sequence)
         values ($1, $2, 'SINGLE_CHOICE', 'DB18 question B', 10, 0)`,
        [questionB, quizB],
      );

      const attempt = randomUUID();
      await client.query(
        `insert into quiz_attempts
           (id, quiz_id, delivery_id, membership_id, attempt_number, score, max_score)
         values ($1, $2, $3, $4, 1, 0, 10)`,
        [
          attempt,
          quizA,
          fixture.deliveryAId,
          SEED_IDS.learnerCollegeAMembership,
        ],
      );

      await expectSqlState(
        client,
        `insert into quiz_attempt_answers
           (attempt_id, question_id, question_type, prompt_snapshot,
            points_possible, selected_option_ids, options_snapshot,
            correct, points_awarded)
         values ($1, $2, 'SINGLE_CHOICE', 'DB18 snapshot',
                 10, '[]'::jsonb, '[]'::jsonb, false, 0)`,
        [attempt, questionB],
      );
    });
  });

  it("rejects an assignment grade above the assignment maximum", async () => {
    await withRollback(async (client) => {
      const fixture = await createAcademicFixture(client);
      const assignmentId = randomUUID();

      await client.query(
        `insert into course_assignments
           (id, lesson_id, delivery_id, title, max_points, sequence,
            status, created_by_user_id)
         values ($1, $2, $3, $4, 10, 0, 'PUBLISHED', $5)`,
        [
          assignmentId,
          fixture.lessonAId,
          fixture.deliveryAId,
          `DB18 assignment ${assignmentId.slice(0, 8)}`,
          SEED_IDS.facultyUser,
        ],
      );

      await expectSqlState(
        client,
        `insert into assignment_submissions
           (assignment_id, delivery_id, membership_id, submission_type,
            text_content, points_awarded, grading_status,
            graded_by_user_id, graded_at)
         values ($1, $2, $3, 'TEXT', 'DB18 submission',
                 11, 'GRADED', $4, now())`,
        [
          assignmentId,
          fixture.deliveryAId,
          SEED_IDS.learnerCollegeAMembership,
          SEED_IDS.collegeAdminUser,
        ],
      );
    });
  });
});
