import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { ZodError } from "zod";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { CoursesServiceError } from "@/modules/courses/errors";
import {
  getMyQuizAttempts,
  listQuizAttempts,
  submitCourseQuiz,
} from "@/modules/courses/quiz-attempt-service";
import { getFacultyQuizAttemptDrilldown } from "@/modules/courses/faculty-quiz-attempts-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { contextFor, insertPerson as insertActor, person, seededCollegeAdmin, type Person, type TestRole } from "../support/actors";
import {
  cleanupLearnerCourseWriteFixture,
  newLearnerCourseWriteFixture,
  seedLearnerCourseWriteFixture,
} from "../support/learner-course-write-fixture";

/**
 * Quiz attempts: object-level access between people of the SAME college.
 *
 * One quiz is shared by two class sections. Learners A and B are in section 1, learner C is in section 2; each has one attempt.
 * Teacher 1 teaches section 1, teacher 2 teaches section 2, teacher 0 teaches nothing. A learner may only ever see their own
 * attempts; the attempt lists and the answer-level drilldown are for the section's staff only; and nobody can start an attempt
 * in a section they do not belong to. Every refusal must be an access error (not a validation error), and a refused submit
 * must leave no attempt behind.
 */
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("sec-cross-user-quizzes needs TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1 (disposable database)");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });

const fixture = newLearnerCourseWriteFixture();
const { ids } = fixture;
const college = SEED_IDS.collegeA;

const learnerBp = person();
const learnerCp = person();
const teacher1 = person();
const teacher2 = person();
const teacher0 = person();
const section2 = randomUUID();
const delivery2 = randomUUID();
const quiz = randomUUID();
const attemptA = randomUUID();
const attemptB = randomUUID();
const attemptC = randomUUID();
const enrollment = { b: randomUUID(), c: randomUUID() };
const sectionEnrollment = { b: randomUUID(), c: randomUUID() };
const teaching = { t1: randomUUID(), t2: randomUUID() };

const as = (p: Person, role: TestRole, collegeId: string = college): RequestContext => contextFor(p, role, collegeId, "sec-quiz");
const insertPerson = (p: Person, role: string, name: string) => insertActor(pool, p, role, name, college, "sec-quiz");
const learnerA = fixture.context;
const learnerB = as(learnerBp, "LEARNER");
const learnerC = as(learnerCp, "LEARNER");
const t1 = as(teacher1, "FACULTY");
const t2 = as(teacher2, "FACULTY");
const t0 = as(teacher0, "FACULTY");
const admin = seededCollegeAdmin();
const otherCollegeAdmin = as(person(), "COLLEGE_ADMIN", SEED_IDS.collegeB);

/** Refused by an access rule: never a validation error, never a crash. */
async function refused(call: Promise<unknown>, who: string) {
  let error: unknown = null;
  try {
    await call;
  } catch (caught) {
    error = caught;
  }
  expect(error, who + " must be refused").not.toBeNull();
  expect(error instanceof ZodError, who + " was refused for invalid input, not for access").toBe(false);
  expect(error instanceof AuthorizationError || error instanceof CoursesServiceError, who + ": " + String(error)).toBe(true);
}

const attemptCount = async () =>
  Number((await pool.query("SELECT count(*)::int AS n FROM quiz_attempts WHERE quiz_id=$1", [quiz])).rows[0].n);

async function insertAttempt(id: string, delivery: string, membership: string, score: number) {
  await pool.query(
    "INSERT INTO quiz_attempts(id,quiz_id,delivery_id,membership_id,attempt_number,score,max_score) VALUES($1,$2,$3,$4,1,$5,10)",
    [id, quiz, delivery, membership, score],
  );
}

