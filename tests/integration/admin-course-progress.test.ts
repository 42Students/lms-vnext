import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { listCollegeCourseProgress } from "@/modules/courses/college-learning-directory-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }) : null;
const admin: RequestContext = { user: { id: SEED_IDS.superAdminUser, identityUid: "admin-progress-fixture",
  platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] }, membership: null,
  adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA } };
describe.skipIf(!enabled)("Super Admin course progress scoped PG read", () => {
  afterAll(async () => { await pool?.end(); await closeDatabaseConnection(); });
  it("shows an in-test offering with honest zero activity, excludes it cross-college, denies wrong role", async () => {
    const s = randomUUID().slice(0, 10);
    const dep = await pool!.query<{id:string}>("insert into departments (college_id,name) values ($1,$2) returning id",
      [SEED_IDS.collegeA, "Course Progress Dept " + s]);
    const program = await pool!.query<{id:string}>(
      "insert into programs (department_id,name,code,duration_terms) values ($1,$2,$3,8) returning id",
      [dep.rows[0]!.id, "Progress Program " + s, "PP" + s]);
    const period = await pool!.query<{id:string}>(
      "insert into academic_periods (college_id,name,code,start_date,end_date) values ($1,$2,$3,'2026-07-01','2027-06-30') returning id",
      [SEED_IDS.collegeA, "Progress Year " + s, "PY" + s]);
    const cohort = await pool!.query<{id:string}>(
      "insert into cohorts (program_id,name,code,start_period_id) values ($1,$2,$3,$4) returning id",
      [program.rows[0]!.id, "Progress Cohort " + s, "PC" + s, period.rows[0]!.id]);
    const course = await pool!.query<{id:string}>(
      "insert into courses (department_id,name,code) values ($1,$2,$3) returning id",
      [dep.rows[0]!.id, "Course Progress " + s, "CP" + s]);
    const offering = await pool!.query<{id:string}>(
      "insert into course_offerings (course_id,cohort_id,academic_period_id) values ($1,$2,$3) returning id",
      [course.rows[0]!.id,cohort.rows[0]!.id,period.rows[0]!.id]);
    const own = await listCollegeCourseProgress(admin, { q: "Course Progress " + s });
    expect(own.items).toEqual([expect.objectContaining({
      offeringId: offering.rows[0]!.id, recordedRows: 0, completedRows: 0,
    })]);
    const other = { ...admin, adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeB } };
    expect((await listCollegeCourseProgress(other, { q: "Course Progress " + s })).items).toHaveLength(0);
    await expect(listCollegeCourseProgress({ ...admin,
      user: { ...admin.user, systemRoles: [] } }, {})).rejects.toBeInstanceOf(AuthorizationError);
  });
});
