import test from "node:test";
import assert from "node:assert/strict";
import { classifyJava, parseMigrationImpact, parseLegacyJsonl, summarizePhysical } from "../scripts/db-parity-tools.mjs";

test("detects a JPA entity and annotated fields without claiming physical columns", () => {
  const input = [
    "@Entity", '@Table(name = "lms_group")', "public class LmsGroup extends BaseModel {",
    '  @Column(name = "kind", nullable = false)', "  private String kind;",
    "  @Version", "  private Long version = 0L;", "}"
  ].join("\n");
  const x = classifyJava(input, "LmsGroup.java");
  assert.equal(x.kind, "ENTITY");
  assert.equal(x.table, "lms_group");
  assert.equal(x.superclass, "BaseModel");
  assert.ok(x.candidateFields.some(f => f.name === "kind"));
});
test("migration impact preserves numeric ordering metadata and destructive ops", () => {
  const x = parseMigrationImpact("db/migration/V125__drop_legacy_quiz_system.sql", "DROP TABLE IF EXISTS quiz_legacy;");
  assert.equal(x.version, 125);
  assert.equal(x.operations.dropTable, true);
  assert.ok(x.mentionedTables.includes("quiz_legacy"));
});
test("rejects malformed production schema JSONL", () => {
  assert.throws(() => parseLegacyJsonl('{"kind":"table"}\nBAD'), /line 2/);
});
test("reports missing tables and does not certify field parity by coincidence", () => {
  const entries = [{ kind:"table", table_type:"BASE TABLE", table_name:"lms_group" },
    { kind:"table", table_type:"BASE TABLE", table_name:"foo" },
    { kind:"column", table_name:"foo", column_name:"id" }];
  const map = [{legacyTable:"lms_group",vnextTable:null,state:"GAP_CONFIRMED"}];
  const r = summarizePhysical(entries, map, []);
  assert.deepEqual(r.unmappedTables, ["foo"]);
  assert.deepEqual(r.nonimplementedTables, ["lms_group"]);
  assert.equal(r.unresolvedFieldMappings, 1);
  assert.equal(r.canClaimParity, false);
});
