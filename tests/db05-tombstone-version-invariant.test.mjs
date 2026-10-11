import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(
  new URL("../scripts/sql/db05-tombstone-version-invariant.draft.sql", import.meta.url),
  "utf8",
);
const cascade = readFileSync(
  new URL("../scripts/sql/db05-lesson-content-soft-delete-cascade.draft.sql", import.meta.url),
  "utf8",
);
const versions = readFileSync(
  new URL("../scripts/sql/db05-version-progress-attempts.draft.sql", import.meta.url),
  "utf8",
);
const manifest = JSON.parse(readFileSync(
  new URL("../docs/planning/db05-migration-readiness-manifest.json", import.meta.url),
  "utf8",
));

test("DB05 tombstone version guard is unregistered and depends on version and tombstone columns", () => {
  assert.match(sql, /UNREGISTERED SOURCE-ONLY COMPANION/);
  assert.match(sql, /db05-version-progress-attempts\.draft\.sql/);
  assert.match(sql, /db05-course-soft-delete-guard\.draft\.sql/);
  assert.match(sql, /db05-lesson-content-soft-delete-cascade\.draft\.sql/);
  for (const table of ["courses", "course_lessons", "lesson_contents"]) {
    assert.match(versions, new RegExp(`ALTER TABLE ${table}\\s+ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0`));
  }
});

test("real deletion/restore changes bump optimistic version only once", () => {
  assert.match(sql, /OLD\.legacy_deleted_at IS NOT DISTINCT FROM NEW\.legacy_deleted_at/);
  assert.match(sql, /IF NEW\.version = OLD\.version THEN/);
  assert.match(sql, /NEW\.version := OLD\.version \+ 1/);
  assert.match(sql, /ELSIF NEW\.version = OLD\.version \+ 1 THEN/);
  assert.match(sql, /tombstone mutation must advance optimistic version once/);
  assert.match(cascade, /version = c\.version \+ 1/);
  assert.match(cascade, /AND c\.legacy_deleted_at IS NULL/);
});

test("exactly one scoped tombstone before-update trigger exists for each table", () => {
  const triggers = [
    "db05_courses_tombstone_version_before_update",
    "db05_course_lessons_tombstone_version_before_update",
    "db05_lesson_contents_tombstone_version_before_update",
  ];
  for (const name of triggers) {
    assert.equal(sql.split(`CREATE TRIGGER ${name}`).length, 2, name);
  }
  assert.equal((sql.match(/BEFORE UPDATE OF legacy_deleted_at ON/g) ?? []).length, 3);
  assert.equal((sql.match(/^[ \\t]*COMMIT;[ \\t]*$/gm) ?? []).length, 1);
});

test("14 PostgreSQL race/negative cases are enumerated and not passed by source-only work", () => {
  for (let caseNumber = 1; caseNumber <= 14; caseNumber += 1) {
    const id = `TV-${String(caseNumber).padStart(2, "0")}`;
    assert.ok(sql.includes(id), id);
  }
  const companion = manifest.crossDomainCompanions.find(
    (item) => item.id === "DB05_TOMBSTONE_OPTIMISTIC_VERSION_GUARD",
  );
  assert.ok(companion, "W01 must explicitly register this candidate before DB05 ready");
  assert.equal(companion.registered, false);
  assert.equal(companion.postgresExecuted, false);
  assert.equal(companion.readyForProduction, false);
  const gate = manifest.gates.find((item) => item.id === "DB05_TOMBSTONE_CAS_RACE_PG_NEGATIVE");
  assert.ok(gate);
  assert.equal(gate.status, "NOT_RUN");
});
