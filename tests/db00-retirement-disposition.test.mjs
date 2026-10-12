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
      assert.equal(row.disposition, "RETIRE_VNEXT_USER_APPROVED");
      assert.equal(row.productApprovalId, "DB003-SMRITHI-VNEXT-EXCLUSION-2026-10-12");
      assert.equal(
        source.sourceTableClass,
        "LEGACY_SUBSYSTEM_NEEDS_PRODUCT_DECISION",
      );
    }
  }
});

test("DB00 records all seven Smrithi product exclusions with user approval", () => {
  const approved = disposition.tables
    .filter((row) => row.disposition === "RETIRE_VNEXT_USER_APPROVED")
    .map((row) => row.table)
    .sort();

  assert.equal(disposition.counts.tableDispositionsClosed, 39);
  assert.equal(disposition.counts.fieldCandidatesDispositionedByTableDecision, 732);
  assert.equal(disposition.counts.pendingProductDecisionTables, 0);
  assert.equal(disposition.counts.pendingProductDecisionFields, 0);
  assert.equal(disposition.counts.approvedProductRetiredTables, 7);
  assert.equal(disposition.counts.approvedProductRetiredFields, 91);
  assert.equal(disposition.counts.runtimeSemanticVerifiedFields, 0);
  assert.deepEqual(approved, [
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
  const approved = disposition.tables
    .filter((row) => row.disposition === "RETIRE_VNEXT_USER_APPROVED")
    .map((row) => row.table)
    .sort();
  const sourceByTable = new Map(inventory.tables.map((row) => [row.table, row]));
  const snapshotByTable = new Map(snapshot.tables.map((row) => [row.name, row]));

  assert.equal(smrithiEvidence.legacyBackendSha, inventory.sourceSha);
  assert.equal(snapshot.sourceSha, inventory.sourceSha);
  assert.deepEqual(smrithiEvidence.tables.map((row) => row.table).sort(), approved);
  assert.equal(smrithiEvidence.counts.tables, smrithiEvidence.tables.length);
  assert.equal(
    smrithiEvidence.counts.sourceFields,
    smrithiEvidence.tables.reduce((total, row) => total + row.fields.length, 0),
  );
  assert.equal(
    smrithiEvidence.counts.unprovenRetirementDecisions,
    approved.length,
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
    // This is the *historical source evidence*, intentionally not rewritten as
    // proof that legacy runtime consumers or physical table data vanished.
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

const approval = JSON.parse(readFileSync(
  "docs/planning/db003-smrithi-vnext-scope-decision.json", "utf8",
));
test("Smrithi retirement is vNext-only and explicitly user-authorized",()=>{
  assert.equal(approval.authority,"USER_EXPLICIT");
  assert.equal(approval.decision,"EXCLUDE_FROM_VNEXT");
  assert.equal(approval.appliesTo,"42Students/lms-vnext");
  assert.equal(approval.legacyProductionMutationAuthorized,false);
  assert.equal(approval.externalConsumerAbsenceProven,false);
  assert.equal(approval.counts.tables,7);
  assert.equal(approval.counts.fields,91);
  assert.deepEqual(
    approval.tables.map(t=>t.table).sort(),
    disposition.tables.filter(t=>t.disposition==="RETIRE_VNEXT_USER_APPROVED").map(t=>t.table).sort(),
  );
});
