// DB-066 / Chat 3.
// Source: node --test tests/db08-cross-parent-integrity.test.mjs
// Disposable PostgreSQL (explicit opt-in):
// DB08_CROSS_PARENT_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA \
// TEST_DATABASE_URL=postgres://.../test_lms_vnext \
// node --test tests/db08-cross-parent-integrity.test.mjs
// This file does NOT certify production, migrations or executed PG tests.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { verifyDB08CrossParentSource } from "../scripts/verify-db08-cross-parent-source.mjs";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

const candidate = readFileSync(
  resolve("docs/planning/sql/db08-cross-parent-consistency-candidate.sql"), "utf8");
const schema = readFileSync(resolve("src/db/schema/placements.ts"), "utf8");

test("DB-066 source guard tracks seven parents, nine scoped FKs and no DROP", () => {
  const status = verifyDB08CrossParentSource(schema, candidate);
  assert.equal(status.tables, 7);
  assert.equal(status.parentKeys, 3);
  assert.equal(status.scopedForeignKeys, 9);
  assert.equal(status.childJobColumns, 3);
  assert.equal(status.postgresExecution, "NOT_EXECUTED");
});

test("DB-066 guard catches dropped application/role relationship", () => {
  assert.throws(
    () => verifyDB08CrossParentSource(
      schema, candidate.replace("db066_application_role_same_job_fk", "removed_fk")),
    /Missing\/duplicate scoped invariant/,
  );
});

test("DB-066 guard catches child job column becoming nullable", () => {
  assert.throws(
    () => verifyDB08CrossParentSource(
      schema,
      candidate.replace(
        "ALTER TABLE placement_learner_requests ALTER COLUMN job_id SET NOT NULL;",
        "-- nullable change ignored;",
      )),
    /Missing fail-closed job discriminator/,
  );
});

const approved =
  process.env.DB08_CROSS_PARENT_DISPOSABLE === "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  (!process.env.DATABASE_URL ||
   process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL);

