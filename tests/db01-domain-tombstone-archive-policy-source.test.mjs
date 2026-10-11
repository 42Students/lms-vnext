import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(resolve(root, p), "utf8");
const service = read("src/modules/colleges/service.ts");
const existingGuard = read("docs/planning/sql/db01-college-membership-domain-archive-guard-staging.sql");
const proposedGuard = read("docs/planning/sql/db01-college-archive-tombstone-consistency-staging.sql");
const tombstone = read("docs/planning/sql/db01-tenant-domain-tombstone-staging.sql");
const domainGuard = read("docs/planning/sql/db01-domain-tombstone-state-guard-staging.sql");
const hostSchema = read("src/db/schema/tenant-domains.ts");
const decision = read("docs/planning/db01-domain-tombstone-archive-policy-decision.md");
const manifest = JSON.parse(read("docs/planning/db01-chat02-migration-integration-manifest.json"));
const stripComments = s => s.replace(/^\s*--[^\n]*$/gm, "");
const activeProposal = stripComments(proposedGuard);
const original = stripComments(existingGuard);

test("confirmed current service counts every domain, including hypothetical tombstones", () => {
  assert.match(service, /\.from\(tenantDomains\)[\s\S]*?\.where\([\s\S]*?tenantDomains\.collegeId,[\s\S]*?collegeId/);
  assert.doesNotMatch(hostSchema, /deletedAt: timestamp\("deleted_at"/);
});
test("confirmed original staged archive trigger counts every domain", () => {
  assert.match(original, /FROM tenant_domains AS d\s+WHERE d.college_id = OLD.id/);
  assert.doesNotMatch(original, /d\.deleted_at IS NULL/);
});
test("policy alternative filters active domains but does not relax membership use", () => {
  assert.match(activeProposal, /FROM tenant_domains AS d\s+WHERE d.college_id = OLD.id\s+AND d.deleted_at IS NULL/);
  assert.match(activeProposal, /m.status <> 'ENDED'/);
});
test("alternative only replaces function body; does not duplicate archive trigger", () => {
  assert.match(activeProposal, /CREATE OR REPLACE FUNCTION db01_college_archive_db01_children_guard\(\)/);
  assert.doesNotMatch(activeProposal, /CREATE TRIGGER /);
});
test("archive guard retains stable parent/status SQLSTATE", () => {
  assert.match(activeProposal, /NEW.status = 'ARCHIVED'/);
  assert.match(activeProposal, /OLD.status IS DISTINCT FROM NEW.status/);
  assert.match(activeProposal, /ERRCODE = '23514'/);
  assert.match(activeProposal, /db01_college_archive_db01_children_ck/);
});
test("global host uniqueness remains reserved across old tombstones", () => {
  assert.match(hostSchema, /uniqueIndex\("tenant_domains_host_uq"\)/);
  assert.doesNotMatch(activeProposal, /DROP INDEX/i);
});
test("candidate requires existing tombstone column and update terminal guard", () => {
  assert.match(tombstone, /ADD COLUMN deleted_at timestamptz/);
  assert.match(domainGuard, /db01_domain_tombstone_terminal_ck/);
  assert.match(domainGuard, /db01_domain_hard_delete_forbidden_ck/);
});
test("explicit policy remains unapproved; does not imply completion", () => {
  assert.equal(manifest.readiness.domainTombstoneArchiveUsagePolicyApproved, false);
  assert.match(decision, /not automatically approved/i);
});
test("mutation reverting deleted-at filter is rejected by guard", () => {
  const mutated = activeProposal.replace("AND d.deleted_at IS NULL", "");
  assert.doesNotMatch(mutated, /FROM tenant_domains AS d\s+WHERE d.college_id = OLD.id\s+AND d.deleted_at IS NULL/);
});
test("mutation treating ENDED membership as active changes approved rule", () => {
  const mutated = activeProposal.replace("m.status <> 'ENDED'", "m.status = 'ENDED'");
  assert.doesNotMatch(mutated, /m.status <> 'ENDED'/);
});
test("source decision identifies deadlock and requires coordinated service cutover", () => {
  assert.match(decision, /permanently nonarchivable/);
  assert.match(decision, /resolveCollegeUsage/);
  assert.match(decision, /deleteDomain/);
  assert.match(decision, /(?:all.*usage|usage.*check)/i);
});
test("no destructive changes or live schema registration in alternative", () => {
  assert.doesNotMatch(activeProposal, /\b(?:DROP TABLE|DELETE FROM|TRUNCATE|ALTER TABLE)\b/i);
  assert.match(proposedGuard, /NOT REGISTERED/);
});
