import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync("src/db/schema/db10-skills-catalog.draft.ts","utf8");
const sql = readFileSync("scripts/sql/db10-skills-catalog-staging.sql","utf8");
const contract = readFileSync("docs/planning/database-parity-db10-skills-contract.md","utf8");

test("DB22 source contract is explicit, staged, and never falsely verified", () => {
  assert.match(contract, /DRAFT_NOT_JOURNALLED/);
  assert.match(contract, /POSTGRES_NOT_RUN/);
  assert.match(contract, /runtime UNVERIFIED/);
  assert.match(sql, /STAGING ONLY, NOT A NUMBERED MIGRATION/);
  for (let i=1; i<=9; i++) {
    assert.ok(contract.includes("DB22-" + String(i).padStart(2,"0")));
  }
});

test("DB22 stages all three independent source tables", () => {
  for (const table of ["skills", "skill_synonyms", "skill_usage"]) {
    assert.match(sql, new RegExp("CREATE TABLE " + table + " \\("));
    assert.match(schema, new RegExp('"'+table+'"'));
  }
  assert.match(schema, /export const db10Skills = pgTable/);
  assert.match(schema, /export const db10SkillSynonyms = pgTable/);
  assert.match(schema, /export const db10SkillUsage = pgTable/);
});

test("DB22 only catalog names are globally unique; aliases remain a many-to-many search relation", () => {
  assert.match(sql, /CREATE UNIQUE INDEX db10_skills_name_uq/);
  assert.match(sql, /CREATE INDEX db10_skill_synonyms_search_idx/);
  assert.doesNotMatch(sql, /CREATE UNIQUE INDEX\s+\w*synonym/i);
  assert.doesNotMatch(schema, /uniqueIndex\("db10_skill_synonyms_value_uq"\)/);
  assert.match(schema, /index\("db10_skill_synonyms_search_idx"\)/);
  assert.match(sql, /skill_id uuid NOT NULL REFERENCES skills\(id\) ON DELETE RESTRICT/);
});

test("DB22 persists two distinct independent popularity counters", () => {
  const skills = sql.match(/CREATE TABLE skills \(([\s\S]*?)\);/)?.[1] ?? "";
  const usage = sql.match(/CREATE TABLE skill_usage \(([\s\S]*?)\);/)?.[1] ?? "";
  assert.match(skills, /usage_count integer NOT NULL DEFAULT 0/);
  assert.match(usage, /skill_name varchar\(200\) PRIMARY KEY/);
  assert.match(usage, /usage_count integer NOT NULL DEFAULT 0/);
  assert.match(usage, /last_used timestamp with time zone NOT NULL DEFAULT now\(\)/);
  assert.doesNotMatch(usage, /REFERENCES skills/);
  assert.match(schema, /skillName: varchar\("skill_name"/);
  assert.match(schema, /lastUsed: timestamp\("last_used"/);
  assert.doesNotMatch(schema, /lastUsedAt: timestamp\("last_used_at"/);
});

test("DB22 safeguards names, active ranking, counter and priority bounds", () => {
  for (const token of [
    "db10_skills_name_ck", "db10_skills_display_name_ck",
    "db10_skills_usage_ck", "db10_skills_priority_ck",
    "db10_skill_synonyms_value_ck",
    "db10_skill_usage_name_ck", "db10_skill_usage_count_ck",
    "db10_skills_popularity_idx",
  ]) {
    assert.ok(sql.includes(token), "Missing SQL invariant " + token);
    assert.ok(schema.includes(token), "Missing Drizzle invariant " + token);
  }
  assert.match(sql, /search_priority BETWEEN 0 AND 100/);
  assert.match(sql, /CREATE INDEX db10_skills_active_category_name_idx/);
});

test("DB22 usage names preserve legacy whitespace until product approves redesign", () => {
  assert.match(sql, /VALUES\(lower\(:name\),1,clock_timestamp\(\)\)/);
  assert.doesNotMatch(sql, /VALUES\(lower\(trim\(:name\)\)/);
  assert.match(sql, /SkillUsageTracker\.recordUsage uses toLowerCase\(\) WITHOUT trim/);
  assert.match(contract, /Whitespace-parity exception/);
  // The SQL comment is staging guidance, NOT an executed database writer.
  // A product decision is still needed about tightening blank-only skill names.
});
