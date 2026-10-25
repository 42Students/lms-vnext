import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  listKnownErrorsForAdmin,
  markLogAlertsViewed,
  mutateKnownErrorForAdmin,
  readLogAlertAdminState,
} from "@/modules/log-alerts/admin-service";

// These tests INSERT and DELETE log-alert rows. The service also uses
// DATABASE_URL, so both must refer to the same explicitly disposable target.
// Never fall back from TEST_DATABASE_URL to an application database.
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl ||
    process.env.DB10_DISPOSABLE_TEST_DATABASE !== "true" ||
    process.env.DATABASE_URL !== databaseUrl) {
  throw new Error(
    "W06 log-alert integration requires explicit matching TEST_DATABASE_URL and DATABASE_URL plus DB10_DISPOSABLE_TEST_DATABASE=true.",
  );
}
// The independent verifier isolation flag is required as well as the DB10
// opt-in. The shared guard rejects production names, redirected URLs,
// unconfirmed remote targets and service/test URL mismatches before Pool.
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: databaseUrl, max: 2 });
const id = crypto.randomUUID();
const signatureHash = crypto.randomUUID().replaceAll("-", "").padEnd(64, "a");
const stateKey = "PRODUCTION_ERROR_POLL";
const admin: RequestContext = {
  user: {
    id: "30000000-0000-4000-8000-000000000001",
    identityUid: "seed-sa",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
  adminScope: { organizationId: null, collegeId: null },
};
const scoped = {
  ...admin,
  adminScope: {
    organizationId: "10000000-0000-4000-8000-000000000001",
    collegeId: null,
  },
};

beforeAll(async () => {
  const preexisting = await pool.query(
    "select 1 from log_alert_states where state_key = $1", [stateKey],
  );
  if (preexisting.rowCount) {
    throw new Error("Not an empty disposable log-alert state; refusing to alter it.");
  }
  await pool.query(`
    insert into log_alert_signatures
      (id, environment, signature_hash, first_seen_at, last_seen_at, occurrence_count)
    values ($1, 'UAT', $2, now() - interval '1 hour', now(), 41)
  `, [id, signatureHash]);
});
afterAll(async () => {
  await pool.query("delete from log_alert_signature_accounts where signature_id = $1", [id]);
  await pool.query("delete from log_alert_signatures where id = $1", [id]);
  await pool.query("delete from log_alert_states where state_key = $1", [stateKey]);
  await pool.end();
  await closeDatabaseConnection();
});

describe("W06 Known Errors admin persistence and privacy", () => {
  it("rejects a scoped super admin from globally scoped raw log aggregates", async () => {
    await expect(listKnownErrorsForAdmin(scoped, {
      environment: "UAT", limit: 10,
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lists only safe projections and stringifies the bigint counter", async () => {
    const rows = await listKnownErrorsForAdmin(admin, {
      environment: "UAT", limit: 50,
    });
    const row = rows.find(item => item.id === id);
    expect(row?.occurrenceCount).toBe("41");
    // An absent account marker is unknown impact, not proven zero impact.
    expect(row?.affectedAccounts).toBeNull();
    expect(row).not.toHaveProperty("sampleMessage");
    expect(row).not.toHaveProperty("accountKeyHash");
  });

  it("persists status and mute without losing concurrent occurrence history", async () => {
    await mutateKnownErrorForAdmin(admin, id, {
      action: "STATUS", status: "FIXED", commit: "abcdef1234567",
    });
    await mutateKnownErrorForAdmin(admin, id, {
      action: "STATUS", status: "EXPECTED", note: "Known dependency",
    });
    await mutateKnownErrorForAdmin(admin, id, {
      action: "LINK_ISSUE", issuePublicId: "BT-500",
    });
    const [row] = (await pool.query(
      "select occurrence_count, fix_status, muted, issue_public_id from log_alert_signatures where id = $1",
      [id],
    )).rows;
    expect(String(row.occurrence_count)).toBe("41");
    expect(row).toMatchObject({
      fix_status: "EXPECTED", muted: true, issue_public_id: "BT-500",
    });
  });

  it("updates last viewed independently of scheduler poll cursor", async () => {
    const pollTime = new Date("2026-10-11T02:00:00.000Z");
    await pool.query(
      "insert into log_alert_states (state_key, poll_cursor_at) values ($1, $2)",
      [stateKey, pollTime],
    );
    const viewed = await markLogAlertsViewed(admin);
    expect(viewed).toBeInstanceOf(Date);
    const result = await readLogAlertAdminState(admin);
    expect(result.pollCursorAt?.toISOString()).toBe(pollTime.toISOString());
    expect(result.adminLastViewedAt).not.toBeNull();
  });
});
