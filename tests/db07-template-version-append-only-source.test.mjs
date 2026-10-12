import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const service = read("src/modules/projects/template-service.ts");
const schema = read("src/db/schema/projects.ts");
const sql = read("docs/planning/sql/db07-template-version-append-only-staging.sql");
const contract = read("docs/planning/db07-template-version-append-only-contract.md");
const pg = read("tests/integration/db07-template-version-append-only.test.ts");
const templateP2 = read("tests/integration/projects-p2-templates.test.ts");

test("DB070 version lifecycle creates immutable snapshots as new rows", () => {
  assert.equal((service.match(/\.insert\(projectTemplateVersions\)/g) ?? []).length, 3);
  assert.doesNotMatch(service, /\.update\(projectTemplateVersions\)/);
  assert.doesNotMatch(service, /\.delete\(projectTemplateVersions\)/);
});

test("DB070 template header remains distinct and mutable", () => {
  assert.match(service, /export async function publishProjectTemplate/);
  assert.match(service, /export async function archiveProjectTemplate/);
  assert.match(service, /\.update\(projectTemplates\)/);
});

test("DB070 registered version shape is a separate revision table", () => {
  assert.match(schema, /export const projectTemplateVersions = pgTable/);
  assert.match(schema, /"project_template_versions"/);
  assert.match(schema, /project_template_versions_template_version_uq/);
});

test("DB070 trigger is explicitly staged and not a registered migration", () => {
  assert.match(sql, /STAGED ONLY, NOT a registered Drizzle migration/);
  assert.match(contract, /staged only, no registered migration/);
});

test("DB070 guard only targets project_template_versions", () => {
  assert.match(sql, /BEFORE UPDATE OR DELETE ON project_template_versions/);
  assert.doesNotMatch(sql, /BEFORE UPDATE OR DELETE ON project_templates\b/);
});

test("DB070 denies historical UPDATE with SQLSTATE 23514", () => {
  assert.match(sql, /IF TG_OP = 'UPDATE' THEN/);
  assert.match(sql, /immutable \(UPDATE\)/);
  assert.match(sql, /ERRCODE = '23514'/);
});

test("DB070 denies deleting unreferenced historical revisions", () => {
  assert.match(sql, /ELSIF TG_OP = 'DELETE' THEN/);
  assert.match(sql, /immutable \(DELETE\)/);
  assert.match(sql, /unreferenced/);
});

test("DB070 trigger/function names and dollar quote are well formed", () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION db07_deny_template_version_mutation\(\)/);
  assert.match(sql, /CREATE TRIGGER db07_project_template_versions_append_only/);
  assert.equal((sql.match(/\$db07_template_revision_guard\$/g) ?? []).length, 2);
});

test("DB070 TRUNCATE CASCADE cannot evade row-level revision immutability", () => {
  const statement = /CREATE TRIGGER db07_project_template_versions_no_truncate\s+BEFORE TRUNCATE ON project_template_versions\s+FOR EACH STATEMENT\s+EXECUTE FUNCTION db07_deny_template_version_mutation\(\);/;
  assert.match(sql, statement);
  assert.match(sql, /IF TG_OP = 'TRUNCATE' THEN\s+RAISE EXCEPTION[\s\S]*?USING ERRCODE = '23514';/);
  assert.ok(sql.indexOf("IF TG_OP = 'TRUNCATE'") < sql.indexOf("OLD.id"),
    "statement triggers must not dereference missing OLD rows");
  const mutant = sql.replace(/CREATE TRIGGER db07_project_template_versions_no_truncate[\s\S]*?;/, "");
  assert.doesNotMatch(mutant, statement, "source guard must catch removed TRUNCATE protection");
});

test("DB070 source proposal is nondestructive and does not mutate schema barrel", () => {
  assert.doesNotMatch(sql, /\bDROP\s+(?:TABLE|SCHEMA|INDEX)\b/i);
  assert.doesNotMatch(sql, /(?:^|\n)\s*TRUNCATE\s+(?:TABLE\s+)?project_template_versions\b/im);
  assert.doesNotMatch(sql, /\bALTER TABLE project_templates\b/i);
});

test("DB070 PG suite is opt-in and refuses default production URL", () => {
  assert.match(pg, /DB07_TEMPLATE_VERSION_APPEND_ONLY === "1"/);
  assert.match(pg, /describe\.skipIf\(!enabled\)/);
  assert.match(pg, /process\.env\.TEST_DATABASE_URL/);
  assert.doesNotMatch(pg, /\?\?\s*process\.env\.DATABASE_URL/);
  assert.match(pg, /endsWith\("_test"\)/);
});

test("DB070 PG acceptance checks actual enabled trigger before tests", () => {
  assert.match(pg, /pg_trigger/);
  assert.match(pg, /db07_project_template_versions_append_only/);
  assert.match(pg, /not tgisinternal/);
});

test("DB070 PG acceptance isolates writes and refuses to assert execution in this source suite", () => {
  assert.match(pg, /client\.query\("BEGIN"\)/);
  assert.match(pg, /client\.query\("ROLLBACK"\)/);
  assert.match(contract, /not yet run/);
});

test("DB070 existing project template integration suite never erases immutable revisions", () => {
  assert.match(templateP2, /from pg_trigger|select exists \(select 1 from pg_trigger/);
  assert.match(templateP2, /tgname = 'db07_project_template_versions_append_only'/);
  assert.match(templateP2, /project_templates_current_version_snapshot_fk/);
  assert.match(templateP2, /if \(status\.rows\[0\]\?\.retainHistory\) return/);
  assert.match(templateP2, /fixtureSlug = \(label: string\)/);
  assert.match(templateP2, /fixtureSuffix = randomUUID\(\)/);
  assert.match(templateP2, /getAssignedProjectTemplateDetail/);
  assert.match(templateP2, /finally\s*\{[\s\S]*?set template_version_id = \$1/);
});

test("DB070 contract explicitly preserves same-template assignment reissue", () => {
  assert.match(contract, /A college's live assignment may change/);
  assert.match(contract, /DB-068/);
  assert.match(contract, /Previously materialized project instances retain/);
});

test("DB070 document requires genuine zero-to-head replay before verification", () => {
  assert.match(contract, /Replay empty-to-head/);
  assert.match(contract, /Do not set DONE_VERIFIED from static checks/);
});
