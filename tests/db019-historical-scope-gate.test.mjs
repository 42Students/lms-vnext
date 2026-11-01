import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { collectRuntimeFiles, inspectHistoricalPackages } from
  "../scripts/db019-historical-scope-gate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = p => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const base = {
  source: load("docs/planning/db-pass4-columns-db00_historical_and_engine.json"),
  disposition: load("docs/planning/db00-historical-engine-disposition.json"),
  approval: load("docs/planning/db003-smrithi-vnext-scope-decision.json"),
  packages: load("docs/tracker.json").tasks.find(t => t.id === "DB-019").workPlan.packages,
  journal: load("drizzle/meta/_journal.json"),
  runtimeFiles: [
    { path: "src/modules/example.ts", content: "export const enabled = true;" },
    { path: "drizzle/0000_example.sql", content: "CREATE TABLE example(id int);" },
  ],
};
const run = delta => inspectHistoricalPackages({ ...base, ...delta });
const codes = result => result.errors.map(e => e.code);

test("DB19 P01 and P02 source gate partitions all 732 fields without claiming runtime proof", () => {
  const result = run();
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.counts["DB19-P01"], { tables: 32, fields: 641 });
  assert.deepEqual(result.counts["DB19-P02"], { tables: 7, fields: 91 });
  assert.equal(result.sourceOnly, true);
  assert.equal(result.postgresVerified, false);
  assert.equal(result.verifiedAbsenceOfExternalConsumers, false);
  assert.equal(result.verifiedAbsenceOfLegacyRuntimeConsumers, false);
});

test("P01/P02 reject duplicate legacy source field even when table totals appear unchanged", () => {
  const source = structuredClone(base.source);
  const rows = source.tables[0].rows;
  rows[1] = structuredClone(rows[0]);
  assert.ok(codes(run({ source })).includes("DB19_HISTORIC_DUPLICATE_SOURCE_FIELD"));
});

test("P01/P02 reject wrongly attached field or missing semantics despite valid row count", () => {
  const source = structuredClone(base.source);
  source.tables[0].rows[0].legacyTable = "smrithi_application";
  assert.ok(codes(run({ source })).includes("DB19_HISTORIC_INVALID_SOURCE_FIELD"));
  source.tables[0].rows[0].legacyTable = source.tables[0].table;
  source.tables[0].rows[0].sourceDefinition = "";
  assert.ok(codes(run({ source })).includes("DB19_HISTORIC_INVALID_SOURCE_FIELD"));
});

test("P01/P02 reject missing fields, source-decision drift and package reclassification", () => {
  const source = structuredClone(base.source);
  source.tables[0].rows.pop();
  assert.ok(codes(run({ source })).includes("DB19_HISTORIC_FIELD_COUNT_DRIFT"));
  const packages = structuredClone(base.packages);
  const p01 = packages.find(p => p.id === "DB19-P01");
  const p02 = packages.find(p => p.id === "DB19-P02");
  p01.sourceTables.push(p02.sourceTables.shift());
  assert.ok(codes(run({ packages })).includes("DB19_HISTORIC_WRONG_TABLE_CLASS_OR_DISPOSITION"));
});

test("P01 cannot disguise a backup as Flyway metadata by changing two matching ledgers", () => {
  const source = structuredClone(base.source);
  const disposition = structuredClone(base.disposition);
  const backup = source.tables.find(t => t.table !== "flyway_schema_history" &&
    t.sourceTableClass === "HISTORICAL_BACKUP_VALIDATE_RETIREMENT");
  backup.sourceTableClass = "SCHEMA_TOOL_METADATA";
  const decision = disposition.tables.find(d => d.table === backup.table);
  decision.sourceClass = "SCHEMA_TOOL_METADATA";
  decision.disposition = "REPLACED_BY_PLATFORM_MIGRATION_METADATA";
  assert.ok(codes(run({ source, disposition })).includes("DB19_HISTORIC_FLYWAY_CLASS_DRIFT"));
});

test("P01 preserves 93 uncertain source-default nullability values without upgrading them", () => {
  const historicalUncertain = base.source.tables.flatMap(t => t.rows)
    .filter(f => f.nullable === "SOURCE_DEFAULT_NULLABILITY_REVIEW");
  assert.equal(historicalUncertain.length, 93);
  const malformed = structuredClone(base.source);
  malformed.tables[0].rows[0].nullable = "ASSUMED_NOT_NULL";
  assert.ok(codes(run({ source: malformed })).includes("DB19_HISTORIC_INVALID_SOURCE_FIELD"));
});

