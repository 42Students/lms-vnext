import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const sql = fs.readFileSync(
  "docs/planning/sql/db06-assignment-attempt-parity-candidate.sql",
  "utf8",
);
const contract = fs.readFileSync(
  "docs/planning/database-parity-db06-assignment-attempt-contract.md",
  "utf8",
);
const schema = fs.readFileSync("src/db/schema/assessments.ts", "utf8");
const service = fs.readFileSync(
  "src/modules/courses/assignment-submission-service.ts",
  "utf8",
);
const ledger = JSON.parse(
  fs.readFileSync(
    "docs/planning/database-parity-db06-field-reconciliation.json",
    "utf8",
  ),
);
const journal = JSON.parse(
  fs.readFileSync("drizzle/meta/_journal.json", "utf8"),
);

test("DB044 is an explicit no-DDL retirement decision", () => {
  assert.match(sql, /SOURCE-ONLY RETIREMENT CANDIDATE/);
  assert.match(sql, /NO DDL IS REQUIRED OR ALLOWED/);
  assert.doesNotMatch(
    sql,
    /^\s*(?:ALTER|CREATE|DROP|INSERT|UPDATE|DELETE)\s/mi,
  );
  assert.equal(
    journal.entries.some((entry) => /assignment.*attempt|db044|db44/i.test(entry.tag)),
    false,
  );
});

test("DB044 preserves vNext one-submission uniqueness", () => {
  assert.match(
    schema,
    /assignment_submissions_assignment_membership_uq/,
  );
  assert.match(
    schema,
    /\.on\([\s\S]*table\.assignmentId,[\s\S]*table\.membershipId[\s\S]*\)/,
  );
  assert.doesNotMatch(schema, /attemptNumber|attempt_number/);
  assert.doesNotMatch(schema, /semesterNumber|semester_number/);

  assert.match(
    service,
    /assignment_submissions_assignment_membership_uq/,
  );
  assert.match(service, /ASSIGNMENT_ALREADY_SUBMITTED/);
});

test("DB044 ledger retires dormant attempt_number and derives semester scope", () => {
  const assignment = ledger.tables.find(
    (table) => table.legacyTable === "student_assignment",
  );
  assert.ok(assignment);

  const attempt = assignment.fields.find(
    (field) => field.legacyField === "attempt_number",
  );
  assert.equal(
    attempt.decision,
    "DERIVED_METADATA_NOT_PERSISTED",
  );
  assert.match(
    attempt.targetRef,
    /assignment_submissions_assignment_membership_uq/,
  );

  const semester = assignment.fields.find(
    (field) => field.legacyField === "semester_number",
  );
  assert.equal(
    semester.decision,
    "NORMALIZED_RELATION_OR_DERIVED",
  );
  assert.match(
    semester.targetRef,
    /course_offerings\.academic_period_id/,
  );
});

test("DB044 contract distinguishes current behavior from historical intent", () => {
  assert.match(
    contract,
    /V28__student_assignment_unique_submission\.sql/,
  );
  assert.match(
    contract,
    /V57__student_assignment_semester\.sql/,
  );
  assert.match(
    contract,
    /current submit implementation does not read or write either field/,
  );
  assert.match(
    contract,
    /do not revive the old scalar fields ad hoc/i,
  );
});

test("DB044 acceptance retains grade and immutable-history companions", () => {
  for (let i = 1; i <= 6; i += 1) {
    assert.match(
      contract,
      new RegExp(`^\\s*${i}\\.\\s`, "m"),
      `missing DB044 acceptance witness ${i}`,
    );
  }
  assert.match(contract, /DB-035 grade history/);
  assert.match(contract, /DB-038 immutable submission payload/);
});
