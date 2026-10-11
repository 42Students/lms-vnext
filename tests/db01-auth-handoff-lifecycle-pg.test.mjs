// DB-004 / Chat 2 — actual PostgreSQL witness for STAGED handoff lifecycle.
// This is NOT a registered Drizzle migration, full tenant FKs, or provider proof.
// To opt in against an independently disposable DB only:
// DB01_HANDOFF_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA TEST_DATABASE_URL=... \
//   node --test tests/db01-auth-handoff-lifecycle-pg.test.mjs
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(resolve(root, p), "utf8");
const ddl = read("docs/planning/sql/db01-auth-handoffs-staging.sql")
  .split("-- Intended atomic consume")[0];
const guard = read("docs/planning/sql/db01-auth-handoff-lifecycle-guard-staging.sql");
const optIn =
  process.env.DB01_HANDOFF_DISPOSABLE === "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  (!process.env.DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL);

if (!optIn) {
  test.skip("DB01 handoff requires an explicitly disposable TEST_DATABASE_URL distinct from DATABASE_URL", () => {});
} else {
  test("DB01 one-time handoff is immutable, scoped, deadline-bounded and race-safe", { timeout: 65000 }, async () => {
    const { default: pg } = await import("pg");
    const config = { connectionString: process.env.TEST_DATABASE_URL, application_name: "db01-handoff-disposable" };
    const admin = new pg.Client(config);
    const writerA = new pg.Client(config);
    const writerB = new pg.Client(config);
    const clients = [admin, writerA, writerB];
    const schema = "db01_handoff_" + randomUUID().replaceAll("-", "").slice(0, 20);
    const quoted = '"' + schema + '"';
    const userId = randomUUID(), collegeId = randomUUID(), membershipId = randomUUID(), domainId = randomUUID();
    const host = "handoff.example.test";
    let created = false;

    async function expect23514(promise, constraint) {
      await assert.rejects(promise, error => {
        assert.equal(error.code, "23514", String(error));
        assert.equal(error.constraint, constraint);
        return true;
      });
    }
    async function issue({ lifetimeSeconds = 90, createdAgoSeconds = 0 } = {}) {
      const id = randomUUID();
      await admin.query(
        `INSERT INTO identity_auth_handoffs
          (id,user_id,college_id,target_membership_id,target_domain_id,target_host,
           code_mac,created_at,expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,
           clock_timestamp() - ($8::int * interval '1 second'),
           clock_timestamp() - ($8::int * interval '1 second') + ($9::int * interval '1 second'))`,
        [id,userId,collegeId,membershipId,domainId,host,randomUUID().replaceAll("-", "").padEnd(64, "a"),createdAgoSeconds,lifetimeSeconds],
      );
      return id;
    }
    async function observeLock(pid) {
      for (let i = 0; i < 160; i++) {
        const { rows } = await admin.query("SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1", [pid]);
        if (rows[0]?.wait_event_type === "Lock") return;
        await new Promise(r => setTimeout(r, 25));
      }
      assert.fail("the contending PostgreSQL session did not observe the expected row-lock wait");
    }
    const delay = ms => new Promise(r => setTimeout(r, ms));
    try {
      for (const client of clients) await client.connect();
      await admin.query("CREATE SCHEMA " + quoted);
      created = true;
      for (const client of clients) await client.query("SET search_path TO " + quoted + ", pg_catalog");
      await admin.query("CREATE TABLE users (id uuid PRIMARY KEY)");
      await admin.query("CREATE TABLE colleges (id uuid PRIMARY KEY)");
      await admin.query("CREATE TABLE college_memberships (id uuid PRIMARY KEY)");
      await admin.query("CREATE TABLE tenant_domains (id uuid PRIMARY KEY)");
      await admin.query("INSERT INTO users VALUES ($1)", [userId]);
      await admin.query("INSERT INTO colleges VALUES ($1)", [collegeId]);
      await admin.query("INSERT INTO college_memberships VALUES ($1)", [membershipId]);
      await admin.query("INSERT INTO tenant_domains VALUES ($1)", [domainId]);
      await admin.query(ddl);
      await admin.query(guard);

      await expect23514(issue({ lifetimeSeconds: 150 }), "identity_auth_handoffs_lifetime_ck");
      const id = await issue();
      for (const [column, value] of [
        ["user_id", randomUUID()], ["college_id", randomUUID()],
        ["target_membership_id", randomUUID()], ["target_domain_id", randomUUID()],
        ["target_host", "attacker.example.test"], ["code_mac", "f".repeat(64)],
      ]) {
        await expect23514(
          admin.query(`UPDATE identity_auth_handoffs SET ${column}=$1 WHERE id=$2`, [value,id]),
          "db01_auth_handoff_scope_immutable_ck",
        );
      }
      await expect23514(
        admin.query("UPDATE identity_auth_handoffs SET expires_at=expires_at+interval '1 second' WHERE id=$1", [id]),
        "db01_auth_handoff_expiry_monotonic_ck",
      );
      const consumed = await admin.query(
        "UPDATE identity_auth_handoffs SET consumed_at=clock_timestamp() WHERE id=$1 AND consumed_at IS NULL AND expires_at > clock_timestamp() RETURNING id",
        [id],
      );
      assert.equal(consumed.rowCount, 1);
      await expect23514(
        admin.query("UPDATE identity_auth_handoffs SET consumed_at=NULL WHERE id=$1", [id]),
        "db01_auth_handoff_consumed_immutable_ck",
      );
      await expect23514(
        admin.query("UPDATE identity_auth_handoffs SET target_host=target_host WHERE id=$1", [id]),
        "db01_auth_handoff_consumed_immutable_ck",
      );

      // The row's initial timestamps pass the CHECK, but it is already expired
      // when a direct SQL caller supplies an old consumed_at timestamp.
      const expired = await issue({ createdAgoSeconds: 119, lifetimeSeconds: 90 });
      await expect23514(
        admin.query("UPDATE identity_auth_handoffs SET consumed_at=created_at+interval '1 second' WHERE id=$1", [expired]),
        "db01_auth_handoff_expired_consume_ck",
      );

      // Two concurrent consumers: exactly one wins even at READ COMMITTED.
      const race = await issue();
      const reservation = "UPDATE identity_auth_handoffs SET consumed_at=clock_timestamp() WHERE id=$1 AND consumed_at IS NULL AND expires_at > clock_timestamp() RETURNING id";
      await writerA.query("BEGIN");
      const first = await writerA.query(reservation, [race]);
      assert.equal(first.rowCount, 1);
      await writerB.query("BEGIN");
      const pid = (await writerB.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
      const contender = writerB.query(reservation, [race]);
      await observeLock(pid);
      await writerA.query("COMMIT");
      const second = await contender;
      assert.equal(second.rowCount, 0, "already-consumed code cannot be replayed");
      await writerB.query("COMMIT");

      // Expiry must be rechecked after lock acquisition. A transaction that
      // started before expiry is not allowed to consume after the deadline.
      const nearlyExpired = await issue({ lifetimeSeconds: 1 });
      await writerA.query("BEGIN");
      await writerA.query("SELECT id FROM identity_auth_handoffs WHERE id=$1 FOR UPDATE", [nearlyExpired]);
      await writerB.query("BEGIN");
      const pid2 = (await writerB.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
      const expiredContender = writerB.query(
        "UPDATE identity_auth_handoffs SET consumed_at=created_at+interval '0.1 seconds' WHERE id=$1",
        [nearlyExpired],
      );
      await observeLock(pid2);
      await delay(1600);
      await writerA.query("COMMIT");
      await expect23514(expiredContender, "db01_auth_handoff_expired_consume_ck");
      await writerB.query("ROLLBACK");
    } finally {
      for (const client of [writerA, writerB]) {
        try { await client.query("ROLLBACK"); } catch {}
      }
      if (created) {
        try {
          await admin.query("SET search_path TO pg_catalog");
          await admin.query("DROP SCHEMA " + quoted + " CASCADE");
        } catch (error) {
          throw new Error("DB01 disposable handoff fixture cleanup failed", { cause: error });
        }
      }
      await Promise.all(clients.map(client => client.end().catch(() => {})));
    }
  });
}
