import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { listCollegeLessons } from "@/modules/courses/college-learning-directory-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;
const superAdmin: RequestContext = {
  user: { id: SEED_IDS.superAdminUser, identityUid: "admin-lesson-fixture", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA },
};
describe.skipIf(!enabled)("Super Admin lesson read scope in PG", () => {
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });
  it("includes an in-test course path lesson only in selected college and denies wrong role", async () => {
    const suffix = randomUUID().slice(0, 10);
    // Unique fixtures remain inside the disposable DB to preserve append-only relationships.
    const dep = await pool!.query<{ id: string }>("insert into departments (college_id, name) values ($1,$2) returning id",
      [SEED_IDS.collegeA, "Admin Lesson Dept " + suffix]);
    const program = await pool!.query<{ id: string }>(
      "insert into programs (department_id,name,code,duration_terms) values ($1,$2,$3,8) returning id",
      [dep.rows[0]!.id, "Lesson Program " + suffix, "LP" + suffix]);
    const period = await pool!.query<{ id: string }>(
      "insert into academic_periods (college_id,name,code,start_date,end_date) values ($1,$2,$3,'2026-07-01','2027-06-30') returning id",
      [SEED_IDS.collegeA, "Lesson Year " + suffix, "LY" + suffix]);
    const cohort = await pool!.query<{ id: string }>(
      "insert into cohorts (program_id,name,code,start_period_id) values ($1,$2,$3,$4) returning id",
      [program.rows[0]!.id, "Lesson Cohort " + suffix, "LC" + suffix, period.rows[0]!.id]);
    const course = await pool!.query<{ id: string }>(
      "insert into courses (department_id,name,code) values ($1,$2,$3) returning id",
      [dep.rows[0]!.id, "Lesson Course " + suffix, "LE" + suffix]);
    const offering = await pool!.query<{ id: string }>(
      "insert into course_offerings (course_id,cohort_id,academic_period_id) values ($1,$2,$3) returning id",
      [course.rows[0]!.id, cohort.rows[0]!.id, period.rows[0]!.id]);
    const path = await pool!.query<{ id: string }>(
      "insert into course_learning_paths (offering_id,title) values ($1,$2) returning id",
      [offering.rows[0]!.id, "Path " + suffix]);
    const lesson = await pool!.query<{ id: string }>(
      "insert into course_lessons (learning_path_id,name,sequence) values ($1,$2,0) returning id",
      [path.rows[0]!.id, "Admin Lesson " + suffix]);
    const query = { q: "Admin Lesson " + suffix };
    expect((await listCollegeLessons(superAdmin, query)).items.some(row => row.id === lesson.rows[0]!.id)).toBe(true);
    const other = { ...superAdmin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeB } };
    expect((await listCollegeLessons(other, query)).items).toHaveLength(0);
    const denied = { ...superAdmin, user: { ...superAdmin.user, systemRoles: [] } };
    await expect(listCollegeLessons(denied, query)).rejects.toBeInstanceOf(AuthorizationError);
  });
});
