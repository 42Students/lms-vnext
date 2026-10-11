import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const repository = read("src/modules/people/repository.ts");
const service = read("src/modules/people/membership-service.ts");
const domain = read("src/modules/people/membership-domain.ts");
const schema = read("src/db/schema/memberships.ts");
const contract = read("docs/planning/db01-ended-membership-role-race-contract.md");

function section(source, start, end) {
  const at = source.indexOf(start);
  assert.ok(at >= 0, `Missing source anchor ${start}`);
  const until = source.indexOf(end, at + start.length);
  assert.ok(until > at, `Missing end anchor ${end}`);
  return source.slice(at, until);
}

const grant = section(repository, "async addMembershipRole(", "async removeMembershipRole(");
const revoke = section(repository, "async removeMembershipRole(", "async transitionMembershipLifecycle(");
const end = section(repository, "async transitionMembershipLifecycle(", "\n};");
const serviceGrant = section(service, "export async function addMembershipRole(", "export async function removeMembershipRole(");

function hasAtomicParentCheck(source) {
  // Heuristic source-gap detector, NOT a substitute for a PostgreSQL race.
  return /\.from\(collegeMemberships\)[\s\S]{0,550}\.for\(["']update["']\)/.test(source)
    && /status\s*!==?\s*["']ENDED["']|status\s*===?\s*["']ENDED["']/.test(source);
}

test("service rejects ended memberships before initiating role-grant transaction", () => {
  assert.ok(serviceGrant.includes("requireMutableRoleMembership(person)"));
  assert.ok(serviceGrant.indexOf("requireMutableRoleMembership(person)") <
    serviceGrant.indexOf("repository.addMembershipRole("));
});

test("domain forbids mutation when membership is ended", () => {
  assert.match(section(domain, "export function getMembershipLifecyclePatch(", "\n}"), /MEMBERSHIP_ENDED/);
  assert.match(service, /function requireMutableRoleMembership\(person/);
  assert.match(service, /if \(person\.membership\.status === "ENDED"\)/);
});

test("grant transaction locks existing role rows, not the parent membership", () => {
  assert.match(grant, /\.from\(membershipRoles\)/);
  assert.match(grant, /\.for\(["']update["']\)/);
  assert.equal(hasAtomicParentCheck(grant), false);
});

test("grant transaction does not read parent status before INSERT", () => {
  const insertAt = grant.indexOf(".insert(membershipRoles)");
  assert.ok(insertAt > 0);
  assert.doesNotMatch(grant.slice(0, insertAt), /\.from\(collegeMemberships\)/);
});

test("lifecycle transaction serializes on parent row lock", () => {
  assert.match(end, /\.from\(collegeMemberships\)/);
  assert.match(end, /\.for\(["']update["']\)/);
  assert.match(end, /\.update\(collegeMemberships\)/);
});

test("role grants are physical rows without role-specific soft delete", () => {
  const roleSchema = section(schema, "export const membershipRoles = pgTable(", "export const systemRoles");
  assert.match(roleSchema, /membership_roles/);
  assert.doesNotMatch(roleSchema, /deletedAt|revokedAt|deleted_at|revoked_at/);
});

test("inserting a grant is an independent write after service check", () => {
  assert.ok(grant.includes(".insert(membershipRoles)"));
  assert.match(grant, /\.onConflictDoNothing\(\)/);
  assert.ok(!grant.includes("requireMutableRoleMembership("));
});

test("revocation path also locks role rows, not parent status", () => {
  assert.match(revoke, /\.from\(membershipRoles\)/);
  assert.match(revoke, /\.for\(["']update["']\)/);
  assert.equal(hasAtomicParentCheck(revoke), false);
});

test("detector recognizes a synthetic parent-lock and ENDED recheck fix", () => {
  const simulated = `await tx.select({ status: collegeMemberships.status })
    .from(collegeMemberships).where(eq(collegeMemberships.id, membershipId))
    .for("update");
    if (parent.status === "ENDED") throw new Error("MEMBERSHIP_ENDED");`;
  assert.equal(hasAtomicParentCheck(simulated), true);
});

test("contract tracks both lock interleavings and forbids completion claim", () => {
  assert.ok(contract.includes("END wins lock"));
  assert.ok(contract.includes("Grant wins lock"));
  assert.ok(contract.includes("NOT EXECUTED"));
  assert.ok(contract.includes("no new schema registered"));
});

test("this test does not silently mark database acceptance complete", () => {
  assert.ok(contract.includes("Source-only proof cannot establish"));
  assert.doesNotMatch(contract, /PostgreSQL race (?:already )?passed/i);
});
