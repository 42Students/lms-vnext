import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const file = (path) => new URL(path, import.meta.url);
const read = (path) => readFileSync(file(path), "utf8");
const manifest = JSON.parse(
  read("../docs/planning/db05-migration-readiness-manifest.json"),
);
const parent = manifest.artifacts.find(
  (artifact) => artifact.id === "db05-parent-facets",
);

test("DB05 parent graph and department guard are one integration package", () => {
  assert.ok(parent);
  assert.equal(manifest.artifacts.length, 7);
  assert.equal(parent.registered, false);
  assert.equal(parent.executedAgainstPostgres, false);
  assert.equal(
    parent.companionIntegrityDraft.path,
    "scripts/sql/db05-course-parent-graph-guard.draft.sql",
  );
  assert.equal(
    parent.companionUpstreamDepartmentDraft.path,
    "scripts/sql/db05-department-college-move.draft.sql",
  );
  assert.equal(parent.companionUpstreamDepartmentDraft.registered, false);
  assert.equal(parent.companionUpstreamDepartmentDraft.postgresExecuted, false);
  assert.ok(
    parent.prereqs.includes("DEPARTMENT_COLLEGE_MOVE_GUARD_MERGED_ONCE"),
  );
  assert.equal(
    existsSync(file("../scripts/sql/db05-course-parent-integrity.draft.sql")),
    false,
  );
});

test("upstream guard locks exactly like the canonical course graph draft", () => {
  const parentGuard = read(
    "../scripts/sql/db05-course-parent-graph-guard.draft.sql",
  );
  const upstream = read(
    "../scripts/sql/db05-department-college-move.draft.sql",
  );
  for (const sql of [parentGuard, upstream]) {
    assert.match(sql, /pg_advisory_xact_lock\(605008001::bigint\)/);
    assert.match(sql, /transaction_isolation/);
  }
  assert.equal(
    parent.companionUpstreamDepartmentDraft.sharedAdvisoryLockKey,
    "605008001",
  );
});

test("upstream reparent and PostgreSQL race gates are not falsely cleared", () => {
  for (const id of [
    "COURSE_PARENT_GRAPH_SAME_COLLEGE_AND_MULTI_HOP_CYCLES",
    "COURSE_PARENT_UPSTREAM_COLLEGE_MOVE_INTEGRITY",
    "COURSE_DEPARTMENT_COLLEGE_MOVE_RACE_ACCEPTANCE",
  ]) {
    const gate = manifest.gates.find((row) => row.id === id);
    assert.ok(gate, id);
    assert.notEqual(gate.status, "PASS", id);
  }
  assert.match(
    parent.companionUpstreamDepartmentDraft.note,
    /PostgreSQL acceptance NOT RUN/,
  );
});
