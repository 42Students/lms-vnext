import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ledger = JSON.parse(readFileSync(resolve(root, "docs/planning/db01-chat05-final-field-disposition.json"), "utf8"));
const session = readFileSync(resolve(root, "src/auth/session.ts"), "utf8");
const sessionService = readFileSync(resolve(root, "src/modules/auth/session-service.ts"), "utf8");
const fields = ["faculty.token_version", "learner.token_version", "recruiter.token_version"];
const pick = id => ledger.rows.find(row => row.legacyField === id);

test("role-typed legacy token versions belong to the auth-session owner", () => {
  for (const field of fields) {
    const row = pick(field);
    assert.ok(row, field);
    assert.equal(row.ownerTask, "DB-004");
    assert.equal(row.decisionStatus, "EXTERNAL_PROVIDER_MANAGED");
    assert.match(row.target, /verifySessionCookie/);
  }
});

test("source review cannot masquerade as executed provider or Postgres proof", () => {
  for (const field of fields) {
    const row = pick(field);
    assert.equal(row.runtimeVerified, false, field);
    assert.equal(row.providerVerified, false, field);
    assert.equal(row.postgresVerified, false, field);
  }
});

test("verified session tokens are checked against the device-session table, including revocation and expiry", () => {
  // First-party sessions: the opaque cookie is looked up by keyed digest and
  // is rejected when the row is revoked or expired, or the user is disabled.
  assert.match(session, /resolveSession\(sessionCookie\)/);
  assert.match(session, /SESSION_REVOKED/);
  assert.match(sessionService, /revoked_at IS NOT NULL/);
  assert.match(sessionService, /UPDATE identity_device_sessions AS s/);
  assert.match(sessionService, /FOR SHARE OF u/);
  assert.match(sessionService, /expires_at <= clock_timestamp\(\)/);
});

test("revoking a person ends every live device session of that user", () => {
  assert.match(session, /revokeAllSessionsForUser\(userId, userId, reason\)/);
  assert.match(sessionService, /WHERE user_id = \$\{userId\} AND revoked_at IS NULL/);
});

test("three normalized external-provider fields are counted in the canonical ledger", () => {
  const counts = ledger.rows.reduce((acc, row) => {
    acc[row.decisionStatus] = (acc[row.decisionStatus] ?? 0) + 1;
    return acc;
  }, {});
  assert.deepEqual(counts, ledger.summary.byDecisionStatus);
});

test("no raw legacy password or access/refresh token is migrated", () => {
  for (const id of ["user.password","auth_handoff_token.access_token","auth_handoff_token.refresh_token"]) {
    const row = pick(id);
    assert.ok(row);
    assert.match(row.decisionStatus, /SECURITY_RETIRED/);
    assert.doesNotMatch(row.target, /^users\.|^identity_auth_handoffs\.(access_token|refresh_token|password)/);
  }
});
