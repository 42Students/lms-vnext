import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  previewCollegeRecurringSchedule, RecurringPreviewNotFoundError,
} from "@/modules/academics/college-recurring-preview-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const admin: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "recurrence-a", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const foreign: RequestContext = {
  user: { id: SEED_IDS.facultyUser, identityUid: "recurrence-b", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.facultyCollegeBMembership, collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const ids = { period: randomUUID(), program: randomUUID(), cohort: randomUUID(),
  section: randomUUID(), event: randomUUID() };
const code = "WP-" + ids.period.slice(0, 8);
const payload = { sectionId: ids.section, from: "2026-10-15", to: "2026-10-15",
  weekdays: [4], startTime: "09:00", endTime: "10:00" };

describe.skipIf(!enabled)("College recurring schedule preview with PostgreSQL conflicts", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("Isolated PostgreSQL is required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
      [ids.period, SEED_IDS.collegeA, code, code]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
      [ids.program, SEED_IDS.departmentA, code, code]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
      [ids.cohort, ids.program, code, code, ids.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
      [ids.section, ids.cohort, ids.period, code, code]);
    await pool.query("INSERT INTO section_schedule_events(id,section_id,title,starts_at,ends_at) " +
      "VALUES($1,$2,$3,$4,$5)",
      [ids.event, ids.section, code, "2026-10-15T03:45:00.000Z", "2026-10-15T04:15:00.000Z"]);
  });
  afterAll(async () => {
    try {
      if (pool) {
        for (const [table, id] of [
          ["section_schedule_events", ids.event],
          ["sections", ids.section], ["cohorts", ids.cohort],
          ["programs", ids.program], ["academic_periods", ids.period],
        ] as const) await pool.query(`DELETE FROM ${table} WHERE id=$1`, [id]);
      }
    } finally { await pool?.end(); await closeDatabaseConnection(); }
  });
  it("detects a real persisted section collision without scheduling", async () => {
    const result = await previewCollegeRecurringSchedule(admin, payload);
    expect(result.slots).toHaveLength(1);
    expect(result.ready).toBe(0);
    expect(result.blocked).toBe(1);
    expect(result.slots[0].conflicts).toEqual(["SECTION_BUSY"]);
  });
  it("foreign college sees only NOT_FOUND, wrong role is denied", async () => {
    await expect(previewCollegeRecurringSchedule(foreign, payload))
      .rejects.toBeInstanceOf(RecurringPreviewNotFoundError);
    await expect(previewCollegeRecurringSchedule({
      ...admin, membership: { ...admin.membership!, roles: ["LEARNER"] },
    }, payload)).rejects.toBeInstanceOf(AuthorizationError);
  });
});
