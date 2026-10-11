import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../scripts/sql/db05-tombstone-ancestor-preflight.readonly.sql', import.meta.url), 'utf8');

test('preflight cannot mutate rows, change schema or emit per-person identifiers', () => {
  assert.doesNotMatch(sql, /^\s*(INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|CREATE)\b/im);
  assert.doesNotMatch(sql, /\b(actor_user_id|email|phone_e164|identity_uid|content_text)\b/i);
  assert.equal((sql.match(/count\(\*\)::bigint/g) ?? []).length, 3);
});
test('reads every level from lessons and content to canonical course', () => {
  assert.match(sql, /FROM course_lessons lesson[\s\S]*JOIN course_learning_paths path[\s\S]*JOIN course_offerings offering[\s\S]*JOIN courses course_row/);
  assert.match(sql, /JOIN course_lessons lesson ON lesson.id = content.lesson_id/);
});
test('live lesson beneath deleted course is counted', () => {
  assert.match(sql, /LIVE_LESSON_UNDER_DELETED_COURSE/);
  assert.match(sql, /lesson\.legacy_deleted_at IS NULL\s+AND course_row\.legacy_deleted_at IS NOT NULL/);
});
test('live content beneath deleted lesson is counted', () => {
  assert.match(sql, /LIVE_CONTENT_UNDER_DELETED_LESSON/);
  assert.match(sql, /content\.legacy_deleted_at IS NULL\s+AND lesson\.legacy_deleted_at IS NOT NULL/);
});
test('content under deleted course is counted even if lesson state differs', () => {
  assert.match(sql, /LIVE_CONTENT_UNDER_DELETED_COURSE/);
  assert.match(sql, /content\.legacy_deleted_at IS NULL\s+AND course_row\.legacy_deleted_at IS NOT NULL/);
});
test('each count is a separate result and no repair is attempted', () => {
  assert.equal((sql.match(/^UNION ALL$/gm) ?? []).length, 2);
  assert.match(sql, /ORDER BY violation;/);
  assert.doesNotMatch(sql, /UPDATE\s+course_lessons\s+SET/i);
});
