import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { withdrawPlacementApplication } from "@/modules/placements/application-service";
import { getOwnLearnerApplicationHistory } from "@/modules/placements/learner-application-detail-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  newLearnerPositiveFixture,
  seedLearnerPositiveFixture,
  cleanupLearnerPositiveFixture,
} from "../support/learner-positive-fixture";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Learner withdrawal integration tests require disposable TEST_DATABASE_URL");
}
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
type Fixture = ReturnType<typeof newLearnerPositiveFixture>;
let fixture: Fixture | null = null;
const reason = "I have chosen a different career opportunity.";

beforeEach(async () => {
  const fresh = newLearnerPositiveFixture();
  fixture = fresh;
  // Each test owns its user, membership, enrollment, company,
  // application, screening, assessment round and notification rows.
  await seedLearnerPositiveFixture(pool, fresh);
}, 45_000);

afterEach(async () => {
  if (!fixture) return;
  const current = fixture;
  fixture = null;
  // The mutation's audit event is a real actor-linked FK row; remove it
  // before deleting the test-owned application and membership.
  try {
    const withdrawalKey = "placement-application:" + current.ids.application + ":withdrawn";
    // Withdrawals generate in-app notifications linked to their audit event.
    // Delete only this fixture's notification before the referenced event.
    await pool.query(
      "DELETE FROM in_app_notifications WHERE event_id IN (SELECT id FROM activity_events WHERE dedupe_key=$1)",
      [withdrawalKey],
    );
    await pool.query("DELETE FROM activity_events WHERE dedupe_key=$1", [withdrawalKey]);
    await cleanupLearnerPositiveFixture(pool, current);
  } finally {
    // No shared users, organizations or seeded parent program are deleted.
  }
}, 45_000);

afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
}, 30_000);

