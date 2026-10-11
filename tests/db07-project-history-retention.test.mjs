import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sqlPath = resolve(root, "docs/planning/sql/db07-w03-unrepresented-project-history-candidate.sql");
const schemaPath = resolve(root, "src/db/schema/project-audit-staged.ts");
const sql = readFileSync(sqlPath, "utf8");
const schema = readFileSync(schemaPath, "utf8");

/** A CREATE TRIGGER declaration has no inner semicolon; isolate the declaration
 * so a matching keyword in another trigger or comment cannot satisfy a guard. */
function trigger(sqlSource, name) {
  const pattern = new RegExp(
    "(?:^|\\n)CREATE TRIGGER " + name + "\\b[\\s\\S]*?;",
    "i",
  );
  return pattern.exec(sqlSource)?.[0] ?? null;
}

function issues(sqlSource, schemaSource) {
  const problems = [];
  const history = [
    ["project_meeting_history", "w03_meeting_history_immutable", "w03_meeting_history_no_truncate"],
    ["project_resource_audit", "w03_resource_history_immutable", "w03_resource_history_no_truncate"],
    ["project_delivery_events", "w03_delivery_history_immutable", "w03_delivery_history_no_truncate"],
  ];
  for (const [table, rowName, truncateName] of history) {
    const row = trigger(sqlSource, rowName) ?? "";
    const truncated = trigger(sqlSource, truncateName) ?? "";
    if (!new RegExp("BEFORE UPDATE OR DELETE\\s+ON " + table + "\\s+FOR EACH ROW\\s+EXECUTE FUNCTION w03_reject_project_history_mutation", "i").test(row))
      problems.push("MISSING_ROW_IMMUTABILITY:" + table);
    if (!new RegExp("BEFORE TRUNCATE\\s+ON " + table + "\\s+FOR EACH STATEMENT\\s+EXECUTE FUNCTION w03_reject_project_history_mutation", "i").test(truncated))
      problems.push("MISSING_TRUNCATE_IMMUTABILITY:" + table);
  }
  const erased = "w03_reject_project_comment_erasure";
  if (!new RegExp("BEFORE DELETE\\s+ON project_task_comments\\s+FOR EACH ROW\\s+EXECUTE FUNCTION " + erased, "i").test(trigger(sqlSource, "w03_task_comments_no_delete") ?? ""))
    problems.push("COMMENT_HARD_DELETE_ALLOWED");
  if (!new RegExp("BEFORE TRUNCATE\\s+ON project_task_comments\\s+FOR EACH STATEMENT\\s+EXECUTE FUNCTION " + erased, "i").test(trigger(sqlSource, "w03_task_comments_no_truncate") ?? ""))
    problems.push("COMMENT_TRUNCATE_ALLOWED");
  if (!/CREATE FUNCTION w03_guard_project_comment_identity\(\) RETURNS trigger[\s\S]*?END \$\$;/i.test(sqlSource))
    problems.push("MISSING_COMMENT_IDENTITY_FUNCTION");
  for (const field of ["id", "project_id", "project_task_id", "commenter_user_id", "created_at"]) {
    if (!sqlSource.includes("NEW." + field + " IS DISTINCT FROM OLD." + field))
      problems.push("COMMENT_IDENTITY_MUTABLE:" + field);
  }
  if (!/BEFORE UPDATE\s+ON project_task_comments\s+FOR EACH ROW\s+EXECUTE FUNCTION w03_guard_project_comment_identity/i.test(trigger(sqlSource, "w03_task_comments_identity_immutable") ?? ""))
    problems.push("COMMENT_IDENTITY_TRIGGER_MISSING");
  for (const [name, fragment] of [
    ["w03_task_comments_updated_after_created_ck", "updated_at >= created_at"],
    ["w03_task_comments_deleted_after_created_ck", "deleted_at IS NULL OR deleted_at >= created_at"],
  ]) {
    if (!sqlSource.includes(name) || !sqlSource.includes(fragment))
      problems.push("MISSING_SQL_CHRONOLOGY:" + name);
    if (!schemaSource.includes('check("' + name + '"'))
      problems.push("MISSING_DRIZZLE_CHRONOLOGY:" + name);
  }
  if (!/project_task_comments\([\s\S]*?deleted_at timestamptz/i.test(sqlSource))
    problems.push("MISSING_SOFT_DELETE_COLUMN");
  return problems;
}

test("DB07 staged history and comment retention has no obvious static bypass", () => {
  assert.deepEqual(issues(sql, schema), []);
});

test("detects a removed history TRUNCATE trigger (DELETE triggers alone are insufficient)", () => {
  const mutant = sql.replace(/CREATE TRIGGER w03_meeting_history_no_truncate[\s\S]*?;/, "");
  assert(issues(mutant, schema).includes("MISSING_TRUNCATE_IMMUTABILITY:project_meeting_history"));
});

test("detects missing comment soft-delete and reparent guards", () => {
  const noSoftDelete = sql.replace(/CREATE TRIGGER w03_task_comments_no_delete[\s\S]*?;/, "");
  const noReparent = sql.replace("NEW.project_task_id IS DISTINCT FROM OLD.project_task_id", "FALSE");
  assert(issues(noSoftDelete, schema).includes("COMMENT_HARD_DELETE_ALLOWED"));
  assert(issues(noReparent, schema).includes("COMMENT_IDENTITY_MUTABLE:project_task_id"));
});

test("detects SQL/Drizzle chronology mismatch", () => {
  const mutant = schema.replace('check("w03_task_comments_deleted_after_created_ck"', 'check("wrong_name"');
  assert(issues(sql, mutant).includes("MISSING_DRIZZLE_CHRONOLOGY:w03_task_comments_deleted_after_created_ck"));
});

test("staged SQL is not misrepresented as an active registered migration", () => {
  assert.match(sql, /NOT registered in drizzle\/meta\/_journal\.json/i);
  assert.match(schema, /SOURCE-ONLY schema candidates/i);
});
