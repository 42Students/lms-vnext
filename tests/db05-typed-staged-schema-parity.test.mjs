import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = (p) => readFileSync(resolve(root, p), "utf8");
const discussionTs = source("src/db/schema/db05-lesson-discussions.staged.ts");
const settingsTs = source("src/db/schema/db05-lesson-settings.staged.ts");
const discussionSql = source("scripts/sql/db05-lesson-content-discussions.draft.sql");
const settingsSql = source("scripts/sql/db05-lesson-content-settings.draft.sql");
const barrel = source("src/db/schema/index.ts");

const discussions = [
  "id", "college_id", "lesson_content_id", "author_membership_id",
  "author_unique_name_snapshot", "author_profile_name_snapshot",
  "content_text", "sequence", "parent_discussion_id", "discussion_status",
  "is_faculty_answer", "resolved_at", "resolved_by_membership_id",
  "attachment_object_key", "deleted_at", "created_at", "updated_at",
];
const settings = [
  "lesson_content_id", "allow_discussions", "view_after_schedule",
  "view_before_schedule", "html_content", "plain_text",
  "legacy_due_date_raw", "calendar_event_id", "calendar_time_zone",
  "thumbnail_url", "version", "updated_by_user_id",
  "created_at", "updated_at",
];

function quotedColumnNames(ts) {
  return [...ts.matchAll(/(?:uuid|varchar|text|integer|boolean|timestamp|bigint)\("([a-z_]+)"/g)]
    .map((match) => match[1]);
}
function countDeclared(ts, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...ts.matchAll(new RegExp("(?:uuid|varchar|text|integer|boolean|timestamp|bigint)\\(\"" + escaped + "\"", "g"))].length;
}
function assertColumnsMatch(ts, sql, expected) {
  assert.deepEqual(quotedColumnNames(ts).sort(), [...expected].sort());
  for (const column of expected) {
    assert.equal(countDeclared(ts, column), 1, "duplicate Drizzle column: " + column);
    assert.match(sql, new RegExp("\\b" + column + "\\b"), column);
  }
}

test("DB05 isolated lesson discussion table has all 17 source-backed SQL columns exactly once", () => {
  assertColumnsMatch(discussionTs, discussionSql, discussions);
  assert.match(discussionTs, /lesson_content_discussions/);
  assert.match(discussionTs, /lesson_content_discussions_parent_content_fk/);
  assert.match(discussionTs, /foreignKey\(/);
  assert.match(discussionTs, /unique\("lesson_content_discussions_id_content_uq"\)/);
  assert.match(discussionTs, /\.onDelete\("restrict"\)/);
  assert.match(discussionSql, /NOT A REGISTERED DRIZZLE MIGRATION/);
});

test("DB05 lesson content settings typed staging accounts for its 14 SQL columns", () => {
  assertColumnsMatch(settingsTs, settingsSql, settings);
  assert.match(settingsTs, /lesson_content_settings/);
  assert.match(settingsTs, /\.primaryKey\(\)/);
  assert.match(settingsTs, /db05_lesson_content_settings_version_nonnegative_ck/);
  assert.match(settingsTs, /db05_lesson_content_settings_updated_idx/);
  assert.match(settingsTs, /bigint\("version", \{ mode: "bigint" \}\)\.notNull\(\)\.default\(sql`0`\)/);
  assert.match(settingsSql, /NOT A REGISTERED MIGRATION/);
});

test("DB05 staged tables are not exported from the runtime schema barrel", () => {
  assert.doesNotMatch(barrel, /db05-lesson-discussions\.staged/);
  assert.doesNotMatch(barrel, /db05-lesson-settings\.staged/);
  assert.match(discussionTs, /Do NOT import into runtime APIs/);
  assert.match(settingsTs, /No runtime import or schema-barrel modification/);
});

test("DB05 unregistered schema models cannot substitute for separate tenant and API gates", () => {
  const guard = source("scripts/sql/db05-lesson-discussions-same-college.draft.sql");
  assert.match(guard, /UNREGISTERED COMPANION/);
  assert.match(guard, /author_college_id/);
  assert.match(guard, /content_period_college_id/);
  assert.match(guard, /course_department_college_id/);
  assert.match(guard, /section_cohort_id IS DISTINCT FROM offering_cohort_id/);
  assert.match(discussionTs, /separate SQL/);
  assert.match(settingsTs, /DB06 assignment submission controls/);
});
