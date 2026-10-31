import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { recordActivityEvent } from "@/modules/activity/service";
import {
  deliverInAppNotification,
  markOwnNotificationRead,
} from "@/modules/activity/notification-service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (
  !databaseUrl ||
  process.env.DB018_ISOLATED_TEST_DATABASE !== "1" ||
  process.env.DATABASE_URL !== databaseUrl
) {
  throw new Error(
    "DB18 notification races require explicitly isolated TEST_DATABASE_URL, " +
      "DB018_ISOLATED_TEST_DATABASE=1 and identical DATABASE_URL",
  );
}
const pool = new Pool({ connectionString: databaseUrl, max: 3 });
const ownedEvents: string[] = [];

const collegeAdmin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
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
const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "seed-learner",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

async function waitForTwoBlockedQueries(table: string) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const result = await pool.query<{ n: number }>(
      `SELECT count(*)::integer AS n FROM pg_stat_activity
         WHERE datname=current_database() AND pid <> pg_backend_pid()
           AND wait_event_type='Lock' AND query ILIKE $1`,
      [`%${table}%`],
    );
    if ((result.rows[0]?.n ?? 0) >= 2) return;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error("Both real notification writers must block on " + table);
}

afterEach(async () => {
  if (!ownedEvents.length) return;
  await pool.query(
    "DELETE FROM in_app_notifications WHERE event_id = ANY($1::uuid[])",
    [ownedEvents],
  );
  await pool.query(
    "DELETE FROM activity_events WHERE id = ANY($1::uuid[])",
    [ownedEvents],
  );
  ownedEvents.length = 0;
});
afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("DB18 P5-R20 notification receipt races on disposable PostgreSQL", () => {
  it("P5-R20 deduplicates concurrent delivery and retains the first read timestamp", async () => {
    const key = randomUUID();
    const event = await recordActivityEvent(collegeAdmin, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_ISSUED,
      collegeId: SEED_IDS.collegeA,
      subjectType: "placement_offer",
      subjectId: key,
      summary: "DB18 notification race " + key,
      dedupeKey: "db18-notification-race:" + key,
    });
    ownedEvents.push(event.id);
    const input = {
      title: "Race-safe offer notice",
      body: "One delivery receipt per user and event.",
      actionHref: "/learn/placements",
    };

    const deliveryGate = await pool.connect();
    let deliveries: Promise<PromiseSettledResult<{ delivered: number; skippedDuplicate: number }>[]> | undefined;
    try {
      await deliveryGate.query("BEGIN");
      await deliveryGate.query("LOCK TABLE in_app_notifications IN SHARE MODE");
      deliveries = Promise.allSettled([
        deliverInAppNotification(event.id, [SEED_IDS.learnerUser], input),
        deliverInAppNotification(event.id, [SEED_IDS.learnerUser], input),
      ]);
      await waitForTwoBlockedQueries("in_app_notifications");
      await deliveryGate.query("COMMIT");

      const outcomes = await deliveries;
      expect(outcomes.every(row => row.status === "fulfilled")).toBe(true);
      const successes = outcomes.flatMap(row =>
        row.status === "fulfilled" ? [row.value] : [],
      );
      expect(successes.map(row => row.delivered).sort()).toEqual([0, 1]);
      expect(successes.map(row => row.skippedDuplicate).sort()).toEqual([0, 1]);
    } finally {
      await deliveryGate.query("ROLLBACK");
      deliveryGate.release();
      if (deliveries) await deliveries;
    }

    const receipt = await pool.query<{ id: string; read_at: Date | null }>(
      "SELECT id,read_at FROM in_app_notifications WHERE event_id=$1 AND user_id=$2",
      [event.id, SEED_IDS.learnerUser],
    );
    expect(receipt.rows).toHaveLength(1);
    expect(receipt.rows[0].read_at).toBeNull();

    const readGate = await pool.connect();
    let acknowledgements: Promise<PromiseSettledResult<{ readAt: Date | null }>[]> | undefined;
    try {
      await readGate.query("BEGIN");
      await readGate.query(
        "SELECT id FROM in_app_notifications WHERE id=$1 FOR UPDATE",
        [receipt.rows[0].id],
      );
      acknowledgements = Promise.allSettled([
        markOwnNotificationRead(learner, receipt.rows[0].id),
        markOwnNotificationRead(learner, receipt.rows[0].id),
      ]);
      await waitForTwoBlockedQueries("in_app_notifications");
      await readGate.query("COMMIT");

      const outcomes = await acknowledgements;
      expect(outcomes.every(row => row.status === "fulfilled")).toBe(true);
      const success = outcomes.flatMap(row =>
        row.status === "fulfilled" ? [row.value] : [],
      );
      const persisted = await pool.query<{ read_at: Date | null }>(
        "SELECT read_at FROM in_app_notifications WHERE id=$1",
        [receipt.rows[0].id],
      );
      const readAt = persisted.rows[0]?.read_at;
      expect(readAt).toBeInstanceOf(Date);
      expect(success.every(row => row.readAt?.getTime() === readAt?.getTime())).toBe(true);
      expect(success[0].readAt?.getTime()).toBe(success[1].readAt?.getTime());
    } finally {
      await readGate.query("ROLLBACK");
      readGate.release();
      if (acknowledgements) await acknowledgements;
    }
  });
});
