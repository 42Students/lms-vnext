import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getOwnLearnerAcademicSummary } from "@/modules/people/learner-academic-summary-service";
import { getOwnLearnerAssessmentBrowse } from "@/modules/placements/learner-assessment-browse-service";
import { getOwnLearnerPlacementAlerts } from "@/modules/placements/learner-placement-alerts-service";
import { getOwnLearnerNotificationHistory } from "@/modules/activity/learner-notification-history-service";
import { markOwnLearnerNotificationRead } from "@/modules/activity/learner-notification-read-service";
import { learnerAssessmentDueBuckets } from "@/modules/placements/learner-assessment-due-buckets";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  newLearnerPositiveFixture,
  seedLearnerPositiveFixture,
  cleanupLearnerPositiveFixture,
} from "../support/learner-positive-fixture";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Positive-path tests require disposable TEST_DATABASE_URL");
}
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
const fixture = newLearnerPositiveFixture();
const { ids, context } = fixture;
let seeded = false;
beforeAll(async () => {
  await seedLearnerPositiveFixture(pool, fixture);
  seeded = true;
}, 30_000);
afterAll(async () => {
  try {
    if (seeded) await cleanupLearnerPositiveFixture(pool, fixture);
  } finally {
    await pool.end();
    await closeDatabaseConnection();
  }
}, 30_000);

describe("Learner real PostgreSQL positive paths with fresh own-member records", () => {
  it("resolves its newly inserted learner membership and active academic enrollment", async () => {
    const summary = await getOwnLearnerAcademicSummary(context);
    expect(summary.title).toBe("Positive path Learner");
    expect(summary.enrollment?.program).toBe("W04 Placement Fixture");
    expect(summary.enrollment?.cohort).toBe("W04 Placement Fixture");
  });

  it("reads the inserted shortlisted application and scheduled assessment", async () => {
    const workspace = await getOwnLearnerAssessmentBrowse(context);
    const row = workspace.rounds.find(item => item.applicationId === ids.application);
    expect(row?.roundId).toBe(ids.round);
    expect(row?.roundKind).toBe("TEST");
    const buckets = learnerAssessmentDueBuckets(
      workspace.rounds.map(item => ({
        ...item,
        scheduledAt: item.scheduledAt?.toISOString() ?? null,
        exception: item.exception
          ? { scheduledAt: item.exception.scheduledAt.toISOString() }
          : null,
      })),
      Date.parse("2030-10-14T00:00:00Z"),
    );
    expect(buckets.today.some(item => item.roundId === ids.round)).toBe(true);
  });

  it("reads own-college inserted notifications but excludes another college of same user", async () => {
    const history = await getOwnLearnerNotificationHistory(context, {});
    expect(history.items.some(row => row.notification.id === ids.notificationA)).toBe(true);
    expect(history.items.some(row => row.notification.id === ids.notificationB)).toBe(false);
    const alerts = await getOwnLearnerPlacementAlerts(context);
    expect(alerts.some(row => row.id === ids.notificationA)).toBe(true);
    expect(alerts.some(row => row.id === ids.notificationB)).toBe(false);
  });

  it("persists own readAt idempotently and updates the unread history", async () => {
    const first = await markOwnLearnerNotificationRead(context, ids.notificationA);
    expect(first.id).toBe(ids.notificationA);
    expect(first.readAt).not.toBeNull();
    const again = await markOwnLearnerNotificationRead(context, ids.notificationA);
    expect(again.readAt?.getTime()).toBe(first.readAt?.getTime());
    const unread = await getOwnLearnerNotificationHistory(context, { unread: "1" });
    expect(unread.items.some(row => row.notification.id === ids.notificationA)).toBe(false);
  });

  it("denies mark-read for a foreign-college notification or forged principal", async () => {
    await expect(markOwnLearnerNotificationRead(context, ids.notificationB)).rejects.toBeDefined();
    const swapped: RequestContext = {
      ...context,
      user: { ...context.user, id: SEED_IDS.facultyUser },
    };
    await expect(markOwnLearnerNotificationRead(swapped, ids.notificationA))
      .rejects.toBeInstanceOf(AuthorizationError);
    const stored = await pool.query<{ read_at: Date | null }>(
      "SELECT read_at FROM in_app_notifications WHERE id=$1", [ids.notificationB],
    );
    expect(stored.rows[0]?.read_at).toBeNull();
  });
});
