import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const load = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const index = load("docs/planning/database-parity-pass4-column-index.json");
const diff = load("docs/planning/database-parity-pass4-structural-diff.json");
const provenance = load("docs/planning/database-parity-pass4-active-retired-triage.json");
const decisions = load("docs/planning/database-parity-pass4-review-decisions.json");
const tracker = load("docs/planning/database-parity-five-pass-tracker.json");
const registry = load("docs/planning/database-parity-expanded-legacy-registry.json");
const domains = index.artifacts.map(a => load(a.path));
const source = [
  "151-161","162-172","173-183","184-194",
].flatMap(range => load("docs/planning/db-pass4-raw-ddl-"+range+".json").migrations);

test("all 199 source candidates and every derived field appear in domain ledgers", () => {
  const tables = domains.flatMap(g => g.tables);
  assert.equal(tables.length,199);
  assert.equal(new Set(tables.map(t=>t.table)).size,199);
  assert.equal(tables.reduce((n,t)=>n+t.rows.length,0),index.sourceFields);
  assert.equal(index.sourceFields,2829);
  assert.equal(index.trackedTables,registry.tables.length);
  const registryNames = registry.tables.map(t=>t.candidateNameAfterV194).sort();
  assert.deepEqual(tables.map(t=>t.table).sort(),registryNames);
  for (const domain of domains) {
    const actual = domain.tables.reduce((n,t)=>n+t.rows.length,0);
    assert.equal(actual,index.domainCounts[domain.domain].fields);
  }
});

test("source operations reconcile with 44 migrations, 62 tables and 85 additions", () => {
  assert.equal(source.length,44);
  assert.equal(source.reduce((n,m)=>n+m.create.length,0),62);
  assert.equal(source.reduce((n,m)=>n+m.create.reduce((a,t)=>a+t.fields.length,0),0),606);
  assert.equal(index.sourceAlters.ADD_COLUMN,85);
  assert.equal(index.sourceAlters.RENAME_COLUMN,13);
  assert.equal(index.sourceAlters.MODIFY_COLUMN,6);
  assert.equal(index.sourceAlters.OTHER_ALTER,25);
  assert.equal(2138+606+85, index.sourceFields);
});

test("name matches are explicitly hypotheses and never semantic proof", () => {
  const rows=domains.flatMap(d=>d.tables.flatMap(t=>t.rows));
  const structural=rows.filter(r=>r.candidateExactNameMatches.length);
  assert.equal(structural.length,321);
  assert.equal(diff.stats.legacySourceFieldsWithNameMatch,321);
  assert.equal(diff.matches.length,331);
  assert.ok(diff.matches.every(r=>r.verification==="STRUCTURAL_NAME_MATCH_ONLY"));
  assert.ok(rows.every(r=>r.verifiedMapping===null&&r.validationEvidence===null));
  assert.equal(diff.stats.sourceFieldsWithoutNameMatch, 2508);
});

test("nullable/type observations are reviews not automatic regressions", () => {
  const obs=diff.stats.typeAndNullableObservations;
  assert.equal(obs.LEGACY_INTEGER_TO_UUID_KEY_REDESIGN,106);
  assert.equal(obs.LEGACY_NULLABLE_TARGET_REQUIRED,96);
  assert.equal(obs.TIMESTAMP_TIMEZONE_CONVERSION_REVIEW,112);
  assert.equal(obs.DATE_ONLY_BOUNDARY_SEMANTICS_REVIEW,3);
  assert.equal(diff.stats.candidateMappedTables,58);
  assert.equal(diff.stats.unmappedSourceTables,141);
});

test("all historical and unclear physical tables require explicit retirement review", () => {
  assert.equal(provenance.rows.length,199);
  assert.equal(provenance.summary.historicBackup,31);
  assert.equal(provenance.summary.smrithi,7);
  assert.equal(provenance.summary.jpaEntitiesWithKnownTable,111);
  assert.ok(provenance.rows.every(r=>r.retirementDecision==="UNDECIDED"));
  assert.ok(provenance.rows.every(r=>!r.verified));
});

test("pass 4 findings open; pass 5 must not start in this batch", () => {
  assert.equal(decisions.decisions.length,18);
  assert.ok(decisions.decisions.every(d=>d.status==="OPEN_NEEDS_IMPLEMENTATION_AND_EVIDENCE"&&!d.approvedRetirement));
  assert.equal(tracker.passes[3].status,"SOURCE_FIELD_SWEEP_DONE_UNVERIFIED");
  assert.equal(tracker.passes[4].status,"NOT_STARTED");
});
