import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const schema = readFileSync("src/db/schema/db10-log-alerts.draft.ts","utf8");
const sql = readFileSync("scripts/sql/db10-log-alerts-staging.sql","utf8");
const doc = readFileSync("docs/planning/database-parity-db10-log-alerts-contract.md","utf8");

test("DB23 is source-staged, not runtime-verified", () => {
  assert.match(sql, /STAGING ONLY \/ NOT REGISTERED/);
  assert.match(doc, /DRAFT_NOT_JOURNALLED/);
  assert.match(doc, /POSTGRES_NOT_RUN/);
  for(let i=1;i<=10;i++) {
    assert.ok(doc.includes("DB23-"+String(i).padStart(2,"0")));
  }
});

test("DB23 persistence includes the three legacy durable families", () => {
  for (const table of ["log_alert_signatures","log_alert_signature_accounts","log_alert_states"]) {
    assert.match(sql, new RegExp("CREATE TABLE(?: IF NOT EXISTS)? "+table+" \\("));
    assert.ok(schema.includes('"'+table+'"'));
  }
  for (const index of [
    "db10_log_alert_signature_env_hash_uq",
    "db10_log_alert_signature_status_seen_idx",
    "db10_log_alert_signature_muted_seen_idx",
    "db10_log_alert_signature_accounts_hash_idx",
    "db10_log_alert_states_key_uq",
  ]) {
    assert.ok(sql.includes(index), index+" missing SQL");
    assert.ok(schema.includes(index), index+" missing schema");
  }
});

test("DB23 bigint count uses full precision, not JavaScript number", () => {
  assert.match(sql, /occurrence_count bigint NOT NULL DEFAULT 1/);
  assert.match(schema, /occurrenceCount: bigint\("occurrence_count", \{ mode: "bigint" \}\)\.notNull\(\)\.default\(sql`1`\)/);
  assert.doesNotMatch(schema, /occurrence_count", \{ mode: "number" \}/);
  assert.match(sql, /db10_log_alert_signature_count_ck/);
});

test("DB23 stores a verified opaque digest, never assumes a users.id FK", () => {
  assert.match(sql, /account_key_hash varchar\(64\) NOT NULL/);
  assert.match(schema, /accountKeyHash: varchar\("account_key_hash", \{ length: 64 \}\)/);
  assert.match(sql, /PRIMARY KEY \(signature_id,account_key_hash\)/);
  assert.match(schema, /primaryKey\(\{ columns: \[t.signatureId, t.accountKeyHash\] \}\)/);
  assert.match(sql, /db10_log_alert_signature_accounts_hash_ck/);
  assert.doesNotMatch(sql, /REFERENCES users\(/);
  assert.doesNotMatch(schema, /userId: uuid\("user_id"/);
});

test("DB23 signature state and durable cursors retain constraints", () => {
  for (const key of [
    "db10_log_alert_signature_hash_ck",
    "db10_log_alert_signature_status_ck",
    "db10_log_alert_signature_seen_order_ck",
    "db10_log_alert_signature_fixed_shape_ck",
    "db10_log_alert_states_key_ck",
  ]) {
    assert.ok(sql.includes(key), key+" missing SQL");
    assert.ok(schema.includes(key), key+" missing Drizzle");
  }
  assert.match(sql, /fix_status IN \('OPEN','FIXED','EXPECTED'\)/);
  assert.match(doc, /out-of-order/);
});

test("DB23 draft hex digest predicate closes before the states table", () => {
  assert.ok(
    schema.includes("sql`${t.accountKeyHash} ~ '^[0-9a-f]{64}$'`"),
    "draft must use the same anchored, closed 64-hex predicate as staged SQL",
  );
  assert.equal(
    schema.split("export const db10LogAlertStates =").length - 1,
    1,
    "states must be declared exactly once, outside of the SQL template",
  );
});

test("DB23 draft parses as TypeScript", () => {
  const parsed = ts.createSourceFile(
    "db10-log-alerts.draft.ts",
    schema,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  assert.deepEqual(
    parsed.parseDiagnostics.map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")),
    [],
    "log-alert draft must not absorb table declarations into SQL templates",
  );
});
