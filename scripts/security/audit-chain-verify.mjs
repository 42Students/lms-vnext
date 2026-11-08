#!/usr/bin/env node
// Verifies the audit hash chain (SEC-26-007). Read-only.
//   DATABASE_URL=<read access to the database> node scripts/security/audit-chain-verify.mjs
// Reads as a system scope (app.system) because security_audit_events is a tenant table. Exits 1 when any chained
// row's hash, link to the previous row, or sequence number is wrong, or the head does not match the last row.
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("set DATABASE_URL");
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("select set_config('app.system', 'audit-chain-verify', false)");
  const bad = await client.query(`
    WITH ordered AS (
      SELECT e AS rec, e.chain_seq, e.id, e.prev_hash, e.row_hash,
             lag(e.row_hash) OVER (ORDER BY e.chain_seq) AS expected_prev,
             lag(e.chain_seq) OVER (ORDER BY e.chain_seq) AS prev_seq
        FROM security_audit_events e
       WHERE e.chain_seq IS NOT NULL
    ), checked AS (
      SELECT o.chain_seq, o.id,
             (o.row_hash IS DISTINCT FROM security_audit_hash(o.prev_hash, o.chain_seq, o.rec)) AS hash_wrong,
             (o.expected_prev IS NOT NULL AND o.prev_hash IS DISTINCT FROM o.expected_prev) AS link_wrong,
             (o.prev_seq IS NOT NULL AND o.chain_seq <> o.prev_seq + 1) AS gap
        FROM ordered o
    )
    SELECT * FROM checked WHERE hash_wrong OR link_wrong OR gap ORDER BY chain_seq LIMIT 20`);
  const stats = (await client.query("select count(*)::int n, max(chain_seq) last_seq from security_audit_events where chain_seq is not null")).rows[0];
  const head = (await client.query("select last_seq, last_hash from security_audit_chain_head where id = 1")).rows[0];
  const last = (await client.query("select row_hash from security_audit_events where chain_seq = $1", [head?.last_seq ?? 0])).rows[0];
  const problems = [];
  for (const r of bad.rows) problems.push(`row ${r.chain_seq} (${r.id}): ${[r.hash_wrong && "hash", r.link_wrong && "link", r.gap && "sequence gap"].filter(Boolean).join(", ")}`);
  if (head && Number(head.last_seq) !== Number(stats.last_seq ?? 0)) problems.push(`head says ${head.last_seq} but the last chained row is ${stats.last_seq}`);
  if (head && Number(head.last_seq) > 0 && last?.row_hash !== head.last_hash) problems.push("head hash does not match the last chained row");
  if (problems.length) {
    console.error("audit chain BROKEN:\n" + problems.join("\n"));
    process.exit(1);
  }
  console.log(`audit chain ok: ${stats.n} chained rows, head at ${head?.last_seq ?? 0}`);
} finally {
  await client.end();
}
