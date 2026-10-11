import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(resolve(root, p), "utf8");
const sql = read("docs/planning/sql/db01-college-membership-domain-archive-guard-staging.sql");
const service = read("src/modules/colleges/service.ts");
const people = read("src/modules/people/repository.ts");
const domains = read("src/modules/tenant-domains/repository.ts");
const pg = read("tests/db01-college-membership-domain-archive-pg.test.mjs");

function executable(value) {
  return value.replace(/^\s*--[^\n]*$/gm, "").replace(/\s+/g, " ");
}
function missing(value) {
  const body = executable(value);
  const checks = [
    [/FUNCTION db01_membership_active_college_guard\(\)/i, "membership guard function"],
    [/BEFORE INSERT OR UPDATE OF college_id, status ON college_memberships/i, "membership insert/reparent/reactivation trigger"],
    [/NEW.status = 'ENDED'/i, "preserved ended membership history"],
    [/IF parent_status IS DISTINCT FROM 'ACTIVE'/gi, "parent ACTIVE test in both child guards"],
    [/FUNCTION db01_domain_active_college_guard\(\)/i, "domain guard function"],
    [/BEFORE INSERT OR UPDATE OF college_id ON tenant_domains/i, "domain insert/reparent trigger"],
    [/FUNCTION db01_college_archive_db01_children_guard\(\)/i, "archive-side guard function"],
    [/BEFORE UPDATE OF status ON colleges/i, "archive transition trigger"],
    [/NEW.status = 'ARCHIVED'/i, "archive state predicate"],
    [/m.status <> 'ENDED'/i, "suspended and active membership retention"],
    [/EXISTS[\s\S]*?FROM tenant_domains AS d[\s\S]*?d.college_id = OLD.id/i, "hostname presence blocks archive"],
    [/CONSTRAINT = 'db01_memberships_active_college_ck'/i, "membership diagnostic"],
    [/CONSTRAINT = 'db01_tenant_domain_active_college_ck'/i, "domain diagnostic"],
    [/CONSTRAINT = 'db01_college_archive_db01_children_ck'/i, "archive diagnostic"]
  ];
  const result = [];
  for (const [pattern, label] of checks) {
    const matches = body.match(pattern);
    if (!matches || (label === "parent ACTIVE test in both child guards" && matches.length < 2)) {
      result.push(label);
    }
  }
  const locks = body.match(/FROM colleges AS c[\s\S]*?FOR UPDATE;/gi) ?? [];
  if (locks.length < 2) result.push("both child writers must take actual parent FOR UPDATE row lock");
  if (/\bDROP\s+(TABLE|SCHEMA)\b|\bTRUNCATE\b|\bDELETE\s+FROM\b/i.test(body)) {
    result.push("draft must not mutate/drop existing data");
  }
  return result;
}

test("DB01 archive stage guards both college usage families and both sides", () => {
  assert.deepEqual(missing(sql), []);
});
test("service preflight queries exist but are separate from archive UPDATE", () => {
  assert.match(service, /export async function resolveCollegeUsage\(/);
  assert.match(service, /ne\(\s*collegeMemberships.status,\s*"ENDED"/);
  assert.match(service, /tenantDomainRows/);
  assert.match(service, /export async function archiveCollege\(/);
  assert.match(service, /assertCollegeCanArchive\(usage\)/);
  assert.match(service, /status: "ARCHIVED"/);
});
test("source exposes previously unchecked membership and domain inserts", () => {
  assert.match(people, /async persistPersonMembership\(/);
  assert.match(people, /\.insert\(collegeMemberships\)/);
  assert.match(domains, /async createDomain\(/);
  assert.match(domains, /\.insert\(tenantDomains\)/);
});
test("mutation deleting child parent FOR UPDATE lock fails", () => {
  assert.ok(missing(sql.replace(/FOR UPDATE;/, ";")).includes("both child writers must take actual parent FOR UPDATE row lock"));
});
test("mutation changing first parent lock to FK-compatible FOR KEY SHARE fails", () => {
  assert.ok(missing(sql.replace("FOR UPDATE;", "FOR KEY SHARE;")).includes("both child writers must take actual parent FOR UPDATE row lock"));
});
test("mutation letting SUSPENDED membership vanish from archive counts fails", () => {
  assert.ok(missing(sql.replace("m.status <> 'ENDED'", "m.status = 'ACTIVE'")).includes("suspended and active membership retention"));
});
test("mutation forgetting membership create trigger fails", () => {
  assert.ok(missing(sql.replace("BEFORE INSERT OR UPDATE OF college_id, status ON college_memberships", "BEFORE UPDATE OF created_at ON college_memberships")).includes("membership insert/reparent/reactivation trigger"));
});
test("mutation forgetting hostname create trigger fails", () => {
  assert.ok(missing(sql.replace("BEFORE INSERT OR UPDATE OF college_id ON tenant_domains", "BEFORE UPDATE OF updated_at ON tenant_domains")).includes("domain insert/reparent trigger"));
});
test("mutation omitting hostname usage from college archive fails", () => {
  assert.ok(missing(sql.replace("FROM tenant_domains AS d", "FROM archived_domain_shadow AS d")).includes("hostname presence blocks archive"));
});
test("mutation forgetting college archive trigger fails", () => {
  assert.ok(missing(sql.replace("BEFORE UPDATE OF status ON colleges", "BEFORE UPDATE OF created_at ON colleges")).includes("archive transition trigger"));
});
test("mutation substituting unconditional ARCHIVED child acceptance fails", () => {
  assert.ok(missing(sql.replaceAll("parent_status IS DISTINCT FROM 'ACTIVE'", "FALSE")).includes("parent ACTIVE test in both child guards"));
});
test("mutation destructive cleanup is prohibited", () => {
  assert.ok(missing(sql + "\nDELETE FROM college_memberships;").includes("draft must not mutate/drop existing data"));
});
test("PostgreSQL witness is safe gated and has four true two-connection races", () => {
  assert.match(pg, /DB01_RACE_DISPOSABLE/);
  assert.match(pg, /TEST_DATABASE_URL !== process\.env\.DATABASE_URL/);
  assert.match(pg, /CREATE SCHEMA/);
  assert.match(pg, /DROP SCHEMA/);
  assert.match(pg, /wait_event_type/);
  assert.match(pg, /awaitLock\(/);
  for (const kind of ["membership", "domain"]) {
    for (const winner of ["child", "archive"]) {
      assert.ok(pg.includes('race("' + kind + '", "' + winner + '")'));
    }
  }
});
