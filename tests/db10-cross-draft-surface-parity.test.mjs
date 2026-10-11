import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// These explicit pairs have SQL and Drizzle draft copies that Chat 1 may
// integrate later. This checks named objects and index UNIQUENESS only.
// It does NOT compare CHECK expressions, index column order, FKs, triggers,
// PL/pgSQL execution, migration registration, or runtime safety.
const pairs = [
  ["src/db/schema/db10-general-notices.draft.ts", "scripts/sql/db10-general-notices-staging.sql"],
  ["src/db/schema/db10-log-alerts.draft.ts", "scripts/sql/db10-log-alerts-staging.sql"],
  ["src/db/schema/db10-skills-catalog.draft.ts", "scripts/sql/db10-skills-catalog-staging.sql"],
];
const capture = (s, re, pick = (m) => m[1]) => [...s.matchAll(re)].map(pick);
const dupes = (names) => [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];

export function compareNamedSurfaces(schema, sql, label) {
  const draftTables = capture(schema, /\bpgTable\(\s*["']([^"']+)["']/g);
  const sqlTables = capture(sql, /^\s*CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gim, (m) => m[1].toLowerCase());
  const draftChecks = capture(schema, /\bcheck\(\s*["']([^"']+)["']/g);
  const sqlChecks = capture(sql, /^\s*CONSTRAINT\s+([a-z_][a-z0-9_]*)\s+CHECK\s*\(/gim, (m) => m[1].toLowerCase());
  const draftIndexes = capture(schema, /\b(uniqueIndex|index)\(\s*["']([^"']+)["']/g,
    (m) => [m[2], m[1] === "uniqueIndex" ? "UNIQUE" : "NORMAL"]);
  const sqlIndexes = capture(sql, /^\s*CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)\b/gim,
    (m) => [m[2].toLowerCase(), m[1] ? "UNIQUE" : "NORMAL"]);
  const equalNames = (group, a, b) => {
    assert.deepEqual(dupes(a), [], label + ": duplicate " + group + " in Drizzle draft");
    assert.deepEqual(dupes(b), [], label + ": duplicate " + group + " in staged SQL");
    assert.deepEqual(a.toSorted(), b.toSorted(), label + ": " + group + " Drizzle/SQL drift");
  };
  assert.ok(draftTables.length, label + ": no draft tables");
  assert.ok(draftChecks.length, label + ": no draft checks");
  assert.ok(draftIndexes.length, label + ": no draft indexes");
  equalNames("tables", draftTables, sqlTables);
  equalNames("checks", draftChecks, sqlChecks);
  equalNames("indexes and uniqueness", draftIndexes.map(JSON.stringify), sqlIndexes.map(JSON.stringify));
  return {tables: draftTables.length, checks: draftChecks.length, indexes: draftIndexes.length};
}

for (const [draft, stage] of pairs) {
  test("DB10 draft/SQL named surface parity: " + draft, () => {
    const schema = readFileSync(draft, "utf8");
    const sql = readFileSync(stage, "utf8");
    assert.match(schema, /DRAFT ONLY/);
    assert.match(sql, /STAGING ONLY|STAGED SQL/i);
    compareNamedSurfaces(schema, sql, draft);
  });
}

const ts = "const t = pgTable('fixture_table', {}, () => [check('fixture_valid_ck', null), uniqueIndex('fixture_unique_uq'), index('fixture_read_idx')]);";
const sql = ["CREATE TABLE fixture_table (", "id uuid,", "CONSTRAINT fixture_valid_ck CHECK (true)", ");",
  "CREATE UNIQUE INDEX fixture_unique_uq ON fixture_table (id);",
  "CREATE INDEX fixture_read_idx ON fixture_table (id);"].join("\n");

test("fixture: matched named surfaces pass", () => {
  assert.deepEqual(compareNamedSurfaces(ts, sql, "fixture"), {tables:1, checks:1, indexes:2});
});
test("fixture: changed or removed named constraint fails", () => {
  assert.throws(() => compareNamedSurfaces(ts, sql.replace("CONSTRAINT fixture_valid_ck CHECK (true)", ""), "missing"), /checks Drizzle\/SQL drift/);
  assert.throws(() => compareNamedSurfaces(ts.replace("fixture_valid_ck", "other_ck"), sql, "renamed"), /checks Drizzle\/SQL drift/);
});
test("fixture: changed index uniqueness in either direction fails", () => {
  assert.throws(() => compareNamedSurfaces(ts, sql.replace("CREATE UNIQUE INDEX fixture_unique_uq", "CREATE INDEX fixture_unique_uq"), "weakened"), /indexes and uniqueness Drizzle\/SQL drift/);
  assert.throws(() => compareNamedSurfaces(ts.replace("index('fixture_read_idx')", "uniqueIndex('fixture_read_idx')"), sql, "tightened"), /indexes and uniqueness Drizzle\/SQL drift/);
});
test("fixture: duplicate CREATE declarations and mismatched tables fail", () => {
  assert.throws(() => compareNamedSurfaces(ts + ts, sql, "dupe draft"), /duplicate tables in Drizzle draft/);
  assert.throws(() => compareNamedSurfaces(ts, sql + "\n" + sql, "dupe SQL"), /duplicate tables in staged SQL/);
  assert.throws(() => compareNamedSurfaces(ts.replace("fixture_table", "different_table"), sql, "name"), /tables Drizzle\/SQL drift/);
});
