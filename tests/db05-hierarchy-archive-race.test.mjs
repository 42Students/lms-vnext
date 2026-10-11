import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const sql = read("../scripts/sql/db05-hierarchy-active-child-archive-guard.draft.sql");
const courses = read("../src/db/schema/courses.ts");
const services = {
  course: read("../src/modules/courses/course-service.ts"),
  offering: read("../src/modules/courses/offering-service.ts"),
  delivery: read("../src/modules/courses/delivery-service.ts"),
};

const triggerNames = [
  "db05_course_archive_active_offerings_guard",
  "db05_offering_active_course_before_write",
  "db05_offering_archive_live_deliveries_guard",
  "db05_delivery_active_offering_before_write",
  "db05_delivery_end_active_teachers_guard",
  "db05_teacher_active_delivery_before_write",
];

test("DB05 active-child hierarchy race draft remains isolated, unregistered and review-gated", () => {
  assert.match(sql, /UNREGISTERED READ-COMMITTED LIFECYCLE RACE COMPANION/);
  assert.match(sql, /DO NOT DEPLOY OR REGISTER/);
  assert.match(sql, /W01 APPROVAL/);
  assert.match(sql, /BEGIN;[\s\S]*COMMIT;/);
  assert.doesNotMatch(sql, /ALTER TABLE|DROP TABLE|TRUNCATE/i);
});

test("DB05 archive hierarchy checks match the three application precondition reads", () => {
  assert.match(services.course, /COURSE_HAS_ACTIVE_OFFERINGS/);
  assert.match(services.offering, /OFFERING_HAS_ACTIVE_DELIVERIES/);
  assert.match(services.delivery, /DELIVERY_HAS_ACTIVE_TEACHERS/);
  for (const table of [
    "courses", "course_offerings", "course_section_deliveries",
    "course_teaching_assignments",
  ]) {
    assert.match(courses, new RegExp('"' + table + '"'), table);
    assert.match(sql, new RegExp("\\b" + table + "\\b"), table);
  }
});

test("DB05 six distinct lifecycle guards cover all parent archive and child activation edges", () => {
  assert.equal(new Set(triggerNames).size, 6);
  for (const name of triggerNames) {
    assert.equal(sql.split(name).length - 1, 1, name);
  }
  assert.equal((sql.match(/CREATE TRIGGER db05_/g) || []).length, 6);
  assert.equal((sql.match(/CREATE OR REPLACE FUNCTION db05_/g) || []).length, 6);
});

test("DB05 parent archive can only succeed without active direct children", () => {
  assert.match(sql, /OLD\.status = 'ACTIVE' AND NEW\.status = 'ARCHIVED'/);
  assert.match(sql, /offering\.course_id = OLD\.id[\s\S]*?offering\.status = 'ACTIVE'/);
  assert.match(sql, /delivery\.offering_id = OLD\.id[\s\S]*?delivery\.ended_at IS NULL/);
  assert.match(sql, /OLD\.ended_at IS NULL AND NEW\.ended_at IS NOT NULL/);
  assert.match(sql, /teacher\.delivery_id = OLD\.id[\s\S]*?teacher\.ended_at IS NULL/);
});

test("DB05 child activation reads and SHARE-locks parent rows on all three edges", () => {
  assert.match(sql, /NEW\.status = 'ACTIVE'[\s\S]*?FROM courses[\s\S]*?FOR SHARE/);
  assert.match(sql, /NEW\.ended_at IS NULL[\s\S]*?FROM course_offerings[\s\S]*?FOR SHARE/);
  assert.match(sql, /FROM course_section_deliveries d[\s\S]*?FOR SHARE/);
  assert.equal((sql.match(/FOR SHARE;/g) || []).length, 3);
  assert.equal((sql.match(/USING ERRCODE = '23514'/g) || []).length, 6);
});

test("DB05 guard applies to reactivation or parent reassignment, not only INSERT", () => {
  assert.match(sql, /BEFORE INSERT OR UPDATE OF course_id, status ON course_offerings/);
  assert.match(sql, /BEFORE INSERT OR UPDATE OF offering_id, ended_at ON course_section_deliveries/);
  assert.match(sql, /BEFORE INSERT OR UPDATE OF delivery_id, ended_at ON course_teaching_assignments/);
});

test("DB05 all twenty race/rollback/lifecycle PG acceptance cases stay explicitly unexecuted", () => {
  const cases = [...sql.matchAll(/^-- HL-(\d{2}) /gm)].map(x => Number(x[1]));
  assert.deepEqual(cases, Array.from({length: 20}, (_, i) => i + 1));
  assert.match(sql, /NOT RUN/);
  assert.match(sql, /two-session|TWO-CONNECTION/);
  assert.match(sql, /READ COMMITTED/);
  assert.match(sql, /SERIALIZABLE\/REPEATABLE READ/);
  assert.match(sql, /deadlock/);
});
