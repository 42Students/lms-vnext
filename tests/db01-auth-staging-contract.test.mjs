import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const read = (p) => readFileSync(path.join(projectRoot, p), "utf8");

const activeSchema = read("src/db/schema/index.ts");
const attempt = read("src/db/schema/db01-auth-attempts.staged.ts");
const handoff = read("src/db/schema/db01-auth-handoffs.staged.ts");
const attemptSql = read("docs/planning/sql/db01-auth-attempts-staging.sql");
const handoffSql = read("docs/planning/sql/db01-auth-handoffs-staging.sql");
const scopedFksSql = read("docs/planning/sql/db01-auth-tenant-composite-fks-staging.sql");
const contract = read("docs/planning/db01-auth-otp-handoff-contract.md");

test("DB01 OTP and handoff schemas are not activated before migration", () => {
  assert.doesNotMatch(activeSchema, /db01-auth-attempts\.staged/);
  assert.doesNotMatch(activeSchema, /db01-auth-handoffs\.staged/);
  assert.match(attemptSql, /STAGED ONLY/);
  assert.match(handoffSql, /STAGED ONLY/);
});

test("OTP attempt schema uses secret-safe code MACs rather than raw OTP columns", () => {
  for (const fragment of [
    '"identity_auth_attempts"',
    '"sms_code_mac"',
    '"email_code_mac"',
    '"contact_fingerprint"',
    '"verification_attempts"',
    '"verified_at"',
    '"used_at"',
    '"expires_at"',
    "identity_auth_attempts_attempt_bounds_ck",
  ]) assert.ok(attempt.includes(fragment), fragment);
  assert.doesNotMatch(attempt, /(?:varchar|text)\("otp"/);
  assert.doesNotMatch(attempt, /(?:varchar|text)\("phone"/);
  assert.doesNotMatch(attempt, /(?:varchar|text)\("email_otp"/);
  assert.match(attemptSql, /verification_attempts < 5/);
  assert.match(attemptSql, /used_at IS NULL/);
});

test("DB01 OTP record has canonical owner, scoped memberships, and expiry", () => {
  for (const fragment of [
    '"user_id"',
    '"college_id"',
    '"membership_id"',
    '"target_role"',
    "identity_auth_attempts_expiry_ck",
    "identity_auth_attempts_sms_shape_ck",
    "identity_auth_attempts_email_shape_ck",
    "identity_auth_attempts_mac_shape_ck",
  ]) assert.ok(attempt.includes(fragment), fragment);
  assert.match(attemptSql, /membership must belong|membership\.college|membership_id.*college/i);
  assert.match(contract, /five-attempt/);
});

test("one-time cross-host handoff persists no access/refresh tokens", () => {
  for (const fragment of [
    '"identity_auth_handoffs"',
    '"code_mac"',
    '"target_host"',
    '"target_domain_id"',
    '"target_membership_id"',
    '"consumed_at"',
    '"expires_at"',
    "identity_auth_handoffs_lifetime_ck",
    "identity_auth_handoffs_consumed_ck",
  ]) assert.ok(handoff.includes(fragment), fragment);
  assert.doesNotMatch(handoff, /(?:varchar|text)\("access_token"/);
  assert.doesNotMatch(handoff, /(?:varchar|text)\("refresh_token"/);
  assert.doesNotMatch(handoff, /(?:varchar|text)\("session_cookie"/);
  assert.match(handoffSql, /consumed_at IS NULL/);
  assert.match(handoffSql, /target_domain_id = \$2/);
});

test("source contract explicitly separates database and provider acceptance", () => {
  assert.match(contract, /managed provider verification/);
  assert.match(contract, /atomic/i);
  assert.match(contract, /tenant/i);
  assert.match(contract, /Never|No raw/i);
  assert.match(contract, /PostgreSQL replay/);
  assert.match(contract, /not.*run through typecheck/i);
});

test("cross-table user/college integrity must be database-enforced at promotion", () => {
  assert.match(attempt, /identity_auth_attempts_membership_scope_fk/);
  assert.match(attempt, /identity_auth_attempts_membership_college_shape_ck/);
  assert.match(handoff, /identity_auth_handoffs_membership_scope_fk/);
  assert.match(handoff, /identity_auth_handoffs_domain_scope_fk/);
  assert.match(handoff, /"college_id"/);
  assert.match(handoffSql, /college_id uuid NOT NULL/);
  assert.match(scopedFksSql, /UNIQUE \(id, user_id, college_id\)/);
  assert.match(scopedFksSql, /UNIQUE \(id, college_id\)/);
  assert.match(scopedFksSql, /FOREIGN KEY \(membership_id, user_id, college_id\)/);
  assert.match(scopedFksSql, /FOREIGN KEY \(target_membership_id, user_id, college_id\)/);
  assert.match(scopedFksSql, /FOREIGN KEY \(target_domain_id, college_id\)/);
});
