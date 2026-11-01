import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = path => JSON.parse(readFileSync(new URL("../" + path, import.meta.url), "utf8"));
const inventory = read("docs/planning/db-pass4-columns-db01_identity_and_tenancy.json");
const ledger = read("docs/planning/db019-p04-college-tenant-field-review.json");
const tracker = read("docs/tracker.json");
const task = tracker.tasks.find(item => item.id === "DB-019");
const package04 = task?.workPlan?.packages.find(item => item.id === "DB19-P04");
const tableCounts = new Map([
  ["college", 17], ["college_branding", 15], ["department", 8],
  ["organization", 5], ["tenant_domain", 13],
]);
const key = entry => entry.sourceTable + "." + entry.sourceColumn;

test("P04 ledger exactly accounts for every frozen original DB01 table/field once", () => {
  assert.ok(package04);
  assert.equal(ledger.recordType, "EXACT_SOURCE_PROPOSALS_NOT_ACCEPTED_FIELD_DISPOSITIONS");
  assert.equal(ledger.id, package04.id);
  assert.equal(ledger.inventory, package04.sourceInventory);
  assert.equal(ledger.sourceSha, inventory.sourceSha);
  assert.equal(ledger.sourceSha, task.workPlan.frozenLegacyBackendSha);
  assert.deepEqual(ledger.sourceTables, [...tableCounts.keys()]);
  assert.deepEqual(package04.sourceTables, [...tableCounts.keys()]);
  assert.equal(ledger.sourceFieldCount, 58);
  assert.equal(ledger.proposalCount, 58);
  assert.equal(package04.sourceFieldCount, 58);
  assert.equal(ledger.fields.length, 58);
  const inventoryRows = inventory.tables.filter(table => tableCounts.has(table.table))
    .flatMap(table => {
      assert.equal(table.rows.length, tableCounts.get(table.table), table.table);
      return table.rows.map(row => ({
        sourceTable: table.table, sourceColumn: row.legacyColumn,
        sourceType: row.sourceType, sourceDefinition: row.sourceDefinition,
        sourceRiskFlags: row.riskFlags,
      }));
    });
  assert.equal(inventoryRows.length, 58);
  const expected = new Map(inventoryRows.map(row => [key(row), row]));
  assert.equal(expected.size, 58);
  const actual = new Map(ledger.fields.map(row => [key(row), row]));
  assert.equal(actual.size, 58, "duplicate source identities are forbidden");
  assert.deepEqual([...actual.keys()].sort(), [...expected.keys()].sort());
  for (const [id, source] of expected) {
    const decision = actual.get(id);
    assert.equal(decision.sourceType, source.sourceType, id);
    assert.equal(decision.sourceDefinition, source.sourceDefinition, id);
    assert.deepEqual(decision.sourceRiskFlags, source.sourceRiskFlags, id);
    assert.equal(typeof decision.reviewNeeded, "string", id);
    assert.ok(decision.reviewNeeded.length > 50, id);
  }
});

test("P04 never disguises unmatched department chair fields as retired or accepted", () => {
  const unresolved = [
    "department.dept_chair_id", "department.dept_vice_chair_id",
  ];
  assert.deepEqual([...ledger.unresolvedActiveRoleFields].sort(), unresolved.sort());
  for (const row of ledger.fields) {
    const isUnresolved = unresolved.includes(key(row));
    assert.equal(row.proposedTarget === null, isUnresolved, key(row));
    assert.equal(row.sourceDecision === "UNRESOLVED_ACTIVE_ROLE_CONTRACT", isUnresolved, key(row));
    if (!isUnresolved) {
      assert.equal(typeof row.proposedTarget, "string", key(row));
      assert.ok(row.proposedTarget.trim().length >= 10, key(row));
    }
    assert.equal(row.retirementApproved, false, key(row));
  }
});

test("P04 department leadership decisions preserve source-based unresolved product choice", () => {
  const unresolved = ledger.fields.filter(row =>
    row.sourceTable === "department" &&
    ["dept_chair_id", "dept_vice_chair_id"].includes(row.sourceColumn));
  assert.equal(unresolved.length, 2);
  for (const row of unresolved) {
    assert.equal(row.sourceStatus, "BACKEND_COMPAT_ONLY_FRONTEND_PRODUCT_FIELD_RETIRED");
    assert.equal(row.productRetirementDecision, "UNAPPROVED");
    assert.match(row.sourceBehavior, /same college/);
    assert.match(row.legacyBackendProof, /DepartmentServiceImpl/);
    assert.match(row.legacyFrontendProof, /Departments\.js/);
    assert.equal(row.proposedTarget, null);
    assert.equal(row.runtimeVerified, false);
  }
});

test("P04 explicitly preserves private evidence and unresolved runtime verification", () => {
  const privateFields = [
    "college.logo", "college_branding.logo_url",
    "tenant_domain.verification_token", "tenant_domain.last_found_values",
  ];
  for (const row of ledger.fields) {
    const isPrivate = privateFields.includes(key(row));
    assert.equal(row.sourceDecision === "PROPOSED_PRIVACY_SAFE_REDESIGN", isPrivate, key(row));
    assert.equal(row.runtimeVerified, false, key(row));
    assert.equal(row.producerVerified, false, key(row));
    assert.equal(row.consumerVerified, false, key(row));
  }
  assert.equal(ledger.runtimeVerifiedCount, 0);
  assert.ok(ledger.pendingGates.some(gate => gate.includes("tenant")));
  assert.ok(ledger.pendingGates.some(gate => gate.includes("chair")));
});

test("P04 source triage is not DB19 acceptance and cannot inflate 79/81", () => {
  assert.equal(package04.picked, true);
  assert.ok(package04.pickedBy);
  assert.equal(package04.done, false);
  assert.equal(package04.acceptedAt, null);
  assert.deepEqual(package04.acceptanceEvidence, []);
  assert.equal(task.done, false);
});
