import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";
import pg from "pg";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

// Catalog existence is a necessary witness, NOT 79/79 field-semantic closure.
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("DB006 requires isolated disposable TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1");
}
assertSafeDb01TestTarget({ ...process.env, DATABASE_URL: "" });
const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });
after(async () => pool.end());
const file = fileURLToPath(new URL("../docs/planning/database-parity-db03-79-field-crosswalk.json", import.meta.url));
const crosswalk = JSON.parse(readFileSync(file, "utf8"));

test("DB006 registered PG17 exposes 79/79 candidate target catalog objects", async () => {
  assert.equal(crosswalk.sourceColumns, 79);
  assert.equal(crosswalk.fields.length, 79);
  const columns = await pool.query(`
    SELECT table_name,column_name,data_type,is_nullable,column_default
    FROM information_schema.columns
    WHERE table_schema = current_schema()
  `);
  const present = new Set(columns.rows.map(row => row.table_name+"."+row.column_name));
  const indexes = await pool.query("SELECT indexname FROM pg_indexes WHERE schemaname=current_schema()");
  const presentIndexes = new Set(indexes.rows.map(row => row.indexname));
  for (const field of crosswalk.fields) {
    assert.equal(field.target.length, 1, "Unexpected multi-target field: "+field.legacyColumn);
    const target = field.target[0];
    if (target.includes(".")) {
      assert.ok(present.has(target), field.legacyColumn+" -> missing physical column "+target);
    } else {
      assert.ok(presentIndexes.has(target), field.legacyColumn+" -> missing index "+target);
    }
  }
});

test("DB006 direct SQL guards and immutable group-history trigger are physically installed", async () => {
  const required = new Map([
    ["db03_elective_member_academics_guard","lms_group_members"],
    ["db03_elective_offering_program_guard","elective_offerings"],
    ["db03_elective_slot_reparent_guard","elective_slots"],
    ["db03_elective_cohort_reparent_guard","cohorts"],
    ["db03_elective_course_offering_reparent_guard","course_offerings"],
    ["db03_elective_delivery_reparent_guard","course_section_deliveries"],
    ["db03_elective_section_reparent_guard","sections"],
    ["db03_member_tenant_guard","lms_group_members"],
    ["db03_elective_slot_scope_guard","elective_slots"],
    ["db03_elective_offering_scope_guard","elective_offerings"],
  ]);
  const result = await pool.query(`
    SELECT t.tgname,c.relname
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    WHERE NOT t.tgisinternal AND t.tgname = ANY($1::text[])
  `, [[...required.keys()]]);
  for (const [name, table] of required) {
    assert.ok(result.rows.some(row => row.tgname === name && row.relname === table),
      "Required DB006 trigger not installed: "+name+" on "+table);
  }
});