describe("Learner application withdrawal on fresh PostgreSQL fixtures", () => {
  function owned() {
    if (!fixture) throw new Error("Positive fixture was not prepared");
    return fixture;
  }

  it("withdraws its own submitted application and atomically records reason + audit exactly once", async () => {
    const { context, ids } = owned();
    // The shared positive fixture starts SHORTLISTED for the interview tests.
    // This test exercises the pre-screening self-withdrawal stage instead;
    // a published job round alone is not a candidate-specific booking.
    await pool.query(
      "UPDATE placement_application_screenings SET status='PENDING',decided_at=NULL,decided_by_user_id=NULL WHERE application_id=$1",
      [ids.application],
    );
    const first = await withdrawPlacementApplication(context, ids.application, reason);
    expect(first).toMatchObject({ id: ids.application, status: "WITHDRAWN" });
    expect(first.withdrawnAt).not.toBeNull();

    const app = await pool.query<{status:string;withdrawn_at:Date|null}>(
      "SELECT status,withdrawn_at FROM placement_applications WHERE id=$1", [ids.application],
    );
    expect(app.rows[0]?.status).toBe("WITHDRAWN");
    expect(app.rows[0]?.withdrawn_at).not.toBeNull();

    const history = await pool.query<{
      from_status:string|null;to_status:string;reason:string|null;actor_user_id:string;
    }>(
      `SELECT from_status,to_status,reason,actor_user_id
       FROM placement_application_status_history WHERE application_id=$1`,
      [ids.application],
    );
    expect(history.rows).toEqual([{
      from_status:"SUBMITTED",to_status:"WITHDRAWN",
      reason,actor_user_id:ids.user,
    }]);

    const audit = await pool.query<{
      event_type:string;actor_user_id:string;actor_membership_id:string|null;
      college_id:string|null;metadata:Record<string,unknown>;
    }>(
      `SELECT event_type,actor_user_id,actor_membership_id,college_id,metadata
       FROM activity_events WHERE dedupe_key=$1`,
      ["placement-application:" + ids.application + ":withdrawn"],
    );
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0]).toMatchObject({
      event_type:"placements.application.withdrawn",
      actor_user_id:ids.user,
      actor_membership_id:ids.membership,
      college_id:SEED_IDS.collegeA,
    });
    expect(audit.rows[0]?.metadata.reasonProvided).toBe(true);
    expect(JSON.stringify(audit.rows[0]?.metadata)).not.toContain(reason);

    const read = await getOwnLearnerApplicationHistory(context, ids.application);
    expect(read?.currentStatus).toBe("WITHDRAWN");
    expect(read?.events.some(event => event.toStatus === "WITHDRAWN")).toBe(true);

    const repeat = await withdrawPlacementApplication(context, ids.application, "A second reason should not overwrite history");
    expect(repeat.status).toBe("WITHDRAWN");
    expect(repeat.withdrawnAt?.getTime()).toBe(first.withdrawnAt?.getTime());
    const [eventCount, historyCount] = await Promise.all([
      pool.query<{total:string}>("SELECT count(*)::text AS total FROM activity_events WHERE dedupe_key=$1", [
        "placement-application:" + ids.application + ":withdrawn",
      ]),
      pool.query<{total:string}>(`SELECT count(*)::text AS total FROM placement_application_status_history
        WHERE application_id=$1 AND to_status='WITHDRAWN'`, [ids.application]),
    ]);
    expect(eventCount.rows[0]?.total).toBe("1");
    expect(historyCount.rows[0]?.total).toBe("1");
  }, 30_000);

  it("requires placement-cell review once the learner is shortlisted, even before candidate booking", async () => {
    const {context,ids}=owned();
    // Fixture screening is SHORTLISTED but it has no booked candidate slot;
    // don't let that historical stage be erased by self withdrawal.
    await expect(withdrawPlacementApplication(context,ids.application,reason))
      .rejects.toMatchObject({code:"PLACEMENT_APPLICATION_INELIGIBLE"});
    const application=await pool.query<{status:string;withdrawn_at:Date|null}>(
      "SELECT status,withdrawn_at FROM placement_applications WHERE id=$1",[ids.application]);
    expect(application.rows[0]).toMatchObject({status:"SUBMITTED",withdrawn_at:null});
    const audit=await pool.query<{n:string}>(
      "SELECT count(*)::text AS n FROM placement_application_status_history WHERE application_id=$1",[ids.application]);
    expect(audit.rows[0]?.n).toBe("0");
  });

  it("denies forged college, suspended membership and wrong-role contexts without DB mutation", async () => {
    const { context, ids } = owned();
    const forged: RequestContext = {
      ...context,
      membership: { ...context.membership!, collegeId: SEED_IDS.collegeB },
    };
    const suspended: RequestContext = {
      ...context,
      membership: { ...context.membership!, status: "SUSPENDED" },
    };
    const wrongRole: RequestContext = {
      ...context,
      membership: { ...context.membership!, roles: ["FACULTY"] },
    };
    for (const invalid of [forged, suspended, wrongRole]) {
      await expect(withdrawPlacementApplication(invalid, ids.application, reason))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
    const app = await pool.query<{status:string;withdrawn_at:Date|null}>(
      "SELECT status,withdrawn_at FROM placement_applications WHERE id=$1",
      [ids.application],
    );
    expect(app.rows[0]).toMatchObject({ status:"SUBMITTED", withdrawn_at:null });
    const events = await pool.query<{total:string}>(
      "SELECT count(*)::text AS total FROM placement_application_status_history WHERE application_id=$1",
      [ids.application],
    );
    expect(events.rows[0]?.total).toBe("0");
  }, 30_000);

  it("rejects malformed IDs and invalid reason before any write", async () => {
    const { context, ids } = owned();
    await expect(withdrawPlacementApplication(context, "../../other", reason)).rejects.toBeDefined();
    await expect(withdrawPlacementApplication(context, ids.application, " ")).rejects.toBeDefined();
    await expect(withdrawPlacementApplication(context, ids.application, "z".repeat(501))).rejects.toBeDefined();
    const result = await pool.query<{status:string}>(
      "SELECT status FROM placement_applications WHERE id=$1", [ids.application],
    );
    expect(result.rows[0]?.status).toBe("SUBMITTED");
  });
});
