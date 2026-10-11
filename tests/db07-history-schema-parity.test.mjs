import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sql = readFileSync(resolve(root, "docs/planning/sql/db07-w03-unrepresented-project-history-candidate.sql"), "utf8");
const typescript = readFileSync(resolve(root, "src/db/schema/project-audit-staged.ts"), "utf8");

const entities = {
  project_meeting_history: {
    symbol: "projectMeetingAuditHistoryStaged", parent: "project_meetings",
    childId: "project_meeting_id",
  },
  project_resource_audit: {
    symbol: "projectResourceAuditHistoryStaged", parent: "project_resources",
    childId: "project_resource_id",
  },
  project_delivery_events: {
    symbol: "projectDeliveryEventsStaged", parent: "project_submissions",
    childId: "delivery_id",
  },
  project_task_comments: {
    symbol: "projectTaskCommentsStaged", parent: "project_tasks",
    childId: "project_task_id",
  },
};

function candidateColumns(sqlSource, table) {
  const body = new RegExp("CREATE TABLE " + table + "\\(([\\s\\S]*?)\\n\\);", "i").exec(sqlSource)?.[1];
  assert(body, "Missing SQL table: " + table);
  return [...body.matchAll(/\b([a-z][a-z0-9_]*)\s+(?:uuid|varchar\(\d+\)|integer|jsonb|text|timestamptz)(?=\s|,|\)|$)/gi)]
    .map(match => match[1]).sort();
}
function declarationBody(tsSource, table, symbol) {
  const body = new RegExp(
    "export const " + symbol + "\\s*=\\s*pgTable\\(\"" + table +
      "\",\\{([\\s\\S]*?)\\n\\},t=>\\[",
  ).exec(tsSource)?.[1];
  assert(body, "Missing staged Drizzle declaration: " + symbol);
  return body;
}
function drizzleColumns(tsSource, table, symbol) {
  const body = declarationBody(tsSource, table, symbol);
  const names = [...body.matchAll(/\b[a-zA-Z]\w*:\s*(?:uuid|varchar|integer|json|text|timestamp)\("([a-z][a-z0-9_]*)"/g)]
    .map(match => match[1]);
  if (/\bcreatedAt:\s*time\(\)/.test(body)) names.push("created_at");
  return names.sort();
}
function compare(sqlSource, tsSource) {
  const errors = [];
  for (const [table, meta] of Object.entries(entities)) {
    const sqlColumns = candidateColumns(sqlSource, table);
    const drizzle = drizzleColumns(tsSource, table, meta.symbol);
    for (const name of sqlColumns) if (!drizzle.includes(name))
      errors.push("DRIZZLE_MISSING_COLUMN:" + table + "." + name);
    for (const name of drizzle) if (!sqlColumns.includes(name))
      errors.push("SQL_MISSING_COLUMN:" + table + "." + name);
    const fk = new RegExp("FOREIGN KEY\\s*\\(project_id,\\s*" + meta.childId +
      "\\)\\s*REFERENCES " + meta.parent + "\\(project_id,\\s*id\\)", "i");
    if (!fk.test(sqlSource)) errors.push("MISSING_COMPOSITE_PROJECT_FK:" + table);
    const sqlCreation = new RegExp("CREATE TABLE " + table + "\\([\\s\\S]*?\\n\\);", "i").exec(sqlSource)?.[0] ?? "";
    if (!fk.test(sqlCreation)) errors.push("PROJECT_FK_IN_WRONG_TABLE:" + table);
    if (!new RegExp("projectId,\\s*t\\." + (meta.childId === "project_meeting_id" ? "meetingId" :
      meta.childId === "project_resource_id" ? "resourceId" :
      meta.childId === "delivery_id" ? "deliveryId" : "taskId")).test(tsSource))
      errors.push("DRIZZLE_COMPOSITE_PROJECT_FK_DRIFT:" + table);
  }
  return errors;
}

test("all four DB07 source-active history/comment columns mirror staged Drizzle", () => {
  assert.deepEqual(compare(sql, typescript), []);
});

test("detects removal of a JSON history snapshot from Drizzle", () => {
  const mutant = typescript.replace("beforeJson:json(\"before_json\"),", "");
  assert(compare(sql, mutant).includes("DRIZZLE_MISSING_COLUMN:project_meeting_history.before_json"));
});

test("detects SQL-only extension not represented in Drizzle", () => {
  const mutant = sql.replace("notes text,", "notes text,\\n  secret_new_field text,");
  assert(compare(mutant, typescript).some(issue => issue.endsWith(".secret_new_field")));
});

test("detects missing composite same-project FK", () => {
  const mutant = sql.replace(
    "FOREIGN KEY(project_id,project_task_id)",
    "FOREIGN KEY(project_task_id)",
  );
  assert(compare(mutant, typescript).includes("MISSING_COMPOSITE_PROJECT_FK:project_task_comments"));
});

test("no registered migration is implied by these candidate schema comparisons", () => {
  assert.match(sql, /NOT registered in drizzle\/meta\/_journal\.json/);
  assert.match(typescript, /SOURCE-ONLY schema candidates/);
});
