// DB-004 Chat 2. Stage-only disposable PostgreSQL proof, not registered
// Drizzle migration replay or tenant auth/browser/provider acceptance.
// Requires explicitly disposable PostgreSQL with CREATE SCHEMA rights.
// DB01_DOMAIN_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA \
// TEST_DATABASE_URL=postgres://... node --test tests/db01-domain-tombstone-state-pg.test.mjs
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(resolve(root, p), "utf8");
const tombstoneDDL = read("docs/planning/sql/db01-tenant-domain-tombstone-staging.sql");
const guardDDL = read("docs/planning/sql/db01-domain-tombstone-state-guard-staging.sql");
const optIn = process.env.DB01_DOMAIN_DISPOSABLE === "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  (!process.env.DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL);

if (!optIn) {
  test.skip("DB01 tombstone PG witness requires separate, explicitly disposable TEST_DATABASE_URL", () => {});
} else {
  test("DB01 archived host cannot rearm or leak historical DNS proof under concurrent verification", { timeout: 65000 }, async () => {
    const { default: pg } = await import("pg");
    const config = { connectionString: process.env.TEST_DATABASE_URL, application_name: "db01-domain-disposable" };
    const admin = new pg.Client(config), actorA = new pg.Client(config), actorB = new pg.Client(config);
    const clients = [admin, actorA, actorB];
    const name = "db01_domain_" + randomUUID().replaceAll("-", "").slice(0, 20);
    const schema = '"' + name + '"';
    let created = false;
    const college = randomUUID(), anotherCollege = randomUUID(), actor = randomUUID();
    async function expect23514(promise, expected) {
      await assert.rejects(promise, e => {
        assert.equal(e.code, "23514", String(e));
        assert.equal(e.constraint, expected);
        return true;
      });
    }
    async function createDomain({ host = randomUUID() + ".example.test", verified = false, primary = false } = {}) {
      const id = randomUUID();
      await admin.query(
        `INSERT INTO tenant_domains
          (id,college_id,host,is_primary,is_verified,verification_token,verified_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, college, host, primary, verified, verified ? null : "proof_" + randomUUID(), verified ? new Date() : null],
      );
      return id;
    }
    async function observeLock(pid) {
      for (let i = 0; i < 120; i++) {
        const { rows } = await admin.query("SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1", [pid]);
        if (rows[0]?.wait_event_type === "Lock") return;
        await new Promise(r => setTimeout(r, 25));
      }
      assert.fail("expected real PostgreSQL row-lock wait was not observed");
    }
    const deletion = "UPDATE tenant_domains SET deleted_at=clock_timestamp(), is_primary=false, verification_token=NULL, deleted_by_user_id=$2 WHERE id=$1";
    try {
      for (const client of clients) await client.connect();
      await admin.query("CREATE SCHEMA " + schema);
      created = true;
      for (const client of clients) await client.query("SET search_path TO " + schema + ", pg_catalog");
      await admin.query("CREATE TABLE users (id uuid PRIMARY KEY)");
      await admin.query("CREATE TABLE colleges (id uuid PRIMARY KEY)");
      await admin.query(`CREATE TABLE tenant_domains (
        id uuid PRIMARY KEY, college_id uuid NOT NULL REFERENCES colleges(id),
        host varchar(255) NOT NULL, is_primary boolean NOT NULL DEFAULT false,
        is_verified boolean NOT NULL DEFAULT false, verification_token varchar(255),
        verified_at timestamptz, last_checked_at timestamptz, last_check_result text,
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        CONSTRAINT tenant_domains_primary_verified_ck CHECK (NOT is_primary OR is_verified)
      )`);
      await admin.query("CREATE UNIQUE INDEX tenant_domains_host_uq ON tenant_domains (lower(host))");
      await admin.query("INSERT INTO users VALUES ($1)", [actor]);
      await admin.query("INSERT INTO colleges VALUES ($1), ($2)", [college, anotherCollege]);
      await admin.query(tombstoneDDL);
      await admin.query(guardDDL);

      const active = await createDomain({ verified: true, primary: true });
      await expect23514(
        admin.query("UPDATE tenant_domains SET college_id=$2 WHERE id=$1", [active, anotherCollege]),
        "db01_domain_college_immutable_ck",
      );
      await expect23514(
        admin.query("UPDATE tenant_domains SET host=$2 WHERE id=$1", [active, "unverified-new.example.test"]),
        "db01_domain_host_change_proof_reset_ck",
      );
      const changedHost = "new-proof-" + randomUUID() + ".example.test";
      await admin.query(`UPDATE tenant_domains SET host=$2,
        is_verified=false,is_primary=false,verified_at=NULL,last_checked_at=NULL,
        last_check_result=NULL,verification_token=$3 WHERE id=$1`,
        [active, changedHost, "new_token_" + randomUUID()],
      );
      const reset = (await admin.query("SELECT is_verified,is_primary,verified_at,verification_token FROM tenant_domains WHERE id=$1", [active])).rows[0];
      assert.equal(reset.is_verified, false);
      assert.equal(reset.is_primary, false);
      assert.equal(reset.verified_at, null);
      assert.ok(reset.verification_token);
      await expect23514(
        admin.query("UPDATE tenant_domains SET deleted_at=clock_timestamp(),is_primary=false WHERE id=$1", [active]),
        "db01_domain_tombstone_history_ck",
      );
      await expect23514(
        admin.query("DELETE FROM tenant_domains WHERE id=$1", [active]),
        "db01_domain_hard_delete_forbidden_ck",
      );
      await admin.query(deletion, [active, actor]);
      const tombstoned = (await admin.query("SELECT host,deleted_at,deleted_by_user_id,is_primary,verification_token FROM tenant_domains WHERE id=$1", [active])).rows[0];
      assert.equal(tombstoned.host, changedHost);
      assert.ok(tombstoned.deleted_at);
      assert.equal(tombstoned.deleted_by_user_id, actor);
      assert.equal(tombstoned.is_primary, false);
      assert.equal(tombstoned.verification_token, null);
      await expect23514(
        admin.query("UPDATE tenant_domains SET deleted_at=NULL WHERE id=$1", [active]),
        "db01_domain_tombstone_terminal_ck",
      );
      await expect23514(
        admin.query("UPDATE tenant_domains SET is_verified=true WHERE id=$1", [active]),
        "db01_domain_tombstone_terminal_ck",
      );

      // DELETE-first: stale verifier cannot write after the deletion commits.
      const deleteWins = await createDomain();
      await actorA.query("BEGIN");
      await actorA.query(deletion, [deleteWins, actor]);
      await actorB.query("BEGIN");
      const pidB = (await actorB.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
      const staleVerify = actorB.query(
        "UPDATE tenant_domains SET is_verified=true,verified_at=clock_timestamp(),verification_token=NULL WHERE id=$1",
        [deleteWins],
      );
      await observeLock(pidB);
      await actorA.query("COMMIT");
      await expect23514(staleVerify, "db01_domain_tombstone_terminal_ck");
      await actorB.query("ROLLBACK");

      // Verify-first: deletion waits, then retains the successful historical
      // verification evidence while stopping routing and clearing secrets.
      const verifyWins = await createDomain();
      await actorA.query("BEGIN");
      await actorA.query(
        "UPDATE tenant_domains SET is_verified=true,verified_at=clock_timestamp(),verification_token=NULL WHERE id=$1",
        [verifyWins],
      );
      await actorB.query("BEGIN");
      const secondPid = (await actorB.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
      const pendingTombstone = actorB.query(deletion, [verifyWins, actor]);
      await observeLock(secondPid);
      await actorA.query("COMMIT");
      const completedDelete = await pendingTombstone;
      assert.equal(completedDelete.rowCount, 1);
      await actorB.query("COMMIT");
      const final = (await admin.query("SELECT is_verified,verified_at,is_primary,deleted_at FROM tenant_domains WHERE id=$1", [verifyWins])).rows[0];
      assert.equal(final.is_verified, true);
      assert.ok(final.verified_at);
      assert.equal(final.is_primary, false);
      assert.ok(final.deleted_at);

      // Existing global uniqueness still denies stealing a tombstoned host.
      await assert.rejects(
        admin.query(`INSERT INTO tenant_domains (college_id,host) VALUES ($1,$2)`,
          [anotherCollege, changedHost.toUpperCase()]),
        error => error.code === "23505" && error.constraint === "tenant_domains_host_uq",
      );
    } finally {
      for (const client of [actorA, actorB]) {
        try { await client.query("ROLLBACK"); } catch {}
      }
      if (created) {
        try {
          await admin.query("SET search_path TO pg_catalog");
          await admin.query("DROP SCHEMA " + schema + " CASCADE");
        } catch (error) {
          throw new Error("Disposable DB01 domain fixture cleanup failed", { cause: error });
        }
      }
      await Promise.all(clients.map(c => c.end().catch(() => {})));
    }
  });
}
