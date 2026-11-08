#!/usr/bin/env node
// Audit retention (SEC-19-021). The audit table is append-only for every application role, so purging old rows is a
// deliberate migrator-level operation, never an application feature.
//
//   DATABASE_URL=<migrator login> node scripts/security/audit-retention.mjs --days 365              (dry run, prints counts)
//   AUDIT_RETENTION_CONFIRM=I_ACCEPT DATABASE_URL=... node scripts/security/audit-retention.mjs --days 365 --apply
//
// In one transaction it disables only the append-only trigger of security_audit_events, deletes rows older than the
// cutoff in a bounded batch, re-enables the trigger, and writes one chained audit row that records what was removed
// (count and the sequence range), so the purge itself is part of the evidence. The chain verifier treats the first
// remaining row as the start of the retained window. Never run against a database you did not intend to purge.
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("set DATABASE_URL (the migrator login)");
const args = process.argv.slice(2);
const days = Number(args[args.indexOf("--days") + 1]);
if (!Number.isInteger(days) || days < 30) throw new Error("--days must be an integer of at least 30");
const apply = args.includes("--apply");
if (apply && process.env.AUDIT_RETENTION_CONFIRM !== "I_ACCEPT") throw new Error("set AUDIT_RETENTION_CONFIRM=I_ACCEPT to apply");
const BATCH = 50000;

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("select set_config('app.system', 'audit-retention', false)");
  const cutoffSql = "now() - ($1::int * interval '1 day')";
  // Only a PREFIX of the chain may be removed, or the verifier would (rightly) report a gap: everything before the
  // first row that is newer than the cutoff, plus unchained rows older than the cutoff (written before migration 0342).
  const boundary = (await client.query(
    `select min(chain_seq) b from security_audit_events where chain_seq is not null and occurred_at >= ${cutoffSql}`,
    [days],
  )).rows[0].b;
  const purgeWhere = boundary === null
    ? `(chain_seq is not null or occurred_at < ${cutoffSql})`
    : `(chain_seq < ${boundary} or (chain_seq is null and occurred_at < ${cutoffSql}))`;
  const summary = (await client.query(
    `select count(*)::int n, min(chain_seq) lo, max(chain_seq) hi, min(occurred_at) oldest from security_audit_events where ${purgeWhere}`,
    [days],
  )).rows[0];
  console.log(`rows older than ${days} days: ${summary.n} (chain ${summary.lo ?? "-"}..${summary.hi ?? "-"}, oldest ${summary.oldest?.toISOString?.() ?? "-"})`);
  if (!apply || summary.n === 0) {
    console.log(apply ? "nothing to purge" : "dry run: nothing changed");
    process.exit(0);
  }
  await client.query("begin");
  try {
    await client.query("alter table security_audit_events disable trigger security_audit_events_no_change");
    const del = await client.query(
      `delete from security_audit_events where id in (select id from security_audit_events where ${purgeWhere} order by chain_seq nulls first limit ${BATCH})`,
      [days],
    );
    await client.query("alter table security_audit_events enable trigger security_audit_events_no_change");
    await client.query(
      "insert into security_audit_events (event, outcome, target, detail) values ('audit.retention_purge', 'ok', 'retention', $1::jsonb)",
      [JSON.stringify({ removed: del.rowCount, olderThanDays: days, chainFrom: summary.lo, chainTo: summary.hi })],
    );
    await client.query("commit");
    console.log(`purged ${del.rowCount} rows; run again if more remain (batch limit ${BATCH})`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
} finally {
  await client.end();
}
