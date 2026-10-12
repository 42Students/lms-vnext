import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const contract = JSON.parse(
  readFileSync(
    "docs/planning/db04-chat05-student-image-final-contract-2026-10-12.json",
    "utf8",
  ),
);

test("DB080 classifies student_image as active, never retired", () => {
  assert.equal(contract.task, "DB-080");
  assert.equal(
    contract.classification.disposition,
    "ACTIVE_CURRENT_PRODUCT_REDESIGNED_NORMALIZED",
  );
  assert.equal(contract.classification.retirementAllowed, false);
  assert.equal(contract.classification.sourceFieldCount, 3);
});

test("DB080 accounts for all three legacy table fields", () => {
  assert.deepEqual(
    contract.fieldMappings.map((x) => x.legacyField).sort(),
    [
      "student_image.id",
      "student_image.image_data",
      "student_image.learner_id",
    ],
  );
  assert.ok(
    contract.fieldMappings.every((x) => x.status === "STAGED_UNREGISTERED"),
  );
});

test("DB080 normalizes image_data instead of keeping arbitrary URL JSON", () => {
  const row = contract.fieldMappings.find(
    (x) => x.legacyField === "student_image.image_data",
  );
  assert.match(row.vnextTarget, /learner_profile_images/);
  assert.match(row.vnextTarget, /profile_private_document_receipts/);
  const url = contract.embeddedEntryMappings.find((x) => x.legacy === "imageUrl");
  assert.match(url.rule, /must not be an arbitrary client URL/i);
});

test("DB080 preserves deactivation as state, not hard delete", () => {
  const active = contract.embeddedEntryMappings.find(
    (x) => x.legacy === "active",
  );
  assert.match(active.target, /is_active/);
  assert.match(active.target, /deactivated_at/);
  assert.match(active.rule, /not hard delete/i);
});

test("DB080 keeps owner and private receipt scope fail-closed", () => {
  assert.ok(
    contract.requiredDatabaseInvariants.some((x) =>
      x.includes("receipt_id + learner_membership_id + PROFILE_IMAGE"),
    ),
  );
  assert.ok(
    contract.requiredDatabaseInvariants.some((x) =>
      x.includes("cross-owner"),
    ),
  );
  assert.match(
    contract.apiCompatibility.find((x) => x.includes("Authorization")),
    /server-side/,
  );
});

test("DB080 never overstates registration or runtime evidence", () => {
  assert.equal(contract.acceptance.sourceClassificationComplete, true);
  assert.equal(contract.acceptance.fieldMappingComplete, true);
  assert.equal(contract.acceptance.stagedSchemaExists, true);
  assert.equal(contract.acceptance.migrationRegistered, false);
  assert.equal(contract.acceptance.postgresExecuted, false);
  assert.equal(contract.acceptance.apiCutoverVerified, false);
  assert.equal(contract.acceptance.doneVerified, false);
});
