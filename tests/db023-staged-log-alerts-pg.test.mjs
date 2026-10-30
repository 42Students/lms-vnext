// DB-023 pre-registration witness: exact staged SQL against isolated PG17.
// All DDL/data are inside a rollback-only transaction. This does NOT certify
// registered migration, active producer, security grants, or DB-023 DONE.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import pg from "pg";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";

if (process.env.DB023_STAGED_PG !== "YES")
  throw new Error("DB023 staged PostgreSQL witness requires explicit opt-in");
assertDb018DisposableTarget(process.env, { serviceBound: true });

async function mustReject(db, sql, args, code) {
  await db.query("SAVEPOINT rejected_input");
  try {
    await assert.rejects(db.query(sql, args), error => {
      assert.equal(error?.code, code, "Wrong SQLSTATE for rejected input");
      return true;
    });
  } finally {
    await db.query("ROLLBACK TO SAVEPOINT rejected_input");
    await db.query("RELEASE SAVEPOINT rejected_input");
  }
}

test("DB023 complete staged PG17 alert triage, identities and bigint histories", {timeout:120000}, async () => {
  const db = new pg.Client({
    connectionString: process.env.TEST_DATABASE_URL,
    connectionTimeoutMillis: 10000,
    query_timeout: 15000,
  });
  await db.connect();
  let active = false;
  try {
    const version = Number((await db.query("SHOW server_version_num")).rows[0].server_version_num);
    assert.ok(version >= 170000 && version < 180000, "Require PostgreSQL 17");
    await db.query("BEGIN");
    active = true;
    await db.query(readFileSync("scripts/sql/db10-log-alerts-staging.sql", "utf8"));

    const expected = {
      log_alert_signatures: [
        "signature_hash","environment","occurrence_count","day_occurrences",
        "recent_window_count","recent_window_at","last_spike_alert_at",
        "alerted_at","acknowledged_at","day_key",
      ],
      log_alert_signature_accounts: ["signature_id","account_key_hash","first_seen_at"],
      log_alert_states: [
        "state_key","poll_page_token","poll_window_start_at",
        "poll_window_end_at","burst_count","overflow_count","last_digest_day",
      ],
      log_alert_daily_counts: ["signature_id","day_key","occurrence_count","spike_count"],
      log_alert_observed_events: ["event_hash","observed_at"],
    };
    for (const [table, columns] of Object.entries(expected)) {
      const result = await db.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1",
        [table],
      );
      const actual = new Set(result.rows.map(row => row.column_name));
      for (const col of columns)
        assert.ok(actual.has(col), "Missing staged PostgreSQL field "+table+"."+col);
    }

    const seen = "2026-01-02T00:00:00.000Z";
    const first = "2026-01-01T00:00:00.000Z";
    const signature = (await db.query(
      "INSERT INTO log_alert_signatures(environment,signature_hash,first_seen_at,last_seen_at) VALUES($1,$2,$3,$4) RETURNING id,occurrence_count::text AS count,day_occurrences::text AS day_count",
      ["PRODUCTION","a".repeat(64),seen,seen],
    )).rows[0];
    assert.equal(signature.count,"1");
    assert.equal(signature.day_count,"1");

    await mustReject(db,
      "INSERT INTO log_alert_signatures(environment,signature_hash,first_seen_at,last_seen_at) VALUES($1,$2,$3,$4)",
      ["PRODUCTION","a".repeat(64),seen,seen], "23505");
    await mustReject(db,
      "INSERT INTO log_alert_signatures(environment,signature_hash,first_seen_at,last_seen_at) VALUES($1,$2,$3,$4)",
      ["PRODUCTION","raw-identity-value",seen,seen], "23514");
    await mustReject(db,
      "UPDATE log_alert_signatures SET fix_status='FIXED' WHERE id=$1",
      [signature.id], "23514");
    await mustReject(db,
      "UPDATE log_alert_signatures SET occurrence_count=0 WHERE id=$1",
      [signature.id], "23514");

    // Backend monotonic increment and out-of-order handling retain exact
    // PostgreSQL 64-bit precision; no Number conversion through JavaScript.
    const precise = (await db.query(
      "UPDATE log_alert_signatures SET occurrence_count=$2::bigint,day_occurrences=$2::bigint,first_seen_at=least(first_seen_at,$3::timestamptz),last_seen_at=greatest(last_seen_at,$3::timestamptz) WHERE id=$1 RETURNING occurrence_count::text AS exact,first_seen_at,last_seen_at",
      [signature.id,"9007199254740995",first],
    )).rows[0];
    assert.equal(precise.exact,"9007199254740995");
    assert.equal(new Date(precise.first_seen_at).toISOString(),first);
    assert.equal(new Date(precise.last_seen_at).toISOString(),seen);
    const increment = (await db.query(
      "UPDATE log_alert_signatures SET occurrence_count=occurrence_count+1 WHERE id=$1 RETURNING occurrence_count::text AS exact",
      [signature.id],
    )).rows[0];
    assert.equal(increment.exact,"9007199254740996");

    // No raw person/user identifier is stored as blast-radius identity.
    await db.query(
      "INSERT INTO log_alert_signature_accounts(signature_id,account_key_hash,first_seen_at) VALUES($1,$2,$3)",
      [signature.id,"b".repeat(64),seen],
    );
    await mustReject(db,
      "INSERT INTO log_alert_signature_accounts(signature_id,account_key_hash,first_seen_at) VALUES($1,$2,$3)",
      [signature.id,"b".repeat(64),seen], "23505");
    await mustReject(db,
      "INSERT INTO log_alert_signature_accounts(signature_id,account_key_hash,first_seen_at) VALUES($1,$2,$3)",
      [signature.id,"person@example.test",seen], "23514");

    const day = (await db.query(
      "INSERT INTO log_alert_daily_counts(signature_id,day_key,occurrence_count,spike_count) VALUES($1,$2,$3,$4) RETURNING occurrence_count::text AS exact,spike_count::text AS spikes",
      [signature.id,"2026-01-02","9007199254740995","9007199254740994"],
    )).rows[0];
    assert.equal(day.exact,"9007199254740995");
    assert.equal(day.spikes,"9007199254740994");
    await mustReject(db,
      "INSERT INTO log_alert_daily_counts(signature_id,day_key,occurrence_count) VALUES($1,$2,$3)",
      [signature.id,"2026-01-03","0"], "23514");
    await mustReject(db,
      "INSERT INTO log_alert_daily_counts(signature_id,day_key) VALUES($1,$2)",
      [signature.id,"2026-01-02"], "23505");
    await mustReject(db,
      "INSERT INTO log_alert_daily_counts(signature_id,day_key) VALUES($1,$2)",
      ["00000000-0000-4000-8000-000000000001","2026-01-04"], "23503");

    await db.query("INSERT INTO log_alert_observed_events(event_hash) VALUES($1)",["c".repeat(64)]);
    await mustReject(db,"INSERT INTO log_alert_observed_events(event_hash) VALUES($1)",["request-id@example.test"],"23514");
    await mustReject(db,"INSERT INTO log_alert_observed_events(event_hash) VALUES($1)",["c".repeat(64)],"23505");

    await db.query(
      "INSERT INTO log_alert_states(state_key,poll_page_token,overflow_count,last_digest_day) VALUES($1,$2,$3,$4)",
      ["poll:production","opaque-continuation","9007199254740995","2026-01-02"],
    );
    const state=(await db.query(
      "SELECT overflow_count::text AS overflow,poll_page_token,last_digest_day FROM log_alert_states WHERE state_key=$1",
      ["poll:production"],
    )).rows[0];
    assert.equal(state.overflow,"9007199254740995");
    assert.equal(state.poll_page_token,"opaque-continuation");
    await mustReject(db,"INSERT INTO log_alert_states(state_key) VALUES($1)",["   "],"23514");
    await mustReject(db,"INSERT INTO log_alert_states(state_key) VALUES($1)",["poll:production"],"23505");

    await db.query("ROLLBACK");
    active=false;
  } finally {
    if(active) await db.query("ROLLBACK").catch(()=>{});
    await db.end();
  }
});
