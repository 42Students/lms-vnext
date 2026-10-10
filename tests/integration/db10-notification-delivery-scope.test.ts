import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { deliverInAppNotification } from "@/modules/activity/notification-service";
import { recordActivityEvent } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DB10 delivery tests require disposable PostgreSQL");

const pool = new Pool({ connectionString: databaseUrl, max: 2 });
const tag = "w06_scoped_delivery_fixture";

const facultyB: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeBMembership,
    collegeId: SEED_IDS.collegeB,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY"],
  },
};

async function eventForCollegeB() {
  return recordActivityEvent(facultyB, {
    eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_LEARNER_ENROLLED,
    collegeId: SEED_IDS.collegeB,
    subjectType: tag,
    subjectId: crypto.randomUUID(),
    summary: "Private College B notice",
  });
}

async function cleanup() {
  await pool.query(
    "delete from in_app_notifications where event_id in (select id from activity_events where subject_type = $1)",
    [tag],
  );
  await pool.query("delete from activity_events where subject_type = $1", [tag]);
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("W06 tenant-safe notification delivery", () => {
  it("rejects other-college recipients before delivering any rows", async () => {
    const event = await eventForCollegeB();
    const details = { title: "College B event", body: "Restricted to B" };

    await expect(deliverInAppNotification(event.id, [
      SEED_IDS.facultyUser,
      SEED_IDS.learnerUser, // Only belongs to College A.
    ], details)).rejects.toMatchObject({ code: "NOTIFICATION_SCOPE_MISMATCH" });

    const check = await pool.query<{ count: string }>(
      "select count(*)::text as count from in_app_notifications where event_id = $1",
      [event.id],
    );
    expect(check.rows[0]?.count).toBe("0");

    const allowed = await deliverInAppNotification(
      event.id, [SEED_IDS.facultyUser], details,
    );
    expect(allowed.delivered).toBe(1);
  });

  it("does not confuse inactive membership or inactive user with eligibility", async () => {
    const event = await eventForCollegeB();
    // College A learner is active globally but has no College B membership.
    await expect(deliverInAppNotification(
      event.id, [SEED_IDS.learnerUser], {
        title: "Private event", body: "Must stay at college B",
      },
    )).rejects.toMatchObject({ code: "NOTIFICATION_SCOPE_MISMATCH" });
  });

  it("does not treat a platform-level event as college-scoped", async () => {
    const event = await recordActivityEvent(facultyB, {
      eventType: ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_CREATED,
      subjectType: tag,
      subjectId: crypto.randomUUID(),
      summary: "Platform-wide notice",
    });
    const result = await deliverInAppNotification(event.id, [
      SEED_IDS.facultyUser,
      SEED_IDS.learnerUser,
    ], { title: "Platform info", body: "Global notice" });
    expect(result.delivered).toBe(2);
  });
});
