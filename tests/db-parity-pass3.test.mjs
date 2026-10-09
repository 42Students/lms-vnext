import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const audit = read("docs/planning/database-parity-pass3-fk-audit.json");
const source = read("docs/planning/database-parity-source-inventory.json");
const ledger = read("docs/planning/database-parity-five-pass-tracker.json");

test("Pass 3 graph is tied to a frozen schema snapshot and includes every table", () => {
  assert.equal(audit.pass, 3);
  assert.equal(audit.snapshotSha, source.baseline.vnext.sha);
  const tables = audit.tableForeignKeyGraph.map(t => t.table);
  assert.equal(new Set(tables).size, tables.length);
  assert.deepEqual([...tables].sort(), source.vnextSnapshotTables.map(t => t.name.replace(/^public\./,"")).sort());
  assert.equal(tables.length, audit.stats.tables);
});

test("foreign keys and cascade stats reconcile to source-side graph", () => {
  const fks = audit.tableForeignKeyGraph.flatMap(t => t.foreignKeys);
  assert.equal(fks.length, audit.stats.foreignKeys);
  assert.equal(fks.filter(f => f.fromColumns.length > 1).length, audit.stats.compositeForeignKeys);
  assert.equal(fks.filter(f => f.fromColumns.length === 1).length, audit.stats.singleColumnForeignKeys);
  assert.equal(fks.filter(f => f.onDelete === "cascade").length, audit.stats.cascadeForeignKeys);
  assert.equal(fks.filter(f => f.onDelete === "restrict").length, audit.stats.restrictForeignKeys);
  assert.equal(audit.tableForeignKeyGraph.reduce((n,t)=>n+t.checkConstraintCount,0), audit.stats.checkConstraints);
});

test("all multi-parent and priority review cases are tracked without false verification", () => {
  assert.equal(audit.multiParentCandidateQueue.length, audit.stats.candidateMultiParentTables);
  const tables = new Set(audit.tableForeignKeyGraph.map(t => t.table));
  const queue = audit.multiParentCandidateQueue;
  assert.equal(new Set(queue.map(t => t.table)).size, queue.length);
  assert.ok(queue.every(x => tables.has(x.table)));
  assert.ok(queue.every(x => x.status !== "VERIFIED"));
  assert.equal(audit.priorityChecks.length, 10);
  for(const item of audit.priorityChecks) assert.ok(tables.has(item.table));
});

test("audit passes 4 and 5 remain unstarted after first additional pass", () => {
  assert.deepEqual(ledger.passes.map(p=>p.pass), [1,2,3,4,5]);
  assert.equal(ledger.passes[2].status,"SOURCE_AUDIT_DONE");
  assert.equal(ledger.passes[3].status,"NOT_STARTED");
  assert.equal(ledger.passes[4].status,"NOT_STARTED");
});

test("no source-only audit implies actual Postgres has been verified", () => {
  assert.ok(ledger.remainingBlockers.some(x=>/PostgreSQL/.test(x)));
  assert.ok(audit.notes.some(x=>/not.*vulnerab|lack.*does not/i.test(x)));
});
