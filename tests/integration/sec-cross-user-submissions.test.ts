import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { ZodError } from "zod";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "@/modules/courses/errors";
import {
  getMyAssignmentSubmission,
  gradeAssignmentSubmission,
  listAssignmentSubmissions,
  listMyAssignmentSubmissionHistory,
  publishAssignmentGrade,
  submitCourseAssignment,
} from "@/modules/courses/assignment-submission-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import {
  cleanupLearnerCourseWriteFixture,
  newLearnerCourseWriteFixture,
  seedLearnerCourseWriteFixture,
} from "../support/learner-course-write-fixture";
import { contextFor, insertPerson as insertActor, person, type Person, type TestRole } from "../support/actors";

/**
 * Assignment submissions: object-level access between people of the SAME college.
 *
 * One assignment is shared by two class sections of a course. Learner A and learner B are in section 1, learner C is in
 * section 2. Teacher 1 teaches section 1, teacher 2 teaches section 2, teacher 0 teaches nothing. Each learner has a
 * submission. Every denial is asserted to be a real access refusal (not a validation error that would pass for the wrong
 * reason), and a refused write must leave the submission exactly as it was.
 */
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("sec-cross-user-submissions needs TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1 (disposable database)");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });

const fixture = newLearnerCourseWriteFixture(); // learner A, section 1, delivery 1, offering, lesson
const { ids } = fixture;
const college = SEED_IDS.collegeA;

const learnerBp = person();
const learnerCp = person();
const teacher1 = person();
const teacher2 = person();
const teacher0 = person();
const section2 = randomUUID();
const delivery2 = randomUUID();
const assignment = randomUUID();
const submissionA = randomUUID();
const submissionB = randomUUID();
const submissionC = randomUUID();
const enrollment = { b: randomUUID(), c: randomUUID() };
const sectionEnrollment = { b: randomUUID(), c: randomUUID() };
const teaching = { t1: randomUUID(), t2: randomUUID() };

const as = (p: Person, role: TestRole, collegeId: string = college): RequestContext => contextFor(p, role, collegeId, "sec-sub");
const learnerA = fixture.context;
const learnerB = as(learnerBp, "LEARNER");
const learnerC = as(learnerCp, "LEARNER");
const t1 = as(teacher1, "FACULTY");
const t2 = as(teacher2, "FACULTY");
const t0 = as(teacher0, "FACULTY");
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "sec-sub-admin", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: college, organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
// A College Admin of the other college.
const otherCollegeAdmin = as(person(), "COLLEGE_ADMIN", SEED_IDS.collegeB);

/** The call must be refused for access reasons, never for malformed input. */
async function refused(call: Promise<unknown>, who: string) {
  let error: unknown = null;
  try {
    await call;
  } catch (caught) {
    error = caught;
  }
  expect(error, who + " must be refused").not.toBeNull();
  expect(error instanceof ZodError, who + " was refused for invalid input, not for access").toBe(false);
  // Exactly the two scope refusals: not a crash, not a validation error, not an unrelated failure.
  expect(error, who).toBeInstanceOf(CoursesServiceError);
  expect(["FACULTY_TEACHING_SCOPE_REQUIRED", "LEARNER_ENROLLMENT_SCOPE_REQUIRED"], who).toContain((error as CoursesServiceError).code);
  return error;
}

const insertPerson = (p: Person, role: string, name: string) => insertActor(pool, p, role, name, college, "sec-sub");
async function insertSubmission(id: string, delivery: string, membership: string, text: string) {
  await pool.query(
    "INSERT INTO assignment_submissions(id,assignment_id,delivery_id,membership_id,submission_type,text_content) VALUES($1,$2,$3,$4,'TEXT',$5)",
    [id, assignment, delivery, membership, text],
  );
}
const row = async (id: string) =>
  (await pool.query("SELECT points_awarded, grade_published, feedback, version, text_content FROM assignment_submissions WHERE id=$1", [id])).rows[0];

