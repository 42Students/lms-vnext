import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getLearnerAttendanceWorkspace } from "@/modules/attendance/learner-service";
import { filterLearnerAttendanceMonth, resolveLearnerAttendanceFilters } from "@/modules/attendance/learner-attendance-filter-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { newLearnerLearningFixture, seedLearnerLearningFixture } from "../support/learner-learning-surface-fixture";
if (!process.env.TEST_DATABASE_URL) throw new Error("Requires disposable TEST_DATABASE_URL");
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
const fixture = newLearnerLearningFixture();
beforeAll(async () => {
  await seedLearnerLearningFixture(pool, fixture);
  await pool.query("UPDATE section_schedule_events SET starts_at='2026-10-31T18:30:00Z', ends_at='2026-10-31T19:30:00Z' WHERE id=$1", [fixture.ids.event]);
}, 45000);
afterAll(async () => {
  // Preserve fixture activity history and identities; the isolated database is disposable.
  // The shared cleanup helper deletes append-only events, so deliberately do not invoke it.
  await pool.end(); await closeDatabaseConnection();
}, 30000);
describe("own persisted attendance month in IST", () => {
  it("filters a real class into November and rejects a foreign Course selector", async () => {
    const workspace = await getLearnerAttendanceWorkspace(fixture.learner.context);
    const rows = workspace.records.map(row => ({ ...row, startsAt: row.startsAt.toISOString() }));
    expect(filterLearnerAttendanceMonth(rows, fixture.ids.delivery, "2026-11").map(row => row.id)).toContain(fixture.ids.event);
    expect(filterLearnerAttendanceMonth(rows, fixture.ids.delivery, "2026-10").map(row => row.id)).not.toContain(fixture.ids.event);
    expect(resolveLearnerAttendanceFilters({ deliveryId: SEED_IDS.collegeB, month: "2026-11" }, workspace.courses, "2026-10").deliveryId)
      .toBe(fixture.ids.delivery);
  });
  it("denies foreign-college, suspended and wrong-role requests", async () => {
    const base = fixture.learner.context;
    const denied: RequestContext[] = [
      { ...base, membership: { ...base.membership!, collegeId: SEED_IDS.collegeB } },
      { ...base, membership: { ...base.membership!, status: "SUSPENDED" } },
      { ...base, membership: { ...base.membership!, roles: ["FACULTY"] } },
    ];
    for (const context of denied) await expect(getLearnerAttendanceWorkspace(context)).rejects.toBeDefined();
  });
});
