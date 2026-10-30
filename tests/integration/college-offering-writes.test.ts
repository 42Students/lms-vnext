import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  createCourseOffering,
  updateCourseOffering,
  archiveCourseOffering,
} from "@/modules/courses/offering-service";
import { CoursesServiceError } from "@/modules/courses/errors";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;

const contextA: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "offering-admin-a",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const contextB: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "offering-admin-b",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const ids = { period: randomUUID(), program: randomUUID(), cohort: randomUUID(),
  course: randomUUID() };
const unique = "WO-" + ids.course.slice(0, 8);
let offeringId: string | null = null;

describe.skipIf(!enabled)("College offering writes — disposable PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Isolated PostgreSQL is required");
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, unique, unique]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) " +
      "VALUES($1,$2,$3,$4,8)", [ids.program, SEED_IDS.departmentA, unique, unique]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) " +
      "VALUES($1,$2,$3,$4,$5)", [ids.cohort, ids.program, unique, unique, ids.period]);
    await pool.query("INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
      [ids.course, SEED_IDS.departmentA, unique, unique]);
  });
  afterAll(async () => {
    try {
      if (pool) {
        if (offeringId) await pool.query("DELETE FROM course_offerings WHERE id=$1", [offeringId]);
        await pool.query("DELETE FROM program_term_courses WHERE course_id=$1",[ids.course]);
        await pool.query("DELETE FROM courses WHERE id=$1", [ids.course]);
        await pool.query("DELETE FROM cohorts WHERE id=$1", [ids.cohort]);
        await pool.query("DELETE FROM program_terms WHERE program_id=$1",[ids.program]);
        await pool.query("DELETE FROM programs WHERE id=$1", [ids.program]);
        await pool.query("DELETE FROM academic_periods WHERE id=$1", [ids.period]);
        // Never delete append-only activity_events; subjects are string identifiers.
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });
  it("denies foreign admin without leaking a college-A offering", async () => {
    const input = { courseId: ids.course, cohortId: ids.cohort, academicPeriodId: ids.period,
      type: "CORE" as const, credits: 3, displayOrder: 0 };
    await expect(createCourseOffering(contextB, input)).rejects.toBeDefined();
  });
  it("creates, edits and archives with atomic audit and duplicate denial", async () => {
    if (!pool) throw new Error("PostgreSQL pool required");
    const input = { courseId: ids.course, cohortId: ids.cohort, academicPeriodId: ids.period,
      type: "CORE" as const, credits: 3, displayOrder: 0 };
    const created = await createCourseOffering(contextA, input);
    offeringId = created.id;
    expect(created.credits).toBe(3);
    await expect(createCourseOffering(contextA, input))
      .rejects.toMatchObject({ code: "OFFERING_CONFLICT" });
    await expect(updateCourseOffering(contextB, created.id, { credits: 7 }))
      .rejects.toBeInstanceOf(AuthorizationError);
    const updated = await updateCourseOffering(contextA, created.id, { credits: 6, type: "ELECTIVE" });
    expect(updated).toMatchObject({ credits: 6, type: "ELECTIVE" });
    const archived = await archiveCourseOffering(contextA, created.id);
    expect(archived.status).toBe("ARCHIVED");
    const events = await pool.query(
      "SELECT event_type FROM activity_events WHERE subject_id=$1::text " +
      "AND event_type = ANY($2::text[]) ORDER BY occurred_at",
      [created.id, [
        ACTIVITY_EVENT_TYPES.COURSES_OFFERING_CREATED,
        ACTIVITY_EVENT_TYPES.COURSES_OFFERING_UPDATED,
        ACTIVITY_EVENT_TYPES.COURSES_OFFERING_ARCHIVED,
      ]]);
    expect(events.rows.map(row => row.event_type)).toEqual([
      ACTIVITY_EVENT_TYPES.COURSES_OFFERING_CREATED,
      ACTIVITY_EVENT_TYPES.COURSES_OFFERING_UPDATED,
      ACTIVITY_EVENT_TYPES.COURSES_OFFERING_ARCHIVED,
    ]);
  });
});