describe("assignment submissions: nobody can reach another person's work", () => {
  beforeAll(async () => {
    await seedLearnerCourseWriteFixture(pool, fixture, { content: true });
    const q = pool.query.bind(pool);
    await insertPerson(learnerBp, "LEARNER", "SEC-SUB Learner B");
    await insertPerson(learnerCp, "LEARNER", "SEC-SUB Learner C");
    await insertPerson(teacher1, "FACULTY", "SEC-SUB Teacher 1");
    await insertPerson(teacher2, "FACULTY", "SEC-SUB Teacher 2");
    await insertPerson(teacher0, "FACULTY", "SEC-SUB Teacher 0");
    // Section 2 of the same offering, delivered to a different class.
    await q("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)", [section2, ids.cohort, ids.period, "SEC-SUB s2", "SEC-SUB-" + section2.slice(0, 8)]);
    await q("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)", [delivery2, ids.offering, section2]);
    // B joins section 1 with A; C is in section 2.
    await q("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')", [enrollment.b, learnerBp.membership, ids.program, ids.cohort]);
    await q("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)", [sectionEnrollment.b, enrollment.b, ids.section, ids.period]);
    await q("INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')", [enrollment.c, learnerCp.membership, ids.program, ids.cohort]);
    await q("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)", [sectionEnrollment.c, enrollment.c, section2, ids.period]);
    // Teacher 1 teaches section 1, teacher 2 teaches section 2.
    await q("INSERT INTO course_teaching_assignments(id,delivery_id,membership_id) VALUES($1,$2,$3)", [teaching.t1, ids.delivery, teacher1.membership]);
    await q("INSERT INTO course_teaching_assignments(id,delivery_id,membership_id) VALUES($1,$2,$3)", [teaching.t2, delivery2, teacher2.membership]);
    // One published assignment shared by both sections, and a submission from each learner.
    await q(
      "INSERT INTO course_assignments(id,lesson_id,title,description,max_points,sequence,status,created_by_user_id) VALUES($1,$2,$3,'Shared by both sections',10,0,'PUBLISHED',$4)",
      [assignment, ids.lesson, "SEC-SUB assignment", SEED_IDS.collegeAdminUser],
    );
    await insertSubmission(submissionA, ids.delivery, ids.membership, "A's private answer");
    await insertSubmission(submissionB, ids.delivery, learnerBp.membership, "B's private answer");
    await insertSubmission(submissionC, delivery2, learnerCp.membership, "C's private answer");
  }, 90_000);

  afterAll(async () => {
    try {
      const q = (sql: string, args: unknown[]) => pool.query(sql, args).catch(() => undefined);
      await q("DELETE FROM assignment_submissions WHERE id=ANY($1::uuid[])", [[submissionA, submissionB, submissionC]]);
      await q("DELETE FROM course_assignments WHERE id=$1", [assignment]);
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

  describe("a learner's own view", () => {
    it("each learner sees their own submission and never a classmate's", async () => {
      const a = await getMyAssignmentSubmission(learnerA, assignment, ids.delivery);
      const b = await getMyAssignmentSubmission(learnerB, assignment, ids.delivery);
      expect(a?.id).toBe(submissionA);
      expect(b?.id).toBe(submissionB);
      expect(JSON.stringify(b)).not.toContain("A's private answer");
      expect(JSON.stringify(a)).not.toContain("B's private answer");
    });

    it("history lists only the caller's own submissions", async () => {
      const a = (await listMyAssignmentSubmissionHistory(learnerA)).map((s) => s.id);
      const c = (await listMyAssignmentSubmissionHistory(learnerC)).map((s) => s.id);
      expect(a).toContain(submissionA);
      expect(a).not.toEqual(expect.arrayContaining([submissionB]));
      expect(c).toContain(submissionC);
      expect(c).not.toEqual(expect.arrayContaining([submissionA, submissionB]));
    });

    it("a learner from the other section cannot read the assignment through this section", async () => {
      await refused(getMyAssignmentSubmission(learnerC, assignment, ids.delivery), "learner C via section 1");
    });

    it("a learner cannot submit into a section they are not enrolled in", async () => {
      const before = (await pool.query("SELECT count(*)::int AS n FROM assignment_submissions WHERE assignment_id=$1", [assignment])).rows[0].n;
      await refused(
        submitCourseAssignment(learnerC, assignment, { deliveryId: ids.delivery, submissionType: "TEXT", textContent: "Slipping into another section" } as never),
        "learner C submitting to section 1",
      );
      const after = (await pool.query("SELECT count(*)::int AS n FROM assignment_submissions WHERE assignment_id=$1", [assignment])).rows[0].n;
      expect(after).toBe(before);
    });
  });

  describe("who may read everyone's submissions", () => {
    it("the section's teacher and the college admin can", async () => {
      const seenByTeacher = (await listAssignmentSubmissions(t1, assignment, ids.delivery)).map((s) => s.id);
      expect(seenByTeacher).toEqual(expect.arrayContaining([submissionA, submissionB]));
      // Section 2's work is not in section 1's list.
      expect(seenByTeacher).not.toContain(submissionC);
      const seenByAdmin = (await listAssignmentSubmissions(admin, assignment, ids.delivery)).map((s) => s.id);
      expect(seenByAdmin).toEqual(expect.arrayContaining([submissionA, submissionB]));
    });

    it("learners cannot, including the owner of one of the submissions", async () => {
      for (const [who, actor] of [["learner A", learnerA], ["learner B", learnerB], ["learner C", learnerC]] as const) {
        await refused(listAssignmentSubmissions(actor, assignment, ids.delivery), who);
      }
    });

    it("a teacher who teaches nothing here, or only the other section, cannot", async () => {
      await refused(listAssignmentSubmissions(t0, assignment, ids.delivery), "teacher 0");
      await refused(listAssignmentSubmissions(t2, assignment, ids.delivery), "teacher 2 on section 1");
      await refused(listAssignmentSubmissions(t1, assignment, delivery2), "teacher 1 on section 2");
    });

    it("another college's administrator cannot", async () => {
      await refused(listAssignmentSubmissions(otherCollegeAdmin, assignment, ids.delivery), "other college admin");
    });
  });

  describe("who may grade or publish", () => {
    it("a learner cannot grade or publish, not even their own work", async () => {
      for (const [who, actor, target] of [["A on own", learnerA, submissionA], ["B on A's", learnerB, submissionA], ["A on B's", learnerA, submissionB]] as const) {
        await refused(gradeAssignmentSubmission(actor, target, { pointsAwarded: 10, feedback: "Full marks", expectedVersion: 0 } as never), who + " grading");
        await refused(publishAssignmentGrade(actor, target, { expectedVersion: 0 }), who + " publishing");
      }
    });

    it("a teacher who does not teach that section cannot grade or publish it", async () => {
      await refused(gradeAssignmentSubmission(t0, submissionA, { pointsAwarded: 1, feedback: "x", expectedVersion: 0 } as never), "teacher 0");
      await refused(gradeAssignmentSubmission(t2, submissionA, { pointsAwarded: 1, feedback: "x", expectedVersion: 0 } as never), "teacher 2 on section 1 work");
      await refused(publishAssignmentGrade(t2, submissionA, { expectedVersion: 0 }), "teacher 2 publishing section 1 work");
    });

    it("another college's administrator cannot grade", async () => {
      await refused(gradeAssignmentSubmission(otherCollegeAdmin, submissionA, { pointsAwarded: 1, feedback: "x", expectedVersion: 0 } as never), "other college admin");
    });

    it("every refused attempt left every submission untouched", async () => {
      for (const id of [submissionA, submissionB, submissionC]) {
        const state = await row(id);
        expect(state.points_awarded, id).toBeNull();
        expect(state.grade_published, id).toBe(false);
        expect(state.feedback, id).toBeNull();
        expect(Number(state.version), id).toBe(0);
      }
    });
  });
});
