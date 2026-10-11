import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const sql = fs.readFileSync(
  "docs/planning/sql/db06-quiz-shuffle-parity-candidate.sql",
  "utf8",
);
const contract = fs.readFileSync(
  "docs/planning/database-parity-db06-quiz-shuffle-contract.md",
  "utf8",
);
const ledger = JSON.parse(
  fs.readFileSync(
    "docs/planning/database-parity-db06-field-reconciliation.json",
    "utf8",
  ),
);
const schema = fs.readFileSync("src/db/schema/quizzes.ts", "utf8");
const journal = JSON.parse(
  fs.readFileSync("drizzle/meta/_journal.json", "utf8"),
);

test("DB041 remains source-only until migration integration", () => {
  assert.match(sql, /SOURCE-ONLY CANDIDATE/);
  assert.equal(
    journal.entries.some((entry) => /quiz.*shuffle|db041|db41/i.test(entry.tag)),
    false,
  );
  assert.doesNotMatch(schema, /shuffleQuestions|shuffle_questions/);
  assert.doesNotMatch(schema, /shuffleOptions|shuffle_options/);
});

test("DB041 stages exact false-default non-null shuffle columns", () => {
  assert.match(
    sql,
    /ADD COLUMN shuffle_questions boolean NOT NULL DEFAULT false/,
  );
  assert.match(
    sql,
    /ADD COLUMN shuffle_options boolean NOT NULL DEFAULT false/,
  );
  assert.match(contract, /Existing vNext rows backfill to `false\/false`/);
});

test("DB041 ledger resolves both active legacy gaps to staged fields", () => {
  const quizzes = ledger.tables.find(
    (table) => table.legacyTable === "quizzes",
  );
  assert.ok(quizzes);

  for (const fieldName of [
    "shuffle_questions",
    "shuffle_options",
  ]) {
    const field = quizzes.fields.find(
      (item) => item.legacyField === fieldName,
    );
    assert.equal(
      field.decision,
      "STAGED_TARGET_FIELD_RUNTIME_UNVERIFIED",
    );
    assert.equal(
      field.targetRef,
      `course_quizzes.${fieldName}`,
    );
    assert.equal(field.runtimeVerified, false);
    assert.match(
      field.validationEvidence,
      /db06-quiz-shuffle-parity-candidate\.sql/,
    );
  }
});

test("DB041 contract keeps learner permutation behavior out of DATABASE implementation", () => {
  assert.match(contract, /deterministic seed derived from quiz ID \+ learner\/viewer ID/);
  assert.match(contract, /does \*\*not\*\* implement API\/UI shuffling/);
  assert.match(contract, /does not mutate persisted authored `sequence` fields or correctness/);
  assert.match(contract, /does not freeze these flags after attempts/);
});

test("DB041 promotion matrix preserves DB038 independence", () => {
  for (let i = 1; i <= 7; i += 1) {
    assert.match(
      contract,
      new RegExp(`^\\s*${i}\\.\\s`, "m"),
      `missing DB041 promotion witness ${i}`,
    );
  }
  assert.match(contract, /DB-038 assessment-history guards/);
});
