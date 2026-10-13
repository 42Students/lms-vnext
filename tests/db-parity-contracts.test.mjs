import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const load = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const source = load("docs/planning/database-parity-source-inventory.json");
const crosswalk = load("docs/planning/database-parity-table-crosswalk.json");
const hotspot = load("docs/planning/database-parity-hotspot-legacy-ddl.json");
const ledger = load("docs/planning/database-parity-hotspot-field-ledger.json");

test("baselines are pinned; never silently compare moving branch names", () => {
  assert.equal(source.baseline.legacyBackend.sha, crosswalk.sourceLegacyBackendSha);
  assert.equal(crosswalk.sourceLegacyBackendSha, hotspot.legacySha);
  assert.equal(hotspot.legacySha, ledger.legacyBackendSha);
  assert.equal(source.baseline.vnext.sha, ledger.baselineVnextSha);
});

test("every sourced critical legacy CREATE TABLE has a table-level crosswalk row", () => {
  const mapped = new Set(crosswalk.tables.map(t => t.legacyTable));
  const sourceTables = hotspot.sourceMigrations.flatMap(m => m.declaredCreateTables.map(t => t.table));
  assert.equal(new Set(sourceTables).size, sourceTables.length);
  for (const name of sourceTables) assert.ok(mapped.has(name), "Untracked legacy table " + name);
});

test("every extracted legacy DDL field exists in the audit queue", () => {
  const keys = new Set(ledger.fields.map(f => f.legacyTable + "." + f.legacyColumn));
  assert.equal(keys.size, ledger.fields.length, "Duplicate extracted field key");
  let count = 0;
  for (const migration of hotspot.sourceMigrations) for (const table of migration.declaredCreateTables)
    for (const col of table.columns) { count++; assert.ok(keys.has(table.table + "." + col.name), "Missing " + table.table + "." + col.name); }
  assert.equal(count, ledger.counts.sourceCreatedColumns);
  assert.equal(ledger.counts.auditedFields, 0, "Do not increment audited field count without field mapping evidence");
});

test("claimed mappings must point to an existing vNext snapshot table", () => {
  const actual = new Set(source.vnextSnapshotTables.map(t => t.name));
  for (const row of crosswalk.tables) {
    assert.ok(crosswalk.statusVocabulary.includes(row.state), row.legacyTable + " unknown status");
    if (row.vnextTable) assert.ok(actual.has(row.vnextTable), row.legacyTable + " invalid target " + row.vnextTable);
    if (row.state === "GAP_CONFIRMED") assert.equal(row.vnextTable, null, "GAP row must not claim a mapped target");
    assert.notEqual(row.fieldAudit, "VERIFIED", "No field-audit verification exists yet");
  }
});

test("the snapshot inventory is internally consistent", () => {
  assert.equal(source.vnextSnapshotTables.length, source.summaries.vnextSnapshotTables);
  assert.equal(new Set(source.vnextSnapshotTables.map(t => t.name)).size, source.vnextSnapshotTables.length);
  const total = source.vnextSnapshotTables.reduce((s, t) => s + t.columns.length, 0);
  assert.ok(total > 0);
  assert.equal(source.vnextDrizzleMigrationFilePaths.length, source.summaries.vnextDrizzleMigrationFiles);
});

// Cross-domain migration staging guard. PostgreSQL requires AS $$...$$
// (or AS $tag$...$tag$). A JS string replacement once stripped a dollar
// from four DB01/DB09 trigger bodies, which the source behavior tests missed.
function malformedSqlDollarDelimiters(sql) {
  return [
    ...sql.matchAll(/\bAS\s+\$(?!\$|[A-Za-z_][A-Za-z_0-9]*\$)(?=\s|$)/gi),
    ...sql.matchAll(/\bEND\s+\$(?!\$|[A-Za-z_][A-Za-z_0-9]*\$)\s*;/gi),
  ].map(match => ({ offset: match.index, fragment: match[0] }));
}

test("staged and registered database SQL rejects lone-dollar function delimiters", () => {
  const paths = ["docs/planning/sql", "scripts/sql", "drizzle"].flatMap(directory =>
    fs.readdirSync(path.join(root, directory))
      .filter(filename => filename.endsWith(".sql"))
      .map(filename => path.join(directory, filename)),
  );
  assert.ok(paths.length >= 150, "staged/registered SQL inventory unexpectedly shrunk");
  for (const filename of paths) {
    const src = fs.readFileSync(path.join(root, filename), "utf8");
    assert.deepEqual(malformedSqlDollarDelimiters(src), [], filename);
  }
});

test("staged SQL delimiter detector rejects broken opener and closing quote", () => {
  assert.equal(malformedSqlDollarDelimiters(
    "CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $\nBEGIN RETURN NEW; END $$;",
  ).length, 1);
  assert.equal(malformedSqlDollarDelimiters(
    "CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$\nBEGIN RETURN NEW; END $;",
  ).length, 1);
  assert.deepEqual(malformedSqlDollarDelimiters(
    "CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$\nBEGIN RETURN NEW; END $$;",
  ), []);
  assert.deepEqual(malformedSqlDollarDelimiters(
    "CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $valid_tag$\nBEGIN RETURN NEW; END; $valid_tag$;",
  ), []);
});


test("DB05 browser fixture avoids eager server-only ordering imports while feature is disabled", () => {
  const service = fs.readFileSync(
    path.join(root, "src/modules/courses/lesson-content-service.ts"),
    "utf8",
  );
  const writer = fs.readFileSync(
    path.join(root, "src/modules/courses/lesson-content-order-service.ts"),
    "utf8",
  );
  assert.match(writer, /^import "server-only";/m, "Server-only boundary must remain intact");
  assert.doesNotMatch(
    service,
    /^import[^;]*["']\.\/lesson-content-order-service["'];/m,
    "Do not load the staged, server-only writer in ordinary lesson-service module initialization",
  );
  assert.match(service, /!deliveryId\s*\|\|\s*rows\.length\s*<=\s*1\s*\|\|\s*!lessonContentOrderRuntimeEnabled\(\)/);
  assert.match(service, /return rows;[\s\S]*await import\("\.\/lesson-content-order-service"\)/);
});
