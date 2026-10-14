import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getLearnerClassSchedule } from "@/modules/academics/learner-schedule-service";
import { eventsForLearnerIstScheduleDay, learnerScheduleDateFromDay } from "@/modules/academics/learner-ist-schedule-model";
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
  // Retain audit history and identities; discard the isolated database after the run.
  await pool.end(); await closeDatabaseConnection();
}, 30000);
describe("IST day/week agenda from own persisted class", () => {
  it("shows the real UTC month-boundary class on the IST November day", async () => {
    const data = await getLearnerClassSchedule(fixture.learner.context);
    const events = data.events.map(event => ({ ...event, startsAt: event.startsAt.toISOString() }));
    expect(eventsForLearnerIstScheduleDay(events, learnerScheduleDateFromDay("2026-11-01")).map(event => event.id)).toContain(fixture.ids.event);
    expect(eventsForLearnerIstScheduleDay(events, learnerScheduleDateFromDay("2026-10-31")).map(event => event.id)).not.toContain(fixture.ids.event);
  });
  it("denies foreign-college, suspended and wrong-role schedule requests", async () => {
    const base = fixture.learner.context;
    for (const actor of [
      { ...base, membership: { ...base.membership!, collegeId: SEED_IDS.collegeB } },
      { ...base, membership: { ...base.membership!, status: "SUSPENDED" } },
      { ...base, membership: { ...base.membership!, roles: ["FACULTY"] } },
    ] as RequestContext[]) await expect(getLearnerClassSchedule(actor)).rejects.toBeDefined();
  });
});
