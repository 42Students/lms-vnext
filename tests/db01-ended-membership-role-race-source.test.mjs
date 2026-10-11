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
const onboard = section(repository, "async persistPersonMembership(", "async listCollegePeople(");
const life = section(repository, "async transitionMembershipLifecycle(", "\n};");
const serviceGrant = section(service, "export async function addMembershipRole(", "export async function removeMembershipRole(");
const serviceRemove = section(service, "export async function removeMembershipRole(", "export async function updateMembershipLifecycle(");

function guardedParentRoleMutation(source, mutation) {
  const parentAt = source.indexOf(".from(collegeMemberships)");
  const lockAt = source.indexOf('.for("update")', parentAt);
  const endedAt = source.indexOf('parent.status === "ENDED"', lockAt);
  const missingAt = source.indexOf('if (!parent)', lockAt);
  const mutationAt = source.indexOf(mutation);
  return parentAt >= 0 && lockAt > parentAt
    && endedAt > lockAt && endedAt < mutationAt
    && missingAt > lockAt && missingAt < mutationAt;
}

test("service keeps an early ENDED check as defense in depth", () => {
  assert.ok(serviceGrant.includes("requireMutableRoleMembership(person)"));
  assert.ok(serviceRemove.includes("requireMutableRoleMembership(person)"));
  assert.ok(serviceGrant.indexOf("requireMutableRoleMembership(person)") < serviceGrant.indexOf("repository.addMembershipRole("));
});

test("membership lifecycle still defines ENDED as terminal", () => {
  assert.match(domain, /MEMBERSHIP_ENDED/);
  assert.match(service, /function requireMutableRoleMembership\(person/);
  assert.match(service, /if \(person\.membership\.status === "ENDED"\)/);
});

test("grant takes the parent lock and rechecks ENDED before role INSERT", () => {
  assert.equal(guardedParentRoleMutation(grant, ".insert(membershipRoles)"), true);
});

test("grant status check is inside its SQL transaction", () => {
  assert.ok(grant.indexOf("return db.transaction(async (tx) =>") < grant.indexOf(".from(collegeMemberships)"));
  assert.ok(grant.indexOf("parent.status") < grant.indexOf(".insert(membershipRoles)"));
});

test("grant fails closed for a missing or rebound parent membership", () => {
  for (const writer of [grant, revoke]) {
    assert.match(writer, /!parent\s*\|\|/);
    assert.match(writer, /parent\.userId\s*!==\s*mutation\.person\.user\.id/);
    assert.match(writer, /parent\.collegeId\s*!==\s*mutation\.person\.membership\.collegeId/);
    assert.match(writer, /PeopleServiceError\("MEMBERSHIP_NOT_FOUND"\)/);
  }
});

test("role writer checks current owner and college while holding parent lock", () => {
  for (const writer of [grant, revoke]) {
    const lockAt = writer.indexOf('.for("update")');
    const userAt = writer.indexOf("parent.userId !== mutation.person.user.id", lockAt);
    const collegeAt = writer.indexOf("parent.collegeId !== mutation.person.membership.collegeId", lockAt);
    const roleReadAt = writer.indexOf(".from(membershipRoles)", lockAt);
    assert.ok(lockAt >= 0 && userAt > lockAt && collegeAt > lockAt);
    assert.ok(userAt < roleReadAt && collegeAt < roleReadAt);
  }
});

test("onboarding protects owner/college from stale membership rebinding", () => {
  const lockedAt = onboard.indexOf("const [lockedMembership]");
  const rolesAt = onboard.indexOf(".insert(membershipRoles)", lockedAt);
  assert.ok(lockedAt >= 0 && rolesAt > lockedAt);
  for (const line of [
    "lockedMembership.userId !== user.id",
    "lockedMembership.collegeId !== input.collegeId",
  ]) {
    const at = onboard.indexOf(line, lockedAt);
    assert.ok(at > lockedAt && at < rolesAt, line);
  }
});

test("duplicate no-op grants also require live parent after lock", () => {
  assert.ok(grant.indexOf('parent.status === "ENDED"') < grant.indexOf("currentRoles.includes(role)"));
});

test("removal takes the parent lock and rechecks ENDED before role DELETE", () => {
  assert.equal(guardedParentRoleMutation(revoke, ".delete(membershipRoles)"), true);
});

test("removal locks parent before fetching existing child roles", () => {
  assert.ok(revoke.indexOf(".from(collegeMemberships)") < revoke.indexOf(".from(membershipRoles)"));
});

test("last-role guard continues inside the serialized removal transaction", () => {
  assert.ok(revoke.indexOf('parent.status === "ENDED"') < revoke.indexOf("removeMembershipRoleFromSet("));
});

test("onboarding locks and rechecks membership ACTIVE before inserting grants", () => {
  const at = onboard.lastIndexOf(".from(collegeMemberships)");
  const lockAt = onboard.indexOf('.for("update")', at);
  const activeAt = onboard.indexOf('lockedMembership.status !== "ACTIVE"', lockAt);
  const insertAt = onboard.indexOf(".insert(membershipRoles)", lockAt);
  assert.ok(at >= 0 && lockAt > at && activeAt > lockAt && insertAt > activeAt);
});

test("lifecycle uses the same membership parent row lock", () => {
  assert.match(life, /\.from\(collegeMemberships\)/);
  assert.match(life, /\.for\(["']update["']\)/);
  assert.match(life, /\.update\(collegeMemberships\)/);
});

test("both role writers still lock child rows after locking parent", () => {
  for (const writer of [grant, revoke]) {
    assert.ok(writer.indexOf(".from(collegeMemberships)") < writer.indexOf(".from(membershipRoles)"));
    assert.match(writer, /\.from\(membershipRoles\)[\s\S]*?\.for\(["']update["']\)/);
  }
});

test("the new parent row lock is not bypassed by conflict handlers", () => {
  assert.ok(grant.indexOf(".from(collegeMemberships)") < grant.indexOf(".onConflictDoNothing()"));
  assert.match(grant, /\.onConflictDoNothing\(\)/);
});

test("the fix's source guard detects reverting to the old race", () => {
  const legacy = grant.slice(grant.indexOf("const currentRows ="));
  assert.equal(guardedParentRoleMutation(legacy, ".insert(membershipRoles)"), false);
});

test("role schema remains normalized and unchanged by this fix", () => {
  const roleSchema = section(schema, "export const membershipRoles = pgTable(", "export const systemRoles");
  assert.match(roleSchema, /membership_roles/);
  assert.doesNotMatch(roleSchema, /deletedAt|revokedAt|deleted_at|revoked_at/);
});

test("acceptance contract still requires actual two-transaction PostgreSQL evidence", () => {
  assert.ok(contract.includes("END wins lock"));
  assert.ok(contract.includes("Grant wins lock"));
  assert.ok(contract.includes("NOT EXECUTED"));
  assert.ok(contract.includes("Source-only proof cannot establish"));
});
