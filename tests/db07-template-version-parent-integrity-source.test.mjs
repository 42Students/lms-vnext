import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const schema = read("src/db/schema/projects.ts");
const service = read("src/modules/projects/template-service.ts");
const instance = read("src/modules/projects/instance-service.ts");
const core = read("docs/planning/sql/db07-w03-core-project-relationship-integrity-candidate.sql");
const sql = read("docs/planning/sql/db07-template-version-parent-integrity-staging.sql");
const contract = read("docs/planning/db07-template-version-integrity-contract.md");

function tableBlock(name) {
  const at = schema.indexOf(`export const ${name} =`);
  assert.notEqual(at, -1, `Missing source declaration ${name}`);
  const next = schema.indexOf("\nexport const ", at + 1);
  return schema.slice(at, next < 0 ? undefined : next);
}

test("DB068 version knows its canonical template parent", () => {
  const block = tableBlock("projectTemplateVersions");
  assert.match(block, /templateId:\s*uuid\("template_id"\)/);
  assert.match(block, /references\(\(\) => projectTemplates\.id/);
});

test("DB068 college assignments contain both independently referenced columns", () => {
  const block = tableBlock("projectTemplateCollegeAssignments");
  assert.match(block, /templateId:\s*uuid\("template_id"\)/);
  assert.match(block, /templateVersionId:\s*uuid\("template_version_id"\)/);
  assert.match(block, /references\(\(\) => projectTemplateVersions\.id/);
});

test("DB068 project instances contain both independent template references", () => {
  const block = tableBlock("projectInstances");
  assert.match(block, /templateId:\s*uuid\("template_id"\)/);
  assert.match(block, /templateVersionId:\s*uuid\("template_version_id"\)/);
  assert.match(block, /references\(\(\) => projectTemplateVersions\.id/);
});

test("DB068 staging supplies the PostgreSQL composite-unique parent target", () => {
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS\s+project_template_versions_template_id_id_uq\s+ON project_template_versions\s*\(template_id, id\)/i);
});

test("DB068 assignment constraint enforces same template as the version", () => {
  assert.match(sql, /ALTER TABLE project_template_college_assignments\s+ADD CONSTRAINT project_template_assignments_template_version_owner_fk\s+FOREIGN KEY \(template_id, template_version_id\)\s+REFERENCES project_template_versions \(template_id, id\)\s+ON DELETE RESTRICT/i);
});

test("DB068 instance constraint enforces same template as the version", () => {
  assert.match(sql, /ALTER TABLE project_instances\s+ADD CONSTRAINT project_instances_template_version_owner_fk\s+FOREIGN KEY \(template_id, template_version_id\)\s+REFERENCES project_template_versions \(template_id, id\)\s+ON DELETE RESTRICT/i);
});

test("DB068 preflight counts both mismatch shapes and aborts bad data", () => {
  assert.match(sql, /FROM project_template_college_assignments a\s+JOIN project_template_versions v ON v\.id = a\.template_version_id\s+WHERE a\.template_id <> v\.template_id/i);
  assert.match(sql, /FROM project_instances p\s+JOIN project_template_versions v ON v\.id = p\.template_version_id\s+WHERE p\.template_id <> v\.template_id/i);
  assert.match(sql, /RAISE EXCEPTION 'DB07 template-version owner mismatch; reject migration'/);
  assert.match(sql, /ERRCODE = '23514'/);
});

test("DB068 does not introduce destructive or active schema DDL", () => {
  assert.doesNotMatch(sql, /\b(?:DROP|TRUNCATE|DELETE FROM)\b\s+(?:TABLE\s+)?project_/i);
  assert.doesNotMatch(sql, /CREATE TABLE /i);
  assert.match(sql, /NOT registered in the Drizzle migration journal/);
});

test("DB068 retains legal same-template assignment version advancement", () => {
  assert.match(service, /export async function assignProjectTemplateToCollege/);
  assert.match(service, /templateVersionId: version\.id/);
  assert.match(sql, /existing assignment may deliberately be updated to a NEW version of the\s+-- SAME template/);
  assert.doesNotMatch(sql, /CHECK\s*\(\s*revoked_at\s+is\s+null/i);
});

test("DB068 application instance creation joins version with its parent template", () => {
  assert.match(instance, /eq\(\s*projectTemplateVersions\.templateId,\s*projectTemplateCollegeAssignments\.templateId/);
  assert.match(instance, /templateVersionId:\s*assigned\.templateVersionId/);
});

test("DB068 existing core candidate does not already own these constraints", () => {
  assert.doesNotMatch(core, /project_template_assignments_template_version_owner_fk/);
  assert.doesNotMatch(core, /project_instances_template_version_owner_fk/);
});

test("DB068 contract explicitly retains unverified acceptance", () => {
  assert.match(contract, /STAGED SOURCE IMPLEMENTATION, NOT REGISTERED OR POSTGRES-VERIFIED/);
  assert.match(contract, /23503/);
  assert.match(contract, /DB07_TEMPLATE_SCOPE_ENFORCED=1/);
  assert.match(contract, /No numbered Drizzle migration/);
});
