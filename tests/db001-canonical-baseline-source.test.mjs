import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
const entry = journal.entries.find(item => item.tag === "0327_db001_canonical_metadata_baseline");
assert.ok(entry, "missing registered DB001 baseline");
const number = String(entry.idx).padStart(4, "0");
const snapshot = JSON.parse(readFileSync("drizzle/meta/" + number + "_snapshot.json", "utf8"));
const sql = readFileSync("drizzle/" + entry.tag + ".sql", "utf8");

test("DB001 registered typed baseline is a provenance-only migration, never generated DDL", () => {
  assert.equal(entry.tag, number + "_db001_canonical_metadata_baseline");
  assert.equal(snapshot.version, "7");
  assert.equal(snapshot.dialect, "postgresql");
  assert.ok(Object.keys(snapshot.tables).length >= 267);
  assert.equal(sql.replace(/--[^\n]*/g, "").trim(), "SELECT 1;");
  // Match only executable SQL: comments describing unsafe CREATE TABLE DDL\n  // must not trigger a false positive, but executable DDL still fails closed.\n  const executableSql = sql.replace(/--[^\\n]*/g, "").trim();\n  assert.doesNotMatch(executableSql, /\\b(?:CREATE|DROP|ALTER|TRUNCATE|INSERT|UPDATE|DELETE)\\s+(?:TABLE|INDEX|CONSTRAINT|FROM|INTO)/i);
  assert.equal(journal.entries.filter(x => x.tag === entry.tag).length, 1);
  for (const constraint of [
    "project_templates_current_version_snapshot_fk",
    "project_templates_published_version_snapshot_fk",
  ]) {
    assert.equal(snapshot.tables["public.project_templates"].foreignKeys[constraint], undefined,
      "SQL-only DEFERRABLE constraints must be physical PG guards, not invented Drizzle v7 constraints");
    assert.match(readFileSync("drizzle/0316_db07_template_version_integrity.sql", "utf8"),
      new RegExp("ADD CONSTRAINT " + constraint + "[\\s\\S]*?DEFERRABLE INITIALLY DEFERRED"));
  }
});
