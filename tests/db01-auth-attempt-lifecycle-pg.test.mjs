// DB-004: disposable PostgreSQL acceptance for the STAGED OTP lifecycle.
// Not a numbered Drizzle migration/full-service auth proof.
// Without explicit opt-in this test SKIPS (never reports DB proof).
//
// DB01_AUTH_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA \
// TEST_DATABASE_URL=postgres://... node --test tests/db01-auth-attempt-lifecycle-pg.test.mjs
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(resolve(root, p), "utf8");
const tableDDL = read("docs/planning/sql/db01-auth-attempts-staging.sql");
const guardDDL = read("docs/planning/sql/db01-auth-attempt-lifecycle-guard-staging.sql");
const optIn =
  process.env.DB01_AUTH_DISPOSABLE === "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  (!process.env.DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL);

if (!optIn) {
  test.skip("DB01 OTP state transition witness requires separate explicitly disposable TEST_DATABASE_URL", () => {});
} else {
  test("DB01 OTP attempt lifecycle direct SQL, replay and concurrent retry budget", { timeout: 60000 }, async () => {
    const { default: pg } = await import("pg");
    const schema = "db01_otp_" + randomUUID().replaceAll("-", "").slice(0, 20);
    const quoted = '"' + schema + '"';
    const config = { connectionString: process.env.TEST_DATABASE_URL, application_name: "db01-otp-disposable" };
    const admin = new pg.Client(config);
    const actorA = new pg.Client(config);
    const actorB = new pg.Client(config);
    const clients = [admin, actorA, actorB];
    let created = false;
    let userId, collegeId, membershipId;

    const update = (sql, args) => admin.query(sql, args);
    async function expect23514(promise, constraint) {
      await assert.rejects(promise, err => {
        assert.equal(err.code, "23514", String(err));
        assert.equal(err.constraint, constraint);
        return true;
      });
    }
    async function createAttempt({ sms = true, email = false, minutes = 4, role = "LEARNER" } = {}) {
      const id = randomUUID();
      const smsMac = sms ? "a".repeat(64) : null;
      const emailMac = email ? "b".repeat(64) : null;
      await update(
        "INSERT INTO identity_auth_attempts (id,user_id,college_id,membership_id,target_role,contact_fingerprint,sms_code_mac,sms_code_expires_at,email_code_mac,email_code_expires_at,expires_at) " +
        "VALUES ($1,$2,$3,$4,$5,$6,$7,CASE WHEN $7::text IS NULL THEN NULL ELSE now() + interval '3 minutes' END,$8,CASE WHEN $8::text IS NULL THEN NULL ELSE now()+interval '3 minutes' END,now()+($9::int * interval '1 minute'))",
        [id, userId, collegeId, membershipId, role, "c".repeat(64), smsMac, emailMac, minutes]);
      return id;
    }
    async function observeLock(pid) {
      for (let i = 0; i < 120; i++) {
        const { rows } = await admin.query(
          "SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1", [pid]);
        if (rows[0]?.wait_event_type === "Lock") return;
        await new Promise(r => setTimeout(r, 25));
      }
      assert.fail("second session did not exhibit PostgreSQL lock wait");
    }
    try {
      for (const client of clients) await client.connect();
      await admin.query("CREATE SCHEMA " + quoted);
      created = true;
      for (const client of clients) await client.query("SET search_path TO " + quoted + ", pg_catalog");
      await admin.query("CREATE TABLE users (id uuid PRIMARY KEY)");
      await admin.query("CREATE TABLE colleges (id uuid PRIMARY KEY)");
      await admin.query("CREATE TABLE college_memberships (id uuid PRIMARY KEY)");
      userId = randomUUID();
      collegeId = randomUUID();
      membershipId = randomUUID();
      await admin.query("INSERT INTO users VALUES ($1)", [userId]);
      await admin.query("INSERT INTO colleges VALUES ($1)", [collegeId]);
      await admin.query("INSERT INTO college_memberships VALUES ($1)", [membershipId]);
      await admin.query(tableDDL);
      await admin.query(guardDDL);

      await expect23514(createAttempt({minutes: 6}), "identity_auth_attempts_five_minute_expiry_ck");
      await expect23514(createAttempt({role: "   "}), "identity_auth_attempts_target_role_shape_ck");

      const id = await createAttempt();
      await expect23514(update("UPDATE identity_auth_attempts SET user_id=$1,version=version+1 WHERE id=$2", [randomUUID(), id]), "db01_auth_attempt_scope_immutable_ck");
      await expect23514(update("UPDATE identity_auth_attempts SET expires_at=expires_at+interval '1 minute',version=version+1 WHERE id=$1", [id]), "db01_auth_attempt_expiry_monotonic_ck");
      await expect23514(update("UPDATE identity_auth_attempts SET verification_attempts=2,version=version+1 WHERE id=$1", [id]), "db01_auth_attempt_counters_monotonic_ck");
      await expect23514(update("UPDATE identity_auth_attempts SET verification_attempts=1 WHERE id=$1", [id]), "db01_auth_attempt_version_step_ck");
      await expect23514(update("UPDATE identity_auth_attempts SET used_at=now(),version=version+1 WHERE id=$1", [id]), "identity_auth_attempts_consumed_shape_ck");

      // Valid atomic consumption clears secrets and dates in one UPDATE.
      await update(
        "UPDATE identity_auth_attempts SET verification_attempts=verification_attempts+1,version=version+1,verified_at=now(),used_at=now(),sms_code_mac=NULL,sms_code_expires_at=NULL WHERE id=$1",
        [id]);
      let { rows } = await update(
        "SELECT verified_at,used_at,sms_code_mac,verification_attempts FROM identity_auth_attempts WHERE id=$1", [id]);
      assert.ok(rows[0].verified_at && rows[0].used_at);
      assert.equal(rows[0].sms_code_mac, null);
      assert.equal(rows[0].verification_attempts, 1);
      await expect23514(update("UPDATE identity_auth_attempts SET used_at=NULL,version=version+1 WHERE id=$1", [id]), "db01_auth_attempt_terminal_monotonic_ck");
      await expect23514(update("UPDATE identity_auth_attempts SET verification_attempts=0,version=version+1 WHERE id=$1", [id]), "db01_auth_attempt_counters_monotonic_ck");

      const emailOnly = await createAttempt({ sms: false, email: true });
      await update(
        "UPDATE identity_auth_attempts SET verification_attempts=verification_attempts+1,verified_at=now(),version=version+1 WHERE id=$1",
        [emailOnly]);
      await expect23514(
        update("UPDATE identity_auth_attempts SET email_code_mac=$1,version=version+1 WHERE id=$2", ["d".repeat(64), emailOnly]),
        "db01_auth_attempt_verified_mac_immutable_ck");
      await update("UPDATE identity_auth_attempts SET used_at=now(),email_code_mac=NULL,email_code_expires_at=NULL,version=version+1 WHERE id=$1", [emailOnly]);
      await expect23514(update("UPDATE identity_auth_attempts SET resend_attempts=1,version=version+1 WHERE id=$1", [emailOnly]), "db01_auth_attempt_consumed_immutable_ck");
      await expect23514(update("UPDATE identity_auth_attempts SET version=version+1 WHERE id=$1", [emailOnly]), "db01_auth_attempt_consumed_immutable_ck");

      const raceId = await createAttempt();
      // Reach the penultimate slot using four legal one-step reservations.
      for (let i = 0; i < 4; i++) {
        await update("UPDATE identity_auth_attempts SET verification_attempts=verification_attempts+1,version=version+1 WHERE id=$1", [raceId]);
      }
      await actorA.query("BEGIN");
      const reservation = "UPDATE identity_auth_attempts SET verification_attempts=verification_attempts+1,version=version+1 WHERE id=$1 AND used_at IS NULL AND expires_at > now() AND verification_attempts < 5 RETURNING verification_attempts";
      const first = await actorA.query(reservation, [raceId]);
      assert.equal(first.rows[0].verification_attempts, 5);
      await actorB.query("BEGIN");
      const secondPid = (await actorB.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
      const contender = actorB.query(reservation, [raceId]);
      await observeLock(secondPid);
      await actorA.query("COMMIT");
      const second = await contender;
      assert.equal(second.rowCount, 0, "no sixth reservation under READ COMMITTED");
      await actorB.query("COMMIT");
      rows = (await update("SELECT verification_attempts FROM identity_auth_attempts WHERE id=$1", [raceId])).rows;
      assert.equal(rows[0].verification_attempts, 5);
    } finally {
      for (const client of [actorA, actorB]) { try { await client.query("ROLLBACK"); } catch {} }
      if (created) {
        try {
          await admin.query("SET search_path TO pg_catalog");
          await admin.query("DROP SCHEMA " + quoted + " CASCADE");
        } catch (error) {
          throw new Error("Disposable DB01 auth fixture failed to clean up", { cause: error });
        }
      }
      await Promise.all(clients.map(c => c.end().catch(() => {})));
    }
  });
}