describe("quiz attempts: nobody can reach another person's attempts", () => {
  beforeAll(async () => {
    await seedLearnerCourseWriteFixture(pool, fixture, { content: true });
    const q = pool.query.bind(pool);
    await insertPerson(learnerBp, "LEARNER", "SEC-QUIZ Learner B");
    await insertPerson(learnerCp, "LEARNER", "SEC-QUIZ Learner C");
    await insertPerson(teacher1, "FACULTY", "SEC-QUIZ Teacher 1");
    await insertPerson(teacher2, "FACULTY", "SEC-QUIZ Teacher 2");
    await insertPerson(teacher0, "FACULTY", "SEC-QUIZ Teacher 0");
    await q("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)", [section2, ids.cohort, ids.period, "SEC-QUIZ s2", "SEC-QUIZ-" + section2.slice(0, 8)]);
    await q("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)", [delivery2, ids.offering, section2]);
    await q("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')", [enrollment.b, learnerBp.membership, ids.program, ids.cohort]);
    await q("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)", [sectionEnrollment.b, enrollment.b, ids.section, ids.period]);
    await q("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')", [enrollment.c, learnerCp.membership, ids.program, ids.cohort]);
    await q("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)", [sectionEnrollment.c, enrollment.c, section2, ids.period]);
    await q("INSERT INTO course_teaching_assignments(id,delivery_id,membership_id) VALUES($1,$2,$3)", [teaching.t1, ids.delivery, teacher1.membership]);
    await q("INSERT INTO course_teaching_assignments(id,delivery_id,membership_id) VALUES($1,$2,$3)", [teaching.t2, delivery2, teacher2.membership]);
    await q(
      "INSERT INTO course_quizzes(id,lesson_id,title,total_points,sequence,max_attempts,status,created_by_user_id) VALUES($1,$2,$3,10,0,3,'PUBLISHED',$4)",
      [quiz, ids.lesson, "SEC-QUIZ quiz", SEED_IDS.collegeAdminUser],
    );
    await insertAttempt(attemptA, ids.delivery, ids.membership, 7);
    await insertAttempt(attemptB, ids.delivery, learnerBp.membership, 3);
    await insertAttempt(attemptC, delivery2, learnerCp.membership, 9);
  }, 90_000);

  afterAll(async () => {
    try {
      const q = (sql: string, args: unknown[]) => pool.query(sql, args).catch(() => undefined);
      await q("DELETE FROM quiz_attempt_answers WHERE attempt_id=ANY($1::uuid[])", [[attemptA, attemptB, attemptC]]);
      await q("DELETE FROM quiz_attempts WHERE quiz_id=$1", [quiz]);
      await q("DELETE FROM course_quizzes WHERE id=$1", [quiz]);
      await q("DELETE FROM course_teaching_assignments WHERE id=ANY($1::uuid[])", [[teaching.t1, teaching.t2]]);
      await q("DELETE FROM section_enrollments WHERE id=ANY($1::uuid[])", [[sectionEnrollment.b, sectionEnrollment.c]]);
      await q("DELETE FROM learner_program_enrollments WHERE id=ANY($1::uuid[])", [[enrollment.b, enrollment.c]]);
      await q("DELETE FROM course_section_deliveries WHERE id=$1", [delivery2]);
      await q("DELETE FROM sections WHERE id=$1", [section2]);
      for (const p of [learnerBp, learnerCp, teacher1, teacher2, teacher0]) {
        await q("DELETE FROM membership_roles WHERE id=$1", [p.role]);
        await q("DELETE FROM college_memberships WHERE id=$1", [p.membership]);
        await q("DELETE FROM users WHERE id=$1", [p.user]);
      }
      await cleanupLearnerCourseWriteFixture(pool, fixture);
    } finally {
      await pool.end();
      await closeDatabaseConnection();
    }
  }, 90_000);

  describe("a learner's own attempts", () => {
    it("each learner sees their own attempt and never a classmate's", async () => {
      const a = (await getMyQuizAttempts(learnerA, quiz, ids.delivery)).map((x: { id: string }) => x.id);
      const b = (await getMyQuizAttempts(learnerB, quiz, ids.delivery)).map((x: { id: string }) => x.id);
      expect(a).toEqual([attemptA]);
      expect(b).toEqual([attemptB]);
    });

    it("a learner from the other section cannot read the attempts through this section", async () => {
      await refused(getMyQuizAttempts(learnerC, quiz, ids.delivery), "learner C via section 1");
    });

    it("a learner cannot start an attempt in a section they are not enrolled in, and leaves nothing behind", async () => {
      const before = await attemptCount();
      await refused(
        submitCourseQuiz(learnerC, quiz, { deliveryId: ids.delivery, answers: [{ questionId: randomUUID(), selectedOptionIds: [randomUUID()] }] } as never),
        "learner C submitting into section 1",
      );
      await refused(
        submitCourseQuiz(otherCollegeAdmin, quiz, { deliveryId: ids.delivery, answers: [{ questionId: randomUUID(), selectedOptionIds: [randomUUID()] }] } as never),
        "another college's admin submitting",
      );
      expect(await attemptCount()).toBe(before);
    });
  });

  describe("who may read everyone's attempts", () => {
    it("the section's teacher and the college admin can, and the list holds only that section", async () => {
      const seenByTeacher = (await listQuizAttempts(t1, quiz, ids.delivery)) as unknown as Array<{ id: string }> | { items: Array<{ id: string }> };
      const ids1 = (Array.isArray(seenByTeacher) ? seenByTeacher : seenByTeacher.items).map((x) => x.id);
      expect(ids1).toEqual(expect.arrayContaining([attemptA, attemptB]));
      expect(ids1).not.toContain(attemptC);
      const seenByAdmin = (await listQuizAttempts(admin, quiz, ids.delivery)) as unknown as Array<{ id: string }> | { items: Array<{ id: string }> };
      expect((Array.isArray(seenByAdmin) ? seenByAdmin : seenByAdmin.items).map((x) => x.id)).toEqual(expect.arrayContaining([attemptA, attemptB]));
    });

    it("learners, a teacher of nothing, the other section's teacher and another college's admin cannot", async () => {
      for (const [who, actor] of [
        ["learner A", learnerA], ["learner B", learnerB], ["learner C", learnerC],
        ["teacher 0", t0], ["teacher 2 on section 1", t2], ["other college admin", otherCollegeAdmin],
      ] as const) {
        await refused(listQuizAttempts(actor, quiz, ids.delivery), who);
      }
      await refused(listQuizAttempts(t1, quiz, delivery2), "teacher 1 on section 2");
    });
  });

  describe("the answer-level drilldown is for the teaching faculty only", () => {
    it("the section's teacher sees the section's attempts and not the other section's", async () => {
      const result = await getFacultyQuizAttemptDrilldown(t1, { deliveryId: ids.delivery, quizId: quiz });
      const seen = result.items.map((item: { id: string }) => item.id);
      expect(seen).toEqual(expect.arrayContaining([attemptA, attemptB]));
      expect(seen).not.toContain(attemptC);
    });

    it("learners, other teachers, the admin and another college's admin are refused", async () => {
      for (const [who, actor] of [
        ["learner A", learnerA], ["learner B", learnerB], ["teacher 0", t0], ["teacher 2", t2],
        ["college admin (not teaching faculty)", admin], ["other college admin", otherCollegeAdmin],
      ] as const) {
        await refused(getFacultyQuizAttemptDrilldown(actor, { deliveryId: ids.delivery, quizId: quiz }), who);
      }
    });
  });
});
