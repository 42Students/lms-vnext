import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const sql = read("../scripts/sql/db05-lesson-discussion-ancestry-integrity.draft.sql");
const preflight = read("../scripts/sql/db05-lesson-discussion-ancestry-preflight.readonly.sql");
const base = read("../scripts/sql/db05-lesson-content-discussions.draft.sql");
const scoped = read("../scripts/sql/db05-lesson-discussions-same-college.draft.sql");
const contentGuard = read("../scripts/sql/db05-lesson-content-delivery-scope.draft.sql");
const manifest = JSON.parse(read("../docs/planning/db05-migration-readiness-manifest.json"));

test("the new discussion guards are unregistered, conditional and explicitly depend on the canonical baseline", () => {
  assert.match(sql, /UNREGISTERED SOURCE-ONLY COMPANION/);
  assert.match(sql, /W01 ONLY may merge\/register/);
  assert.match(sql, /historical DDL/);
  assert.match(base, /FOREIGN KEY \(parent_discussion_id, lesson_content_id\)/);
  assert.match(scoped, /db05_lesson_discussions_tenant_guard/);
  assert.equal((sql.match(/CREATE TRIGGER db05_/g) ?? []).length, 2);
  assert.doesNotMatch(sql, /ALTER TABLE |DROP TABLE |TRUNCATE TABLE /);
});

test("discussion ancestor search terminates for previously corrupt cycles and cannot cross content boundaries", () => {
  assert.match(sql, /WITH RECURSIVE ancestors\(id, parent_discussion_id\)/);
  assert.match(sql, /\bUNION\b\s+SELECT parent\.id/);
  assert.doesNotMatch(sql, /\bUNION ALL\b/);
  assert.match(sql, /parent\.lesson_content_id = NEW\.lesson_content_id/);
  assert.match(sql, /WHERE id = NEW\.id/);
  assert.match(sql, /USING ERRCODE = '23514'/);
});

test("two write paths share content-advisory key and refuse unproven isolation", () => {
  assert.equal((sql.match(/pg_advisory_xact_lock\(605008003::bigint\)/g) ?? []).length, 2);
  assert.equal((sql.match(/current_setting\('transaction_isolation'\) <> 'read committed'/g) ?? []).length, 2);
  assert.match(contentGuard, /pg_advisory_xact_lock\(605008003::bigint\)/);
  assert.match(sql, /USING ERRCODE = '25001'/);
});

test("previously deleted discussions still block direct lesson and delivery reparenting", () => {
  assert.match(sql, /BEFORE UPDATE OF lesson_id, delivery_id ON lesson_contents/);
  assert.match(sql, /discussion\.lesson_content_id = OLD\.id/);
  assert.doesNotMatch(sql, /discussion\.deleted_at IS NULL/);
  assert.match(sql, /NEW\.lesson_id IS NOT DISTINCT FROM OLD\.lesson_id/);
  assert.match(sql, /NEW\.delivery_id IS NOT DISTINCT FROM OLD\.delivery_id/);
});

test("read-only preflight catches cycles, cross-content parent, author and underlying course scope", () => {
  for (const token of [
    "DISCUSSION_PARENT_CYCLE", "CROSS_CONTENT_PARENT", "CROSS_COLLEGE_AUTHOR",
    "UNRESOLVABLE_OR_CROSS_COLLEGE_CONTENT",
  ]) assert.ok(preflight.includes(token), token);
  assert.match(preflight, /WHERE NOT ancestor\.cycle/);
  assert.match(preflight, /parent\.id = ancestor\.parent_id/);
  assert.doesNotMatch(preflight, /\b(INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE)\s+(INTO|TABLE|FROM|\w+)\b/i);
});

test("manifest remains fail-closed with migration integration and 20 PG cases OPEN", () => {
  const companion = manifest.crossDomainCompanions.find(
    (item) => item.id === "DB05_DISCUSSION_PARENT_ANCESTRY_INTEGRITY",
  );
  assert.ok(companion);
  assert.equal(companion.registered, false);
  assert.equal(companion.postgresExecuted, false);
  assert.equal(companion.readyForProduction, false);
  const gate = manifest.gates.find(
    (item) => item.id === "DB05_DISCUSSION_PARENT_AND_CONTENT_REPARENT_PG_NEGATIVE",
  );
  assert.equal(gate?.status, "NOT_RUN");
  for (let n = 1; n <= 20; n++) {
    assert.ok(sql.includes(`DG-${String(n).padStart(2, "0")}`), `DG-${n}`);
  }
});