test("cross-job FK negative writes, reparent rejection and correct scoped writes in disposable PostgreSQL", {
  skip: !approved, timeout: 90000,
}, async () => {
  assertSafeDb01TestTarget(process.env);
  const pg = await import("pg");
  const name = "db08_scope_" + randomUUID().replaceAll("-", "").slice(0, 18);
  const quoted = '"' + name + '"';
  const client = new pg.default.Client({
    connectionString: process.env.TEST_DATABASE_URL,
    application_name: "db08-same-job-integrity-witness",
  });
  let created = false;
  const ids = Object.fromEntries([
    "jobA","jobB","roleA","roleB","appA","appB",
    "roundA","roundB","offerA","offerB","requestA","resultA","exceptionA",
  ].map(k => [k,randomUUID()]));
  const fkReject = async (sql, args) => {
    await assert.rejects(client.query(sql,args), error => {
      assert.equal(error.code, "23503", String(error));
      return true;
    });
  };
  try {
    await client.connect();
    await client.query("CREATE SCHEMA " + quoted);
    created = true;
    await client.query("SET search_path TO " + quoted + ", pg_catalog");
    // Deliberately minimal parent tables; parent superkeys mirror staged DB09.
    await client.query(`
      CREATE TABLE placement_job_role_options (
        id uuid PRIMARY KEY, job_id uuid NOT NULL
      );
      CREATE TABLE placement_applications (
        id uuid PRIMARY KEY, job_id uuid NOT NULL, role_option_id uuid NOT NULL
      );
      CREATE TABLE placement_job_rounds (
        id uuid PRIMARY KEY, job_id uuid NOT NULL, UNIQUE(id,job_id)
      );
      CREATE TABLE placement_round_results (
        id uuid PRIMARY KEY, round_id uuid NOT NULL, application_id uuid NOT NULL
      );
      CREATE TABLE placement_offers (
        id uuid PRIMARY KEY, application_id uuid NOT NULL
      );
      CREATE TABLE placement_learner_requests (
        id uuid PRIMARY KEY,
        application_id uuid NOT NULL,
        round_id uuid, offer_id uuid, request_type text NOT NULL
      );
      CREATE TABLE placement_application_round_exceptions (
        id uuid PRIMARY KEY,
        application_id uuid NOT NULL,
        round_id uuid NOT NULL, request_id uuid NOT NULL
      );
      ALTER TABLE placement_applications ADD CONSTRAINT db09_placement_applications_id_job_uq UNIQUE(id,job_id);
    `);
    await client.query(candidate);
    await client.query(
      "INSERT INTO placement_job_role_options(id,job_id) VALUES ($1,$2),($3,$4)",
      [ids.roleA,ids.jobA,ids.roleB,ids.jobB]);
    await client.query(
      "INSERT INTO placement_applications(id,job_id,role_option_id) VALUES ($1,$2,$3),($4,$5,$6)",
      [ids.appA,ids.jobA,ids.roleA,ids.appB,ids.jobB,ids.roleB]);
    await client.query(
      "INSERT INTO placement_job_rounds(id,job_id) VALUES ($1,$2),($3,$4)",
      [ids.roundA,ids.jobA,ids.roundB,ids.jobB]);
    await client.query(
      "INSERT INTO placement_offers(id,application_id) VALUES ($1,$2),($3,$4)",
      [ids.offerA,ids.appA,ids.offerB,ids.appB]);
    await client.query(
      "INSERT INTO placement_round_results(id,round_id,application_id,job_id) VALUES ($1,$2,$3,$4)",
      [ids.resultA,ids.roundA,ids.appA,ids.jobA]);
    await client.query(
      "INSERT INTO placement_learner_requests(id,application_id,round_id,request_type,job_id) VALUES ($1,$2,$3,'ROUND_RESCHEDULE',$4)",
      [ids.requestA,ids.appA,ids.roundA,ids.jobA]);
    await client.query(
      "INSERT INTO placement_application_round_exceptions(id,application_id,round_id,request_id,job_id) VALUES ($1,$2,$3,$4,$5)",
      [ids.exceptionA,ids.appA,ids.roundA,ids.requestA,ids.jobA]);

    // Both the role option and application IDs exist: wrong pairing must fail.
    await fkReject(
      "INSERT INTO placement_applications(id,job_id,role_option_id) VALUES ($1,$2,$3)",
      [randomUUID(),ids.jobA,ids.roleB]);
    await fkReject(
      "UPDATE placement_applications SET role_option_id=$1 WHERE id=$2",
      [ids.roleB,ids.appA]);

    // A valid round from job B + valid application from job A must fail.
    await fkReject(
      "INSERT INTO placement_round_results(id,round_id,application_id,job_id) VALUES ($1,$2,$3,$4)",
      [randomUUID(),ids.roundB,ids.appA,ids.jobA]);
    await fkReject(
      "UPDATE placement_round_results SET application_id=$1 WHERE id=$2",
      [ids.appB,ids.resultA]);

    // Target application/round and application/offer must be coherent.
    await fkReject(
      "INSERT INTO placement_learner_requests(id,application_id,round_id,request_type,job_id) VALUES ($1,$2,$3,'ROUND_RESCHEDULE',$4)",
      [randomUUID(),ids.appA,ids.roundB,ids.jobA]);
    await fkReject(
      "INSERT INTO placement_learner_requests(id,application_id,offer_id,request_type,job_id) VALUES ($1,$2,$3,'OFFER_EXTENSION',$4)",
      [randomUUID(),ids.appA,ids.offerB,ids.jobA]);

    // Exception must bind to the EXACT request (not only its same-job round).
    await fkReject(
      "INSERT INTO placement_application_round_exceptions(id,application_id,round_id,request_id,job_id) VALUES ($1,$2,$3,$4,$5)",
      [randomUUID(),ids.appB,ids.roundB,ids.requestA,ids.jobB]);

    // Parent ownership changes cannot silently invalidate existing child rows.
    await fkReject(
      "UPDATE placement_job_role_options SET job_id=$1 WHERE id=$2",
      [ids.jobB,ids.roleA]);
    await fkReject(
      "UPDATE placement_job_rounds SET job_id=$1 WHERE id=$2",
      [ids.jobB,ids.roundA]);

    const counts = await client.query(
      "SELECT (SELECT count(*)::int FROM placement_round_results) AS results, (SELECT count(*)::int FROM placement_application_round_exceptions) AS exceptions");
    assert.equal(counts.rows[0].results, 1);
    assert.equal(counts.rows[0].exceptions, 1);
  } finally {
    if (created) {
      await client.query("SET search_path TO public, pg_catalog").catch(() => {});
      await client.query("DROP SCHEMA IF EXISTS " + quoted + " CASCADE").catch(() => {});
    }
    await client.end().catch(() => {});
  }
});
