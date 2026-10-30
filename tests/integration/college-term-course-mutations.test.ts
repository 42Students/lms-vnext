import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  addCollegeTermMapping, removeCollegeTermMapping,
  CollegeTermMappingError,
} from "@/modules/academics/college-term-mapping-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const context: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "w-term-course", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {
  user: { ...context.user, id: SEED_IDS.facultyUser },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const learner: RequestContext = { ...context, membership: { ...context.membership!, roles: ["LEARNER"] } };
const ids = {
  program: randomUUID(), term: randomUUID(), course: randomUUID(),
  period: randomUUID(), cohort: randomUUID(), offering: randomUUID(),
};
const unique = "w-term-" + ids.term.slice(0, 8);
let createdMapping: string | undefined;

describe.skipIf(!enabled)("College Admin term-course CRUD PG, scoped guards", () => {
  beforeAll(async () => {
    if (!pool) throw Error("Isolated PG is required");
    await pool.query(
      "INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [ids.program, SEED_IDS.departmentA, unique],
    );
    await pool.query(
      "INSERT INTO program_terms(id,program_id,term_number,name) VALUES($1,$2,1,$3)",
      [ids.term, ids.program, unique],
    );
    await pool.query(
      "INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3::text,$3::text)",
      [ids.course, SEED_IDS.departmentA, unique],
    );
    await pool.query(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, unique],
    );
    await pool.query(
      "INSERT INTO cohorts(id,program_id,name,code,start_period_id,status) " +
      "VALUES($1,$2,$3::text,$3::text,$4,'ACTIVE')",
      [ids.cohort, ids.program, unique, ids.period],
    );
    await pool.query(
      "INSERT INTO cohort_progression_state(cohort_id,current_term_number) VALUES($1,1) ON CONFLICT (cohort_id) DO NOTHING",
      [ids.cohort],
    );
  });
  afterAll(async () => {
    try {
      if (pool) {
        // Activity events are append-only; retain this fixture's historical
        // event records in the disposable database instead of deleting them.
        await pool.query("DELETE FROM course_offerings WHERE id=$1", [ids.offering]);
        if (createdMapping) await pool.query("DELETE FROM program_term_courses WHERE id=$1", [createdMapping]);
        // The version-zero state is cohort-owned; delete of the cohort cascades it.
        await pool.query("DELETE FROM cohorts WHERE id=$1", [ids.cohort]);
        await pool.query("DELETE FROM academic_periods WHERE id=$1", [ids.period]);
        await pool.query("DELETE FROM program_terms WHERE id=$1", [ids.term]);
        await pool.query("DELETE FROM courses WHERE id=$1", [ids.course]);
        await pool.query("DELETE FROM programs WHERE id=$1", [ids.program]);
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });
  it("adds mapped course and rejects duplicate based on persisted row", async () => {
    const body = { programTermId: ids.term, courseId: ids.course, type: "CORE", credits: 3 };
    const mapped = await addCollegeTermMapping(context, body);
    createdMapping = mapped.id;
    expect(mapped.displayOrder).toBe(1);
    await expect(addCollegeTermMapping(context, body))
      .rejects.toMatchObject({ code: "TERM_COURSE_DUPLICATE" });
  });
  it("rejects cross-college, wrong role, and foreign semester target", async () => {
    const body = { programTermId: ids.term, courseId: ids.course, type: "ELECTIVE", credits: 3 };
    await expect(addCollegeTermMapping(foreign, body)).rejects.toMatchObject({ code: "TERM_NOT_FOUND" });
    await expect(addCollegeTermMapping(learner, body)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(removeCollegeTermMapping(foreign, createdMapping!, { confirm: true }))
      .rejects.toBeInstanceOf(CollegeTermMappingError);
  });
  it("blocks unmap both during an offering and after archival, preserving curriculum history", async () => {
    await pool!.query(
      "INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id,status) " +
      "VALUES($1,$2,$3,$4,'ACTIVE')",
      [ids.offering, ids.course, ids.cohort, ids.period],
    );
    await expect(removeCollegeTermMapping(context, createdMapping!, { confirm: true }))
      .rejects.toMatchObject({ code: "TERM_COURSE_IN_USE" });
    await pool!.query("UPDATE course_offerings SET status='ARCHIVED' WHERE id=$1", [ids.offering]);
    // DB02 preserves historical term/course identity even after archival:
    // no service may silently delete the underlying curriculum link.
    await expect(removeCollegeTermMapping(context, createdMapping!, { confirm: true }))
      .rejects.toMatchObject({ cause: { code: "23514" } });
    const preserved = await pool!.query(
      "SELECT id FROM program_term_courses WHERE id=$1", [createdMapping],
    );
    expect(preserved.rows).toEqual([{ id: createdMapping }]);
    const audit = await pool!.query(
      "SELECT event_type FROM activity_events WHERE subject_type='program_term_course' AND subject_id=$1 ORDER BY occurred_at",
      [createdMapping],
    );
    expect(audit.rows).toHaveLength(1);
  });
});
