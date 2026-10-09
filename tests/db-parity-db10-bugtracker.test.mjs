import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readText = p => fs.readFileSync(path.join(root, p), "utf8");
const read = p => JSON.parse(readText(p));
const ledger = read("docs/planning/database-parity-db10-field-ledger.json");
const source = read("docs/planning/db-pass4-columns-db10_shared_operations.json");
const draft = readText("src/db/schema/db10-bug-tracker.draft.ts");
const domain = readText("src/modules/bug-tracker/workflow.ts");

const tables = new Map([
  ["bug_report", "bug_reports"],
  ["bug_report_activity", "bug_report_activities"],
  ["bug_report_attachment", "bug_report_attachments"],
  ["bug_tracker_access", "bug_tracker_access"],
  ["bug_tracker_session", "bug_tracker_sessions"],
]);
const rows = ledger.records.filter(r => tables.has(r.legacyTable));

test("DB10 maintains all 58 source-reviewed tracker fields without claiming DB verification", () => {
  assert.equal(rows.length, 58);
  assert.ok(ledger.counts.sourceReviewedFields >= 58); // DB10 may review additional domains independently
  assert.equal(ledger.counts.verified, 0);
  assert.equal(ledger.counts.unmapped, 221);
  for (const r of rows) {
    assert.equal(r.status, "UNMAPPED");
    assert.equal(r.evidenceScope, "SOURCE_DDL_AND_JPA_REVIEW_ONLY");
    assert.ok(r.semantics);
    assert.ok(r.sourceReview.length > 0);
    assert.equal(r.mappingTarget, null, "unregistered draft is NOT an implemented mapping");
  }
  assert.equal(source.counts.fields, 221);
});

test("the proposed draft covers each reviewed legacy column and the five related tables", () => {
  for (const [, target] of tables) {
    assert.ok(draft.includes('pgTable("' + target + '"'), "missing table " + target);
  }
  const chunks = new Map();
  for (const [, target] of tables) {
    const start = draft.indexOf('pgTable("' + target + '"');
    const next = draft.indexOf("export const ", start);
    chunks.set(target, draft.slice(start, next >= 0 ? next : undefined));
  }
  for (const r of rows) {
    const [target, column] = r.proposedTarget.split(".");
    assert.equal(target, tables.get(r.legacyTable));
    assert.ok(
      chunks.get(target).includes('("' + column + '"'),
      "Missing draft " + r.proposedTarget,
    );
  }
});

test("sensitive tracker tokens and history are scoped to restrictive object ownership", () => {
  assert.ok(draft.includes('tokenHash: varchar("token_hash"'));
  assert.ok(draft.includes('"bug_report_activities"'));
  assert.ok(draft.includes('"bug_report_attachments"'));
  assert.ok(draft.includes('onDelete: "restrict"'));
  assert.ok(draft.includes('"version").notNull().default(0)'));
  assert.ok(!draft.includes('onDelete: "cascade"'));
  assert.ok(!draft.includes("CREATE TABLE"));
});

test("workflow/retest code includes legacy states, version defense and real actor attribution", () => {
  for (const status of ["NEW", "CHECKING", "FIXING", "READY_FOR_RETEST", "CLOSED"]) {
    assert.ok(domain.includes('"' + status + '"'));
  }
  assert.ok(domain.includes('throw new BugWorkflowError("STALE_VERSION")'));
  assert.ok(domain.includes('requireSuperAdmin(actor)'));
  assert.ok(domain.includes("actorId: actor.id"));
});