test("P02 cannot infer product retirement approval from an unverified source search", () => {
  const approval = structuredClone(base.approval);
  approval.authority = "CODE_SEARCH";
  assert.ok(codes(run({ approval })).includes("DB19_HISTORIC_ORIGINAL_DISPOSITION_INVALID"));
  const unauthorised = structuredClone(base.approval);
  unauthorised.legacyProductionMutationAuthorized = true;
  assert.ok(codes(run({ approval: unauthorised })).includes("DB19_HISTORIC_APPROVAL_BOUNDARY_CHANGED"));
});

test("P01 requires a real Drizzle PostgreSQL journal, not Flyway metadata", () => {
  const journal = structuredClone(base.journal);
  journal.dialect = "mysql";
  assert.ok(codes(run({ journal })).includes("DB19_HISTORIC_DRIZZLE_JOURNAL_MISSING_OR_INVALID"));
  journal.dialect = "postgresql";
  journal.entries[1].idx = 2000;
  assert.ok(codes(run({ journal })).includes("DB19_HISTORIC_DRIZZLE_JOURNAL_MISSING_OR_INVALID"));
});

test("live references to retired tables or a missing runtime scan fail closed", () => {
  const runtimeFiles = structuredClone(base.runtimeFiles);
  runtimeFiles[0].content = "select * from smrithi_application";
  runtimeFiles[1].content = "CREATE TABLE flyway_schema_history(id int);";
  const result = run({ runtimeFiles });
  assert.ok(result.errors.filter(e => e.code === "DB19_HISTORIC_LIVE_TABLE_REFERENCE").length >= 2);
  assert.ok(codes(run({ runtimeFiles: [runtimeFiles[0]] }))
    .includes("DB19_HISTORIC_RUNTIME_SCAN_INCOMPLETE"));
  assert.ok(codes(run({ runtimeFiles: [] }))
    .includes("DB19_HISTORIC_RUNTIME_SCAN_INCOMPLETE"));
});

test("repo live source/registered SQL has no static references to P01/P02 retired tables", () => {
  const runtimeFiles = collectRuntimeFiles(root);
  assert.ok(runtimeFiles.some(x => x.path.startsWith("src/")));
  assert.ok(runtimeFiles.some(x => x.path.startsWith("drizzle/")));
  const result = run({ runtimeFiles });
  assert.equal(result.valid, true, JSON.stringify(result.errors.slice(0, 10)));
  assert.ok(result.scannedRuntimeFiles > 1);
});

test("CLI runs on a fixture checkout and returns a failure status for an injected live dependency", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "db019-historic-"));
  const write = (relative, content) => {
    const dest = path.join(directory, relative);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
  };
  try {
    for (const [key, filename] of [
      ["source", "docs/planning/db-pass4-columns-db00_historical_and_engine.json"],
      ["disposition", "docs/planning/db00-historical-engine-disposition.json"],
      ["approval", "docs/planning/db003-smrithi-vnext-scope-decision.json"],
      ["journal", "drizzle/meta/_journal.json"],
    ]) write(filename, JSON.stringify(base[key]));
    write("docs/tracker.json", JSON.stringify({ tasks: [
      { id: "DB-019", workPlan: { packages: base.packages } },
    ] }));
    write("src/modules/consumer.ts", "export const ok = true;");
    write("drizzle/0000_safe.sql", "CREATE TABLE safe(id int);");
    const command = path.join(root, "scripts/db019-historical-scope-gate.mjs");
    const okay = spawnSync(process.execPath, [command, directory], { encoding: "utf8" });
    assert.equal(okay.status, 0, okay.stderr + okay.stdout);
    write("src/modules/consumer.ts", "const query = 'select * from smrithi_college';");
    const rejected = spawnSync(process.execPath, [command, directory], { encoding: "utf8" });
    assert.equal(rejected.status, 2, rejected.stderr + rejected.stdout);
    assert.ok(JSON.parse(rejected.stdout).errors.some(x =>
      x.code === "DB19_HISTORIC_LIVE_TABLE_REFERENCE"));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
