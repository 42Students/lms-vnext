import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const schema = read("src/db/schema/projects.ts");
const service = read("src/modules/projects/template-service.ts");
const sql = read("docs/planning/sql/db07-template-version-pointer-fks-staging.sql");
const doc = read("docs/planning/db07-template-version-pointer-contract.md");
const pg = read("tests/integration/db07-template-version-pointer-fks.test.ts");

const section = (name) => {
  const at = service.indexOf(`export async function ${name}`);
  assert.ok(at >= 0, `missing project template service writer ${name}`);
  const next = service.indexOf("\nexport async function ", at + 1);
  return service.slice(at, next < 0 ? undefined : next);
};

test("DB071 existing version table has unique (template_id, version) target", () => {
  assert.match(schema, /project_template_versions_template_version_uq/);
  assert.match(schema, /\.on\(table\.templateId, table\.version\)/);
});

test("DB071 registered header checks only numeric ranges, not referential pointers", () => {
  assert.match(schema, /project_templates_current_version_ck/);
  assert.match(schema, /project_templates_published_version_ck/);
});

test("DB071 create writes parent first and revision one later in a transaction", () => {
  const s = section("createProjectTemplate");
  assert.match(s, /db\.transaction\(async \(tx\)/);
  assert.ok(s.indexOf(".insert(projectTemplates)") < s.indexOf(".insert(projectTemplateVersions)"));
});

test("DB071 revise locks and compare-and-swaps currentVersion before inserting its snapshot", () => {
  const s = section("reviseProjectTemplate");
  assert.match(s, /\.for\("update"\)/);
  assert.match(s, /locked\.currentVersion !== input\.expectedVersion/);
  assert.match(s, /currentVersion: locked\.currentVersion \+ 1/);
  assert.match(s, /eq\(projectTemplates\.currentVersion, input\.expectedVersion\)/);
  assert.ok(s.indexOf(".update(projectTemplates)") < s.indexOf(".insert(projectTemplateVersions)"));
});

test("DB071 duplicate writes parent before revision one", () => {
  const s = section("duplicateProjectTemplate");
  assert.match(s, /db\.transaction\(async \(tx\)/);
  assert.ok(s.indexOf(".insert(projectTemplates)") < s.indexOf(".insert(projectTemplateVersions)"));
});

test("DB071 publish explicitly selects owned current revision before header publication", () => {
  const s = section("publishProjectTemplate");
  assert.match(s, /projectTemplateVersions\.templateId/);
  assert.match(s, /projectTemplateVersions\.version/);
  assert.match(s, /publishedVersion:\s*template\.currentVersion/);
});

test("DB071 unpublish clears nullable publishedVersion", () => {
  assert.match(section("unpublishProjectTemplate"), /publishedVersion:\s*null/);
});

test("DB071 staged SQL retains existing target index and uses two FK constraints", () => {
  assert.match(sql, /project_template_versions_template_version_uq/);
  assert.match(sql, /ADD CONSTRAINT project_templates_current_version_snapshot_fk/);
  assert.match(sql, /ADD CONSTRAINT project_templates_published_version_snapshot_fk/);
});

test("DB071 current pointer FK is deferred and cannot break parent-first creation", () => {
  assert.match(sql, /FOREIGN KEY \(id, current_version\)\s+REFERENCES project_template_versions \(template_id, version\)\s+ON DELETE NO ACTION\s+DEFERRABLE INITIALLY DEFERRED/);
});

test("DB071 nullable published pointer FK is deferred with no-action semantics", () => {
  assert.match(sql, /FOREIGN KEY \(id, published_version\)\s+REFERENCES project_template_versions \(template_id, version\)\s+ON DELETE NO ACTION\s+DEFERRABLE INITIALLY DEFERRED/);
});

test("DB071 fail-closed orphan preflight protects both pointers", () => {
  assert.match(sql, /p\.current_version/);
  assert.match(sql, /p\.published_version IS NOT NULL/);
  assert.match(sql, /RAISE EXCEPTION 'DB07 template current\/published version pointer is missing'/);
  assert.equal((sql.match(/\$db07_template_version_pointer_guard\$/g) ?? []).length, 2);
});

test("DB071 draft makes no registered or destructive changes", () => {
  assert.match(sql, /STAGED ONLY/);
  assert.doesNotMatch(sql, /\bDROP\s+(?:TABLE|SCHEMA|INDEX)\b|\bTRUNCATE\b/i);
  assert.match(doc, /not active or runtime verified/);
});

test("DB071 PostgreSQL witness is opt-in, points at safe DB and verifies deferred catalog", () => {
  assert.match(pg, /DB07_TEMPLATE_POINTER_FKS_ENFORCED === "1"/);
  assert.match(pg, /process\.env\.TEST_DATABASE_URL/);
  assert.match(pg, /endsWith\("_test"\)/);
  assert.match(pg, /describe\.skipIf\(!enabled\)/);
  assert.match(pg, /condeferrable/);
  assert.match(pg, /condeferred/);
});

test("DB071 PostgreSQL witness exercises true deferred boundary", () => {
  assert.match(pg, /SET CONSTRAINTS ALL IMMEDIATE/);
  assert.match(pg, /client\.query\("BEGIN"\)/);
  assert.match(pg, /client\.query\("ROLLBACK"\)/);
  assert.match(pg, /23503/);
});

test("DB071 contract hands off full transaction and scope acceptance", () => {
  assert.match(doc, /Parent-first create/);
  assert.match(doc, /Wrong-template|wrong-template/);
  assert.match(doc, /DB-068/);
  assert.match(doc, /DB-070/);
  assert.match(doc, /Do not count source assertions/);
});
