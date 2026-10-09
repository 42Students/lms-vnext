import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const load = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const jpa = load("docs/planning/database-parity-jpa-entity-census.json");
const reg = load("docs/planning/database-parity-expanded-legacy-registry.json");
const rename = load("docs/planning/database-parity-recruiter-rename-ledger.json");
const source = load("docs/planning/database-parity-source-inventory.json");

test("all 118 production model files inspected with no source-fetch gaps", () => {
  assert.equal(jpa.entries.length, source.legacyCandidateJavaTypes.length);
  assert.equal(new Set(jpa.entries.map(e => e.path)).size, jpa.entries.length);
  assert.deepEqual(
    jpa.entries.map(e => e.path).sort(),
    source.legacyCandidateJavaTypes.map(e => e.path).sort()
  );
  assert.ok(jpa.entries.every(e => !e.error), "Transient fetch errors must be retried");
  assert.equal(jpa.entries.filter(e => e.kind === "ENTITY").length, jpa.counts.entities);
  assert.equal(jpa.counts.entities+jpa.counts.mappedSuperclasses+jpa.counts.nonEntityValueTypes,jpa.entries.length);
});

test("explicit Java entity table declarations do not disappear from reconstructed legacy registry", () => {
  const known = new Set(reg.tables.flatMap(t => [t.legacyNameAtSnapshot.toLowerCase(), t.candidateNameAfterV194.toLowerCase()]));
  for (const e of jpa.entries.filter(x => x.kind === "ENTITY" && x.table))
    assert.ok(known.has(e.table.toLowerCase()), "Missing JPA table: "+e.table+" in "+e.path);
  assert.deepEqual(jpa.unresolvedExplicitTableNames, []);
});

test("JPA implicit persistence structures remain in the audit queue", () => {
  const user = jpa.entries.find(e => e.path.endsWith("/model/User.java"));
  const recruiter = jpa.entries.find(e => e.path.endsWith("/model/RecruiterCollegeAccess.java"));
  assert.ok(user && user.joins > 0, "USER_ROLES JoinTable not identified");
  assert.ok(recruiter && recruiter.elements > 0, "Recruiter capabilities ElementCollection not identified");
  assert.ok(jpa.implicitEntityTableNaming.some(p => p.endsWith("/StudentImage.java")));
});

test("V193 explicit recruiter renames include 7 table and 13 column pairs", () => {
  assert.equal(rename.tableRenames.length, 7);
  assert.equal(rename.columnRenames.length, 13);
  assert.equal(new Set(rename.tableRenames.map(r => r.oldName)).size, 7);
  assert.equal(new Set(rename.columnRenames.map(r => r.table+"."+r.old)).size, 13);
  const physicalNames = new Set(reg.tables.map(t => t.candidateNameAfterV194));
  for (const item of rename.tableRenames) {
    assert.ok(physicalNames.has(item.newName));
    assert.ok(!physicalNames.has(item.oldName));
  }
});

test("no entity or table row can be marked verified from a source-only audit", () => {
  assert.ok(reg.tables.every(t => t.physicalSchemaVerified === false));
  assert.ok(reg.tables.every(t => t.fieldAuditStatus !== "VERIFIED"));
});
