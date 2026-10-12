// DB067 continuation: source-level guard only. Not PostgreSQL acceptance.
// Execute: node --test tests/db10-outbound-scope-fk-source.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const colleges = read("src/db/schema/colleges.ts");
const draft = read("src/db/schema/db10-outbound-messages.draft.ts");
const sql = read("docs/planning/sql/db10-outbound-scope-fk-staging.sql");
const enqueue = read("src/modules/operations/outbound-delivery-queue.ts");
const registered = read("src/db/schema/index.ts");
const pg = read("tests/integration/db10-outbound-scope-fk.test.ts");

test("the registered college table has an organization owner", () => {
  assert.match(colleges, /organizationId:\s*uuid\("organization_id"\)/);
  assert.match(colleges, /\.references\(\(\) => organizations\.id/);
});

test("outbox draft enforces the tenant pair, not just independent FKs", () => {
  assert.match(draft, /foreignKey\(\{[\s\S]*?name:\s*"db10_outbound_college_organization_fk"/);
  assert.match(draft, /columns:\s*\[t\.collegeId,\s*t\.organizationId\]/);
  assert.match(draft, /foreignColumns:\s*\[colleges\.id,\s*colleges\.organizationId\]/);
  assert.match(draft, /\}\)\.onUpdate\("restrict"\)\.onDelete\("restrict"\)/);
});

test("the migration proposes the unique parent key before composite child FK", () => {
  const parent = sql.indexOf("CREATE UNIQUE INDEX colleges_id_organization_uq");
  const child = sql.indexOf("ADD CONSTRAINT db10_outbound_college_organization_fk");
  assert.ok(parent >= 0 && child > parent);
  assert.match(sql, /ON colleges \(id, organization_id\)/);
  assert.match(sql, /FOREIGN KEY \(college_id, organization_id\)\s+REFERENCES colleges \(id, organization_id\)/);
});

test("the migration will fail closed on preexisting mismatched records", () => {
  assert.match(sql, /LEFT JOIN colleges c ON c\.id = m\.college_id/);
  assert.match(sql, /m\.organization_id IS DISTINCT FROM c\.organization_id/);
  assert.match(sql, /IF EXISTS \(/);
  assert.match(sql, /RAISE EXCEPTION 'DB10 outbound organization\/college scope mismatch'/);
  assert.match(sql, /ERRCODE = '23514'/);
});

test("a college cannot silently change owner while outbox references exist", () => {
  assert.match(sql, /ON UPDATE RESTRICT\s+ON DELETE RESTRICT/);
  assert.match(pg, /transfer|reassignment/);
});

test("producer still verifies ACTIVE persisted tenancy before encryption/insert", () => {
  assert.match(enqueue, /requirePermission\(context, "placements\.manage"/);
  assert.match(enqueue, /c\.organization_id = \$\{intent\.organizationId\}/);
  assert.match(enqueue, /c\.status = 'ACTIVE'/);
  assert.match(enqueue, /o\.status = 'ACTIVE'/);
  assert.ok(
    enqueue.indexOf("if (verifiedScope.rows[0]?.valid !== true)") <
    enqueue.indexOf("const envelope = sealOutboundDelivery"),
  );
});

test("draft remains unregistered, with no automatic data rewrites", () => {
  assert.doesNotMatch(registered, /\.\/db10-outbound-messages\.draft/);
  assert.match(sql, /DO NOT APPLY directly/);
  assert.doesNotMatch(sql, /\bUPDATE\s+outbound_messages\b|\bDELETE\s+FROM\s+outbound_messages\b/i);
});

test("opt-in PG witness requires explicit disposable database and catalogs FK", () => {
  assert.match(pg, /DB10_OUTBOUND_SCOPE_FK_ENFORCED === "1"/);
  assert.match(pg, /process\.env\.TEST_DATABASE_URL/);
  assert.doesNotMatch(pg, /\?\?\s*process\.env\.DATABASE_URL/);
  assert.match(pg, /endsWith\("_test"\)/);
  assert.match(pg, /pg_constraint/);
  assert.match(pg, /db10_outbound_college_organization_fk/);
  assert.match(pg, /client\.query\("ROLLBACK"\)/);
});

test("PG witness covers valid and forged pairs, update and owner transfer", () => {
  assert.match(pg, /allows a matching college-and-organization outbox row/);
  assert.match(pg, /rejects a valid but foreign organization on INSERT/);
  assert.match(pg, /rejects UPDATE that swaps the organization/);
  assert.match(pg, /rejects UPDATE that swaps the college/);
  assert.match(pg, /rejects college ownership transfer while outbound rows reference it/);
  assert.match(pg, /23503/);
});

test("mutating the composite relationship is detected", () => {
  const valid = (text) =>
    text.includes("columns: [t.collegeId, t.organizationId]") &&
    text.includes("foreignColumns: [colleges.id, colleges.organizationId]");
  assert.equal(valid(draft), true);
  assert.equal(valid(draft.replace("t.organizationId]", "t.collegeId]")), false);
  assert.equal(valid(draft.replace("colleges.organizationId]", "colleges.id]")), false);
});
