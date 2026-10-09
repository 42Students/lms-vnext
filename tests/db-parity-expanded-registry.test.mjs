import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const load = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const snapshot = load("docs/planning/database-parity-legacy-schema-snapshot.json");
const expanded = load("docs/planning/database-parity-expanded-legacy-registry.json");
const queue = load("docs/planning/database-parity-full-domain-queue.json");
const sweepFiles = [
  "docs/planning/db-sweep-migrations-151-161.json",
  "docs/planning/db-sweep-migrations-162-172.json",
  "docs/planning/db-sweep-migrations-173-183.json",
  "docs/planning/db-sweep-migrations-184-194.json",
];
const sweep = sweepFiles.flatMap(name => load(name).migrations);

test("historical MySQL snapshot never silently loses table/column inventory", () => {
  assert.equal(snapshot.tables.length, snapshot.counts.tables);
  const cols = snapshot.tables.reduce((sum, row) => sum + row.snapshotColumns.length, 0);
  assert.equal(cols, snapshot.counts.columns);
  assert.equal(new Set(snapshot.tables.map(t => t.name)).size, snapshot.tables.length);
});

test("V151 through V194 migration coverage is complete and numeric, not lexicographic", () => {
  const versions = sweep.map(s => Number(s.file.match(/^V(\d+)__/)[1])).sort((a,b)=>a-b);
  assert.deepEqual(versions, Array.from({length:44}, (_,i)=>151+i));
  assert.equal(sweep.length, expanded.counts.postSnapshotMigrationFiles);
  const created = sweep.reduce((sum, x) => sum + x.createTables.length, 0);
  assert.equal(created, expanded.counts.postSnapshotCreateTableStatements);
});

test("all reconstructed 199 candidates have exactly one domain audit owner", () => {
  const actual = expanded.tables.map(t => t.candidateNameAfterV194);
  assert.equal(new Set(actual).size, actual.length);
  assert.equal(actual.length, expanded.counts.uniquePhysicalTableCandidates);
  const queued = queue.rows.map(t => t.table);
  assert.deepEqual([...queued].sort(), [...actual].sort());
  assert.equal(queue.domainCounts.DB00_UNASSIGNED_TRIAGE, 0);
  for (const t of queue.rows) {
    assert.equal(t.reviewStatus, "NOT_AUDITED");
    assert.equal(t.activeVsRetired, "UNDECIDED");
    assert.ok(queue.groups[t.domain].includes(t.table));
  }
  for (const [domain,count] of Object.entries(queue.domainCounts))
    assert.equal(queue.groups[domain].length, count);
});

test("V193 recruiter table renames are not double-counted", () => {
  assert.equal(expanded.sourceRenamePairs.length, 7);
  const names = new Set(expanded.tables.map(t => t.candidateNameAfterV194));
  for (const [oldName,newName] of expanded.sourceRenamePairs) {
    assert.ok(names.has(newName), "Missing renamed table "+newName);
    assert.ok(!names.has(oldName), "Old name duplicated in reconstructed tables: "+oldName);
  }
});

test("all initial hotspot crosswalk entries remain accounted for in expanded registry", () => {
  assert.deepEqual(expanded.unaccountedPriorCrosswalkEntries, []);
  const backup = expanded.tables.filter(t => t.category === "HISTORICAL_BACKUP_VALIDATE_RETIREMENT");
  assert.equal(backup.length, expanded.counts.historicalBackupCandidateTables);
  assert.ok(backup.every(t => t.activeStatus === "NOT_VERIFIED"));
});

test("snapshot + post-snapshot CREATE counts preserve all candidate sources", () => {
  assert.equal(
    expanded.counts.baselineTables+expanded.counts.postSnapshotCreateTableStatements,
    expanded.counts.uniquePhysicalTableCandidates
  );
  assert.equal(expanded.tables.reduce((n,t)=>n+t.sourceColumns.length,0), expanded.counts.sourceColumnCandidates);
});
