import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
const last = journal.entries.at(-1);
const tag = String(last.idx).padStart(4, "0");
const snapshot = JSON.parse(readFileSync(`drizzle/meta/${tag}_snapshot.json`, "utf8"));
const sql = readFileSync("drizzle/0316_db07_template_version_integrity.sql", "utf8");
const keys = ["columnsFrom", "columnsTo", "name", "onDelete", "onUpdate", "tableFrom", "tableTo"].sort();

test("DB001 canonical latest Drizzle v7 snapshot has representable FK shape", () => {
  assert.equal(snapshot.version, "7");
  assert.equal(snapshot.dialect, "postgresql");
  assert.equal(last.tag, "0316_db07_template_version_integrity");
  for (const [tableName, table] of Object.entries(snapshot.tables)) {
    for (const [name, fk] of Object.entries(table.foreignKeys ?? {})) {
      assert.deepEqual(Object.keys(fk).sort(), keys, `${tableName}.${name} must not inject non-Drizzle metadata`);
    }
  }
});
test("DB001 preserves deferred SQL-only current/published pointer integrity", () => {
  for (const constraint of [
    "project_templates_current_version_snapshot_fk",
    "project_templates_published_version_snapshot_fk",
  ]) {
    assert.match(sql, new RegExp("ADD CONSTRAINT " + constraint + "[\\s\\S]*?DEFERRABLE INITIALLY DEFERRED"));
    const fk = snapshot.tables["public.project_templates"].foreignKeys[constraint];
    assert.ok(fk);
    assert.deepEqual(fk.columnsTo, ["template_id", "version"]);
    assert.equal(fk.onDelete, "no action");
    assert.equal(fk.deferrable, undefined, "SQL-only deferrability is not a v7 snapshot property");
  }
});
