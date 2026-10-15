import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listCollegeAssessmentAggregate } from "@/modules/courses/college-assessment-aggregate-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB09_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

const adminA: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "w-ca-assessment-admin",
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
const adminB: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "w-ca-assessment-college-b",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};
const learner: RequestContext = {
  ...adminA,
  membership: { ...adminA.membership!, roles: ["LEARNER"] },
};
const ids = {
  period: randomUUID(),
  program: randomUUID(),
  cohort: randomUUID(),
  course: randomUUID(),
  offering: randomUUID(),
  path: randomUUID(),
  lesson: randomUUID(),
  assignment: randomUUID(),
  quiz: randomUUID(),
};
const code = "WCA-" + ids.period.slice(0, 8);

describe.skipIf(!enabled)("College Admin assessment aggregates — disposable PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("TEST_DATABASE_URL is required");
    const relations = await pool.query(
      "SELECT to_regclass('public.course_assignments') AS assignments, " +
      "to_regclass('public.course_quizzes') AS quizzes, " +
      "to_regclass('public.assignment_submissions') AS submissions, " +
      "to_regclass('public.quiz_attempts') AS attempts",
    );
    for (const item of Object.values(relations.rows[0] ?? {})) {
      if (!item) throw new Error("Registered C4 assessment tables are required");
    }

    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, code, code],
    );
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) " +
      "VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, code, code],
    );
    await pool.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id) " +
      "VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, code, code, ids.period],
    );
    await pool.query(
      "INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
      [ids.course, SEED_IDS.departmentA, code, code],
    );
    await pool.query(
      "INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) " +
      "VALUES($1,$2,$3,$4)",
      [ids.offering, ids.course, ids.cohort, ids.period],
    );
    await pool.query(
      "INSERT INTO course_learning_paths(id,offering_id,title) VALUES($1,$2,$3)",
      [ids.path, ids.offering, code],
    );
    await pool.query(
      "INSERT INTO course_lessons(id,learning_path_id,name,sequence) VALUES($1,$2,$3,0)",
      [ids.lesson, ids.path, code],
    );
    await pool.query(
      "INSERT INTO course_assignments(id,lesson_id,title,max_points,sequence,created_by_user_id) " +
      "VALUES($1,$2,$3,10,0,$4)",
      [ids.assignment, ids.lesson, code, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      "INSERT INTO course_quizzes(id,lesson_id,title,total_points,sequence,created_by_user_id) " +
      "VALUES($1,$2,$3,10,0,$4)",
      [ids.quiz, ids.lesson, code, SEED_IDS.collegeAdminUser],
    );
  });

  afterAll(async () => {
    try {
      if (pool) {
        const deletes: Array<[string, string]> = [
          ["course_quizzes", ids.quiz],
          ["course_assignments", ids.assignment],
          ["course_lessons", ids.lesson],
          ["course_learning_paths", ids.path],
          ["course_offerings", ids.offering],
          ["courses", ids.course],
          ["cohorts", ids.cohort],
          ["programs", ids.program],
          ["academic_periods", ids.period],
        ];
        for (const [table, id] of deletes) {
          // Fixed test-owned table names; the only bound variable is UUID.
          await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        }
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("shows both persisted authoring rows for own college and neither to a different college", async () => {
    const filter = { q: code, status: "ALL", page: 1 };
    const [ownAssignments, ownQuizzes, foreignAssignments, foreignQuizzes] =
      await Promise.all([
        listCollegeAssessmentAggregate(adminA, "ASSIGNMENT", filter),
        listCollegeAssessmentAggregate(adminA, "QUIZ", filter),
        listCollegeAssessmentAggregate(adminB, "ASSIGNMENT", filter),
        listCollegeAssessmentAggregate(adminB, "QUIZ", filter),
      ]);
    expect(ownAssignments.items.map((item) => item.id)).toContain(ids.assignment);
    expect(ownQuizzes.items.map((item) => item.id)).toContain(ids.quiz);
    for(const kind of ["ASSIGNMENT","QUIZ"] as const){
      const mine=await listCollegeAssessmentAggregate(adminA,kind,{courseCode:code});
      const missing=await listCollegeAssessmentAggregate(adminA,kind,{courseCode:"OTHER-COURSE"});
      expect(mine.items).toHaveLength(1);
      expect(missing.items).toEqual([]);
    }
    expect(foreignAssignments.items).toEqual([]);
    expect(foreignQuizzes.items).toEqual([]);
    const [unreleased,released]=await Promise.all([
      listCollegeAssessmentAggregate(adminA,"QUIZ",{q:code,results:"HIDDEN"}),
      listCollegeAssessmentAggregate(adminA,"QUIZ",{q:code,results:"PUBLISHED"}),
    ]);
    expect(unreleased.items.map(r=>r.id)).toContain(ids.quiz);
    expect(unreleased.items.find(r=>r.id===ids.quiz)?.resultsPublished).toBe(false);
    expect(released.items).toEqual([]);
    for(const kind of ["ASSIGNMENT","QUIZ"] as const){
      const shared=await listCollegeAssessmentAggregate(adminA,kind,{q:code,scope:"SHARED"});
      const section=await listCollegeAssessmentAggregate(adminA,kind,{q:code,scope:"SECTION"});
      expect(shared.items).toHaveLength(1);
      expect(section.items).toEqual([]);
    }
  });

  it("denies learners and fails closed on foreign college parameters", async () => {
    for (const kind of ["ASSIGNMENT", "QUIZ"] as const) {
      await expect(listCollegeAssessmentAggregate(learner, kind, {}))
        .rejects.toBeInstanceOf(AuthorizationError);
      await expect(listCollegeAssessmentAggregate(adminA, kind, {
        collegeId: SEED_IDS.collegeB,
      })).rejects.toBeDefined();
    }
  });
});
