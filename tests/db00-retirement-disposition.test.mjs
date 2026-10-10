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

const smrithiEvidence = JSON.parse(
  readFileSync(
    "docs/planning/db00-smrithi-source-evidence.json",
    "utf8",
  ),
);
const snapshot = JSON.parse(
  readFileSync(
    "docs/planning/database-parity-legacy-schema-snapshot.json",
    "utf8",
  ),
);

test("DB00 Smrithi source inventory preserves exact field and constraint evidence", () => {
  const pending = disposition.tables
    .filter((row) => row.disposition === "PENDING_PRODUCT_DECISION")
    .map((row) => row.table)
    .sort();
  const sourceByTable = new Map(inventory.tables.map((row) => [row.table, row]));
  const snapshotByTable = new Map(snapshot.tables.map((row) => [row.name, row]));

  assert.equal(smrithiEvidence.legacyBackendSha, inventory.sourceSha);
  assert.equal(snapshot.sourceSha, inventory.sourceSha);
  assert.deepEqual(smrithiEvidence.tables.map((row) => row.table).sort(), pending);
  assert.equal(smrithiEvidence.counts.tables, smrithiEvidence.tables.length);
  assert.equal(
    smrithiEvidence.counts.sourceFields,
    smrithiEvidence.tables.reduce((total, row) => total + row.fields.length, 0),
  );
  assert.equal(
    smrithiEvidence.counts.unprovenRetirementDecisions,
    pending.length,
  );

  for (const row of smrithiEvidence.tables) {
    const sourceRow = sourceByTable.get(row.table);
    const snapshotRow = snapshotByTable.get(row.table);
    assert.ok(sourceRow, "missing source census for " + row.table);
    assert.ok(snapshotRow, "missing SQL snapshot for " + row.table);
    assert.equal(row.sourceFieldCount, sourceRow.sourceFieldCount);
    assert.deepEqual(
      row.fields.map((field) => ({
        column: field.column,
        type: field.type,
        nullable: field.nullable,
        sourceDefinition: field.sourceDefinition,
        riskFlags: field.riskFlags,
      })),
      sourceRow.rows.map((field) => ({
        column: field.legacyColumn,
        type: field.sourceType,
        nullable: field.nullable,
        sourceDefinition: field.sourceDefinition,
        riskFlags: field.riskFlags || [],
      })),
      "source field evidence drift for " + row.table,
    );
    assert.deepEqual(
      row.declaredIndexAndConstraints,
      snapshotRow.indexAndConstraintClauses || [],
      "source unique/FK/index drift for " + row.table,
    );
    assert.equal(row.ledgerDisposition, "PENDING_PRODUCT_DECISION");
    assert.equal(row.safeToRetire, false);
    assert.equal(row.runtimeDbPresence, "NOT_VERIFIED");
    assert.equal(row.producerEvidence, "NOT_ESTABLISHED");
    assert.equal(row.consumerEvidence, "NOT_ESTABLISHED");
    assert.equal(row.vnextPersistenceDecision, "PENDING_PRODUCT_DECISION");
    for (const name of row.highPrioritySemantics) {
      assert.ok(
        row.fields.some((field) => field.column === name),
        "risk field missing from " + row.table + ": " + name,
      );
    }
    assert.ok(row.requiredNextEvidence.length >= 3);
  }
});
