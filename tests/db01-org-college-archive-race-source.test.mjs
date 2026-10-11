import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const stage = read("docs/planning/sql/db01-org-college-archive-race-staging.sql");
const organizations = read("src/modules/organizations/service.ts");
const colleges = read("src/modules/colleges/service.ts");
const schema = read("src/db/schema/colleges.ts");

function code(sql) {
  return sql.replace(/^\s*--[^\n]*$/gm, "").replace(/\s+/g, " ");
}
function flags(sql) {
  const s = code(sql);
  const fail = [];
  const required = [
    [/FUNCTION db01_college_parent_active_guard\(\)/i, "child guard function"],
    [/BEFORE INSERT OR UPDATE OF organization_id, status ON colleges/i, "child insert/update trigger"],
    [/SELECT o\.status INTO parent_status[\s\S]*?FROM organizations AS o[\s\S]*?FOR UPDATE/i, "parent row lock"],
    [/IF parent_status IS DISTINCT FROM 'ACTIVE'/i, "deny archived parent"],
    [/FUNCTION db01_organization_archive_children_guard\(\)/i, "parent guard function"],
    [/BEFORE UPDATE OF status ON organizations/i, "parent archive trigger"],
    [/NEW\.status = 'ARCHIVED'[\s\S]*?EXISTS[\s\S]*?c\.status = 'ACTIVE'/i, "reject active children"],
    [/CONSTRAINT = 'db01_colleges_active_parent_ck'/i, "child diagnostic"],
    [/CONSTRAINT = 'db01_organizations_active_children_ck'/i, "parent diagnostic"],
  ];
  for (const [pattern, reason] of required) if (!pattern.test(s)) fail.push(reason);
  if (/\bDROP\s+(TABLE|SCHEMA)\b|\bTRUNCATE\b|\bDELETE\s+FROM\b/i.test(s)) fail.push("destructive SQL");
  return fail;
}

test("DB01 draft guards both sides of organization archive and college activation", () => {
  assert.deepEqual(flags(stage), []);
});
test("current college service checks org status before insert but has separate DML", () => {
  assert.match(colleges, /export async function createCollege\(/);
  assert.match(colleges, /await loadActiveOrganization\(/);
  assert.match(colleges, /\.insert\(colleges\)/);
});
test("organization archive checks active children before status update", () => {
  assert.match(organizations, /export async function archiveOrganization\(/);
  assert.match(organizations, /eq\(colleges\.status, "ACTIVE"\)/);
  assert.match(organizations, /status: "ARCHIVED"/);
});
test("database FK alone cannot encode active parent status", () => {
  assert.match(schema, /\.references\(\(\) => organizations\.id,/);
  assert.doesNotMatch(schema, /db01_college_parent_active_trg/);
});
test("mutation removing lock is rejected", () => {
  assert.ok(flags(stage.replace("FOR UPDATE;", ";")).includes("parent row lock"));
});
test("mutation allowing active child beneath archived parent is rejected", () => {
  assert.ok(flags(stage.replace("parent_status IS DISTINCT FROM 'ACTIVE'", "FALSE")).includes("deny archived parent"));
});
test("mutation removing archive child check is rejected", () => {
  assert.ok(flags(stage.replace("c.status = 'ACTIVE'", "TRUE")).includes("reject active children"));
});
test("mutation removing child trigger is rejected", () => {
  assert.ok(flags(stage.replace("BEFORE INSERT OR UPDATE OF organization_id, status ON colleges", "BEFORE UPDATE OF created_at ON colleges")).includes("child insert/update trigger"));
});
test("mutation adding destructive cleanup is rejected", () => {
  assert.ok(flags(stage + "\nDELETE FROM colleges;").includes("destructive SQL"));
});
