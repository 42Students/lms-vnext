import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8");
const candidate = read("../scripts/sql/db05-content-ancestry-with-content-guard.draft.sql");
const childGuard = read("../scripts/sql/db05-lesson-content-delivery-scope.draft.sql");
const priorOrderGuard = read("../scripts/sql/db05-content-order-upstream-reparent.draft.sql");
const readiness = JSON.parse(read("../docs/planning/db05-migration-readiness-manifest.json"));

test("DB05 authored-content reparent guard is standalone companion, never independently registered", () => {
  assert.match(candidate, /UNREGISTERED SOURCE-ONLY DRAFT/);
  assert.match(candidate, /W01 owns Drizzle registration/);
  assert.match(candidate, /CONTENT ancestry/);
  assert.match(candidate, /NO delivery-order overrides/);
  assert.doesNotMatch(candidate, /ALTER TABLE lesson_contents|DROP TABLE/);
});

test("five upstream ancestor relations refuse reparent while content exists", () => {
  const tables = {
    course_lessons: "learning_path_id",
    course_learning_paths: "offering_id",
    course_offerings: "course_id, cohort_id, academic_period_id",
    course_section_deliveries: "offering_id, section_id",
    sections: "cohort_id, academic_period_id",
  };
  for (const [table, columns] of Object.entries(tables)) {
    assert.match(candidate, new RegExp(`TG_TABLE_NAME = '${table}'`));
    assert.ok(candidate.includes(`BEFORE UPDATE OF ${columns} ON ${table}`), table);
  }
  assert.equal((candidate.match(/CREATE TRIGGER db05_authored_content_/g) ?? []).length, 5);
  assert.match(candidate, /FROM lesson_contents content/);
  assert.match(candidate, /content ancestry must not change while lesson content exists/);
  assert.match(candidate, /USING ERRCODE = '23514'/);
});

test("parent and child share advisory lock under READ COMMITTED for content visibility race", () => {
  for (const source of [candidate, childGuard, priorOrderGuard]) {
    assert.match(source, /pg_advisory_xact_lock\(605008003::bigint\)/);
    assert.match(source, /current_setting\('transaction_isolation'\) <> 'read committed'/);
  }
  assert.match(candidate, /UNEXECUTED/);
  assert.equal((candidate.match(/^[ \t]*COMMIT;[ \t]*$/gm) ?? []).length, 1);
});

test("content, not mere delivery-order overrides, blocks reparent", () => {
  assert.match(priorOrderGuard, /lesson_content_delivery_sequences order_row/);
  assert.doesNotMatch(candidate, /lesson_content_delivery_sequences order_row/);
  assert.match(candidate, /content\.lesson_id = OLD\.id/);
  assert.match(candidate, /content\.delivery_id = OLD\.id/);
  assert.match(candidate, /INNER JOIN lesson_contents content ON content\.lesson_id = lesson\.id/);
});

test("manifest requires actual W01/DB02 cross-consumer migration and 16 PG scenarios", () => {
  const companion = readiness.crossDomainCompanions.find(
    (item) => item.id === "DB05_AUTHORED_CONTENT_ANCESTRY_REPARENT",
  );
  assert.ok(companion);
  assert.equal(companion.registered, false);
  assert.equal(companion.postgresExecuted, false);
  assert.equal(companion.readyForProduction, false);
  const gate = readiness.gates.find((item) => item.id === "DB05_AUTHORED_CONTENT_REPARENT_PG_NEGATIVE");
  assert.ok(gate);
  assert.equal(gate.status, "NOT_RUN");
  for (let i = 1; i <= 16; i++) {
    assert.ok(candidate.includes(`CA-${String(i).padStart(2, "0")}`));
  }
});
