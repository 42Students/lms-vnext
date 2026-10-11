import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(resolve(root, p), "utf8");
const ddl = read("docs/planning/sql/db01-auth-attempts-staging.sql");
const drizzle = read("src/db/schema/db01-auth-attempts.staged.ts");
const guard = read("docs/planning/sql/db01-auth-attempt-lifecycle-guard-staging.sql");
const pg = read("tests/db01-auth-attempt-lifecycle-pg.test.mjs");
const withoutComments = sql => sql.replace(/^\s*--[^\n]*$/gm, "").replace(/\s+/g, " ");
const constraints = [
  "identity_auth_attempts_timestamp_ck",
  "identity_auth_attempts_five_minute_expiry_ck",
  "identity_auth_attempts_target_role_shape_ck",
  "identity_auth_attempts_consumed_shape_ck",
];

function missing(ddlText, guardText, tsText) {
  const ddlCode = withoutComments(ddlText);
  const triggerCode = withoutComments(guardText);
  const absent = [];
  for (const constraint of constraints) {
    if (!ddlCode.includes("CONSTRAINT " + constraint)) absent.push("SQL missing " + constraint);
    if (!tsText.includes('"' + constraint + '"')) absent.push("Drizzle missing " + constraint);
  }
  const requiredSQL = [
    [/interval '5 minutes'/i, "five-minute source lifetime"],
    [/verified_at\s+IS\s+NOT\s+NULL[\s\S]*?verified_at\s*<=\s*used_at/i, "verified before consumed"],
    [/sms_code_mac\s+IS\s+NULL\s+AND\s+sms_code_expires_at\s+IS\s+NULL/i, "SMS MAC cleared at consume"],
    [/email_code_mac\s+IS\s+NULL\s+AND\s+email_code_expires_at\s+IS\s+NULL/i, "email MAC cleared at consume"]
  ];
  for (const [pattern, reason] of requiredSQL) if (!pattern.test(ddlCode)) absent.push(reason);
  const requiredGuard = [
    [/BEFORE UPDATE ON identity_auth_attempts/i, "trigger bound to updates"],
    [/NEW.user_id IS DISTINCT FROM OLD.user_id/i, "user scope immutable"],
    [/NEW.college_id IS DISTINCT FROM OLD.college_id/i, "college scope immutable"],
    [/NEW.membership_id IS DISTINCT FROM OLD.membership_id/i, "membership scope immutable"],
    [/NEW.target_role IS DISTINCT FROM OLD.target_role/i, "role scope immutable"],
    [/NEW.contact_fingerprint IS DISTINCT FROM OLD.contact_fingerprint/i, "contact scope immutable"],
    [/NEW.verification_attempts < OLD.verification_attempts/i, "verification counter cannot decrease"],
    [/NEW.verification_attempts > OLD.verification_attempts \+ 1/i, "verification budget cannot leap"],
    [/NEW.resend_attempts < OLD.resend_attempts/i, "resend cannot decrease"],
    [/NEW.version <> OLD.version \+ 1/i, "version exactly one step"],
    [/NEW.expires_at > OLD.expires_at/i, "expiry cannot extend"],
    [/OLD.verified_at IS NOT NULL[\s\S]*?NEW.verified_at IS DISTINCT FROM OLD.verified_at/i, "verified sticky"],
    [/OLD.used_at IS NOT NULL[\s\S]*?NEW.used_at IS DISTINCT FROM OLD.used_at/i, "used sticky"],
    [/db01_auth_attempt_verified_mac_immutable_ck/i, "no secret rotate after verification"],
    [/db01_auth_attempt_consumed_immutable_ck/i, "terminal consumed challenge"]
  ];
  for (const [pattern, reason] of requiredGuard) if (!pattern.test(triggerCode)) absent.push(reason);
  if (/\bDROP\s+(?:TABLE|SCHEMA)\b|\bTRUNCATE\b|\bDELETE\s+FROM\b/i.test(ddlCode + " " + triggerCode)) absent.push("destructive staging SQL");
  return absent;
}

test("DB01 candidate SQL and Drizzle staged shape constraints agree", () => {
  assert.deepEqual(missing(ddl, guard, drizzle), []);
});
test("source lifetime bounded to five minutes", () => {
  assert.match(ddl, /expires_at <= created_at \+ interval '5 minutes'/);
  assert.match(drizzle, /identity_auth_attempts_five_minute_expiry_ck/);
});
test("used-at verification shape and secret clearing required in both designs", () => {
  assert.match(ddl, /verified_at <= used_at/);
  for (const col of ["smsCodeMac", "smsCodeExpiresAt", "emailCodeMac", "emailCodeExpiresAt"]) {
    assert.ok(drizzle.includes("table." + col + "} IS NULL"));
  }
});
test("attempt retry & resend budget is immutable across SQL updates", () => {
  assert.match(guard, /NEW.verification_attempts < OLD.verification_attempts/);
  assert.match(guard, /NEW.resend_attempts < OLD.resend_attempts/);
});
test("mutation removing expired challenge protection is rejected", () => {
  assert.ok(missing(ddl, guard.replace("NEW.expires_at > OLD.expires_at", "FALSE"), drizzle).includes("expiry cannot extend"));
});
test("mutation removing user immutability is rejected", () => {
  assert.ok(missing(ddl, guard.replace("NEW.user_id IS DISTINCT FROM OLD.user_id", "FALSE"), drizzle).includes("user scope immutable"));
});
test("mutation removing membership tenant binding is rejected", () => {
  assert.ok(missing(ddl, guard.replace("NEW.college_id IS DISTINCT FROM OLD.college_id", "FALSE"), drizzle).includes("college scope immutable"));
});
test("mutation resetting OTP retries to zero is rejected", () => {
  assert.ok(missing(ddl, guard.replace("NEW.verification_attempts < OLD.verification_attempts", "FALSE"), drizzle).includes("verification counter cannot decrease"));
});
test("mutation dropping optimistic version step is rejected", () => {
  assert.ok(missing(ddl, guard.replace("NEW.version <> OLD.version + 1", "FALSE"), drizzle).includes("version exactly one step"));
});
test("mutation allowing consumed timestamp reset is rejected", () => {
  assert.ok(missing(ddl, guard.replace("NEW.used_at IS DISTINCT FROM OLD.used_at", "FALSE"), drizzle).includes("used sticky"));
});
test("mutation allowing used OTP MAC retention is rejected", () => {
  assert.ok(missing(ddl.replace("sms_code_mac IS NULL AND sms_code_expires_at IS NULL", "true"), guard, drizzle).includes("SMS MAC cleared at consume"));
});
test("mutation removing five-minute bound is rejected", () => {
  assert.ok(missing(ddl.replace("interval '5 minutes'", "interval '90 days'"), guard, drizzle).includes("five-minute source lifetime"));
});
test("source witness is opt-in, independently disposable and observes a real PG lock", () => {
  assert.match(pg, /DB01_AUTH_DISPOSABLE === "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA"/);
  assert.match(pg, /process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL/);
  assert.match(pg, /CREATE SCHEMA/);
  assert.match(pg, /DROP SCHEMA/);
  assert.match(pg, /wait_event_type === "Lock"/);
  assert.match(pg, /reservation/);
  assert.match(pg, /rowCount, 0/);
});
test("SQL staging draft cannot carry destructive data cleanup", () => {
  assert.ok(missing(ddl + "\nDELETE FROM identity_auth_attempts;", guard, drizzle).includes("destructive staging SQL"));
});
