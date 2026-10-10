import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const inventory = JSON.parse(
  readFileSync(
    "docs/planning/db-pass4-columns-db00_historical_and_engine.json",
    "utf8",
  ),
);
const disposition = JSON.parse(
  readFileSync(
    "docs/planning/db00-historical-engine-disposition.json",
    "utf8",
  ),
);

test("DB00 disposition accounts for every source candidate exactly once", () => {
  assert.equal(disposition.tables.length, inventory.counts.tables);
  assert.equal(
    new Set(disposition.tables.map((row) => row.table)).size,
    inventory.counts.tables,
  );
  assert.deepEqual(
    disposition.tables.map((row) => row.table).sort(),
    inventory.tables.map((row) => row.table).sort(),
  );
});

test("DB00 retirement only covers source-classified backup/tooling rows", () => {
  const byName = new Map(
    inventory.tables.map((row) => [row.table, row]),
  );

  for (const row of disposition.tables) {
    const source = byName.get(row.table);
    assert.ok(source, "missing source row for " + row.table);

    if (row.disposition === "RETIRE_GREENFIELD_BACKUP") {
      assert.equal(
        source.sourceTableClass,
        "HISTORICAL_BACKUP_VALIDATE_RETIREMENT",
      );
    } else if (
      row.disposition === "REPLACED_BY_PLATFORM_MIGRATION_METADATA"
    ) {
      assert.equal(source.sourceTableClass, "SCHEMA_TOOL_METADATA");
      assert.equal(row.table, "flyway_schema_history");
    } else {
      assert.equal(row.disposition, "PENDING_PRODUCT_DECISION");
      assert.equal(
        source.sourceTableClass,
        "LEGACY_SUBSYSTEM_NEEDS_PRODUCT_DECISION",
      );
    }
  }
});

test("DB00 leaves exactly seven Smrithi product decisions open", () => {
  const open = disposition.tables
    .filter((row) => row.disposition === "PENDING_PRODUCT_DECISION")
    .map((row) => row.table)
    .sort();

  assert.equal(disposition.counts.tableDispositionsClosed, 32);
  assert.equal(
    disposition.counts.fieldCandidatesDispositionedByTableDecision,
    641,
  );
  assert.equal(disposition.counts.runtimeSemanticVerifiedFields, 0);
  assert.deepEqual(open, [
    "smrithi_application",
    "smrithi_college",
    "smrithi_college_keywords",
    "smrithi_education_type",
    "smrithi_notification_template",
    "smrithi_program",
    "smrithi_specialization",
  ]);
});
