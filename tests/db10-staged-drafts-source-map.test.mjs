import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ledger = JSON.parse(readFileSync(
  "docs/planning/database-parity-db10-field-ledger.json",
  "utf8",
));
const announcements = readFileSync("src/db/schema/db10-announcements.draft.ts", "utf8");
const tracker = readFileSync("src/db/schema/db10-bug-tracker.draft.ts", "utf8");
const leases = readFileSync("src/db/schema/db10-scheduled-job-leases.draft.ts", "utf8");
const barrel = readFileSync("src/db/schema/index.ts", "utf8");
const leaseStore = readFileSync(
  "src/modules/operations/postgres-scheduled-job-lease-store.ts",
  "utf8",
);

const legacyTables = new Set([
  "announcements",
  "bug_report",
  "bug_report_activity",
  "bug_report_attachment",
  "bug_tracker_access",
  "bug_tracker_session",
  "scheduled_job_lock",
]);
const rows = ledger.records.filter(row => legacyTables.has(row.legacyTable));

const targetFile = new Map([
  ["announcements", announcements],
  ["bug_reports", tracker],
  ["bug_report_activities", tracker],
  ["bug_report_attachments", tracker],
  ["bug_tracker_access", tracker],
  ["bug_tracker_sessions", tracker],
  ["scheduled_job_leases", leases],
]);

function tableChunk(source, table) {
  const marker = 'pgTable("' + table + '"';
  const start = source.indexOf(marker);
  assert.ok(start >= 0, "Draft table missing: " + table);
  const next = source.indexOf("export const ", start + marker.length);
  return source.slice(start, next >= 0 ? next : undefined);
}

function targetRefs(proposedTarget) {
  return proposedTarget.split("+").map(part => part.trim());
}

function assertTargetExists(ref) {
  const match = /^([a-z0-9_]+)\.([a-z0-9_]+)$/.exec(ref);
  assert.ok(match, "Invalid proposed target syntax: " + ref);
  const [, table, column] = match;
  const source = targetFile.get(table);
  assert.ok(source, "No draft source registered for " + table);
  const chunk = tableChunk(source, table);
  assert.ok(
    chunk.includes('("' + column + '"'),
    "Missing draft column " + ref,
  );
}

test("DB40 selects exactly the 75 staged-draft source rows", () => {
  assert.equal(rows.length, 75);
  const count = table => rows.filter(row => row.legacyTable === table).length;
  assert.equal(count("announcements"), 13);
  assert.equal(
    count("bug_report") +
      count("bug_report_activity") +
      count("bug_report_attachment") +
      count("bug_tracker_access") +
      count("bug_tracker_session"),
    58,
  );
  assert.equal(count("scheduled_job_lock"), 4);
});

test("DB40 every source row has a draft target that physically exists", () => {
  for (const row of rows) {
    assert.equal(row.status, "UNMAPPED");
    assert.ok(row.proposedTarget, row.id + " missing proposedTarget");
    for (const ref of targetRefs(row.proposedTarget)) {
      assertTargetExists(ref);
    }
  }
});

test("DB40 announcement soft-delete source field resolves both normalized columns", () => {
  const row = rows.find(
    item => item.legacyTable === "announcements" &&
      item.legacyColumn === "is_deleted",
  );
  assert.ok(row);
  assert.deepEqual(targetRefs(row.proposedTarget), [
    "announcements.deleted_at",
    "announcements.deleted_by_user_id",
  ]);
  for (const ref of targetRefs(row.proposedTarget)) assertTargetExists(ref);
});

test("DB40 isolated drafts are not exported through the shared schema barrel", () => {
  assert.doesNotMatch(barrel, /db10-announcements\.draft/);
  assert.doesNotMatch(barrel, /db10-bug-tracker\.draft/);
  assert.doesNotMatch(barrel, /db10-scheduled-job-leases\.draft/);
  assert.equal(ledger.counts.verified, 0);
  assert.ok(rows.every(row => row.status === "UNMAPPED"));
});

test("DB40 announcement draft includes tenant scope, CAS and safe lifecycle additions", () => {
  const chunk = tableChunk(announcements, "announcements");
  for (const column of [
    "organization_id",
    "college_id",
    "deleted_by_user_id",
    "version",
    "scheduled_at",
    "expires_at",
    "is_pinned",
  ]) {
    assert.ok(chunk.includes('("' + column + '"'), "Missing announcement safety column " + column);
  }
  assert.match(chunk, /db10_announcements_schedule_order_ck/);
  assert.match(chunk, /db10_announcements_delete_shape_ck/);
});

test("DB40 bug tracker draft preserves private evidence and restrictive history", () => {
  assert.match(tracker, /storageKey: varchar\("storage_key"/);
  assert.doesNotMatch(tracker, /public_url|publicUrl/);
  assert.doesNotMatch(tracker, /onDelete: "cascade"/);
  assert.match(tracker, /actorUserId: uuid\("actor_user_id"/);
  assert.match(tracker, /actorAccessId: uuid\("actor_access_id"/);
  assert.match(tracker, /revokedAt: timestamp\("revoked_at"/);
  assert.match(tracker, /version: integer\("version"\)\.notNull\(\)\.default\(0\)/);
});

test("DB40 scheduled lease safety redesign adds fencing and stale-worker defense", () => {
  const chunk = tableChunk(leases, "scheduled_job_leases");
  assert.match(chunk, /fence: bigint\("fence"/);
  assert.match(chunk, /db10_scheduled_job_leases_fence_ck/);
  assert.match(leaseStore, /fence = scheduled_job_leases\.fence \+ 1/);
  assert.match(leaseStore, /and fence = \$\{lease\.fence\}/);
  assert.match(leaseStore, /locked_until > clock_timestamp\(\)/);
});

test("DB40 keeps source-shape evidence distinct from migration/runtime verification", () => {
  const manifest = readFileSync(
    "docs/planning/database-parity-db10-staged-drafts-integration.md",
    "utf8",
  );
  for (let i = 1; i <= 20; i += 1) {
    const id = "DB40-" + String(i).padStart(2, "0");
    assert.ok(manifest.includes(id), "Missing acceptance requirement " + id);
  }
  assert.match(manifest, /ALL NOT_RUN/);
  assert.match(manifest, /cannot be DONE_VERIFIED until/);
});
