// DB-004 executable disposable PostgreSQL witness for the UNREGISTERED DB01
// college membership / tenant domain archive guard. This is not a real
// migration replay, nor proof of integration with every other DB domain.
//
// Run ONLY against a disposable PostgreSQL database (never production):
// DB01_RACE_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA \
// TEST_DATABASE_URL=postgres://... node --test tests/db01-college-membership-domain-archive-pg.test.mjs
//
// Creates an isolated randomly named schema and drops only that schema.
// Without the explicit opt-in, the test is skipped, not counted as passed.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stage = readFileSync(resolve(root,
  "docs/planning/sql/db01-college-membership-domain-archive-guard-staging.sql"), "utf8");
const allowed =
  process.env.DB01_RACE_DISPOSABLE === "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  (!process.env.DATABASE_URL ||
   process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL);

if (!allowed) {
  test.skip("DB01 archive races need explicitly opted-in disposable TEST_DATABASE_URL", () => {});
} else {
  test("DB01 membership/domain lifecycle direct SQL and two-session races", { timeout: 60000 }, async () => {
    const { default: pg } = await import("pg");
    const name = "db01_race_" + randomUUID().replaceAll("-", "").slice(0, 20);
    const ident = '"' + name + '"';
    const opts = { connectionString: process.env.TEST_DATABASE_URL, application_name: "db01-disposable-race" };
    const admin = new pg.Client(opts);
    const child = new pg.Client(opts);
    const parent = new pg.Client(opts);
    let created = false;

    async function createCollege(status = "ACTIVE") {
      const id = randomUUID();
      await admin.query("INSERT INTO colleges (id, status) VALUES ($1, $2)", [id, status]);
      return id;
    }
    async function insertChild(kind, collegeId, client = admin, status = "ACTIVE") {
      const id = randomUUID();
      if (kind === "membership") {
        await client.query(
          "INSERT INTO college_memberships (id, user_id, college_id, status) VALUES ($1,$2,$3,$4)",
          [id, randomUUID(), collegeId, status]);
      } else {
        await client.query("INSERT INTO tenant_domains (id, college_id) VALUES ($1,$2)", [id, collegeId]);
      }
      return id;
    }
    function settled(promise) {
      return promise.then(value => ({ ok: true, value }), error => ({ ok: false, error }));
    }
    async function expectConstraint(result, constraint) {
      assert.equal(result.ok, false, "expected a rejected conflicting database write");
      assert.equal(result.error.code, "23514", String(result.error));
      assert.equal(result.error.constraint, constraint);
    }
    async function awaitLock(pid) {
      // Reject a simulated serial schedule. The other connection MUST be
      // observed blocked on a live PostgreSQL lock before we release it.
      for (let i = 0; i < 120; i++) {
        const { rows } = await admin.query(
          "SELECT wait_event_type FROM pg_stat_activity WHERE pid = $1", [pid]);
        if (rows[0]?.wait_event_type === "Lock") return;
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      assert.fail("concurrent writer was never observed waiting for PostgreSQL lock");
    }
    async function race(kind, winner) {
      const collegeId = await createCollege();
      const table = kind === "membership" ? "college_memberships" : "tenant_domains";
      const childGuard = kind === "membership"
        ? "db01_memberships_active_college_ck" : "db01_tenant_domain_active_college_ck";
      const childPid = (await child.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
      const parentPid = (await parent.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;

      if (winner === "child") {
        await child.query("BEGIN");
        await insertChild(kind, collegeId, child);
        await parent.query("BEGIN");
        const attemptingArchive = settled(parent.query(
          "UPDATE colleges SET status='ARCHIVED' WHERE id=$1", [collegeId]));
        await awaitLock(parentPid);
        await child.query("COMMIT");
        await expectConstraint(await attemptingArchive, "db01_college_archive_db01_children_ck");
        await parent.query("ROLLBACK");
        assert.equal((await admin.query("SELECT status FROM colleges WHERE id=$1", [collegeId])).rows[0].status, "ACTIVE");
        assert.equal((await admin.query("SELECT count(*)::int AS n FROM " + table + " WHERE college_id=$1", [collegeId])).rows[0].n, 1);
      } else {
        await parent.query("BEGIN");
        await parent.query("UPDATE colleges SET status='ARCHIVED' WHERE id=$1", [collegeId]);
        await child.query("BEGIN");
        const id = randomUUID();
        const attemptingChild = settled(kind === "membership"
          ? child.query("INSERT INTO college_memberships (id, user_id, college_id) VALUES ($1,$2,$3)",
              [id, randomUUID(), collegeId])
          : child.query("INSERT INTO tenant_domains (id, college_id) VALUES ($1,$2)", [id, collegeId]));
        await awaitLock(childPid);
        await parent.query("COMMIT");
        await expectConstraint(await attemptingChild, childGuard);
        await child.query("ROLLBACK");
        assert.equal((await admin.query("SELECT status FROM colleges WHERE id=$1", [collegeId])).rows[0].status, "ARCHIVED");
        assert.equal((await admin.query("SELECT count(*)::int AS n FROM " + table + " WHERE college_id=$1", [collegeId])).rows[0].n, 0);
      }
    }

    try {
      await admin.connect();
      await child.connect();
      await parent.connect();
      await admin.query("CREATE SCHEMA " + ident);
      created = true;
      for (const client of [admin, child, parent]) {
        await client.query("SET search_path TO " + ident + ", pg_catalog");
      }
      await admin.query("CREATE TYPE college_status AS ENUM ('ACTIVE','ARCHIVED')");
      await admin.query("CREATE TYPE membership_status AS ENUM ('ACTIVE','SUSPENDED','ENDED')");
      await admin.query("CREATE TABLE colleges (id uuid PRIMARY KEY, status college_status NOT NULL DEFAULT 'ACTIVE')");
      await admin.query("CREATE TABLE college_memberships (id uuid PRIMARY KEY, user_id uuid NOT NULL, college_id uuid NOT NULL REFERENCES colleges(id), status membership_status NOT NULL DEFAULT 'ACTIVE')");
      await admin.query("CREATE TABLE tenant_domains (id uuid PRIMARY KEY, college_id uuid NOT NULL REFERENCES colleges(id))");
      await admin.query(stage);

      // Historical ENDED membership is permitted, but it may not revive under
      // an archived college. A SUSPENDED membership still blocks archiving.
      const endedCollege = await createCollege();
      const endedMembership = await insertChild("membership", endedCollege, admin, "ENDED");
      await admin.query("UPDATE colleges SET status='ARCHIVED' WHERE id=$1", [endedCollege]);
      await assert.rejects(
        admin.query("UPDATE college_memberships SET status='ACTIVE' WHERE id=$1", [endedMembership]),
        error => error.code === "23514" && error.constraint === "db01_memberships_active_college_ck");

      const suspendedCollege = await createCollege();
      await insertChild("membership", suspendedCollege, admin, "SUSPENDED");
      await assert.rejects(
        admin.query("UPDATE colleges SET status='ARCHIVED' WHERE id=$1", [suspendedCollege]),
        error => error.code === "23514" && error.constraint === "db01_college_archive_db01_children_ck");

      const domainCollege = await createCollege();
      await insertChild("domain", domainCollege);
      await assert.rejects(
        admin.query("UPDATE colleges SET status='ARCHIVED' WHERE id=$1", [domainCollege]),
        error => error.code === "23514" && error.constraint === "db01_college_archive_db01_children_ck");

      const activeCollege = await createCollege();
      const archivedCollege = await createCollege("ARCHIVED");
      const movedDomain = await insertChild("domain", activeCollege);
      await assert.rejects(
        admin.query("UPDATE tenant_domains SET college_id=$1 WHERE id=$2", [archivedCollege, movedDomain]),
        error => error.code === "23514" && error.constraint === "db01_tenant_domain_active_college_ck");

      await race("membership", "child");
      await race("membership", "archive");
      await race("domain", "child");
      await race("domain", "archive");
    } finally {
      // A rejected transaction leaves its connection aborted until ROLLBACK.
      for (const c of [child, parent]) {
        try { await c.query("ROLLBACK"); } catch {}
      }
      if (created) {
        try {
          await admin.query("SET search_path TO pg_catalog");
          await admin.query("DROP SCHEMA " + ident + " CASCADE");
        } catch (error) { throw new Error("Failed to drop disposable DB01 test schema", { cause: error }); }
      }
      await Promise.all([child.end().catch(() => {}), parent.end().catch(() => {}), admin.end().catch(() => {})]);
    }
  });
}
