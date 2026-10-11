import assert from "node:assert/strict";
import test from "node:test";
import { auditDb01Settings, auditRepositorySource } from
  "../scripts/verify-db01-identity-security-settings.mjs";

const realPolicy = {
  status: "SOURCE_SUPPORTED_POLICY_PROPOSAL_NOT_APPROVED_NOT_REGISTERED",
  gate: {
    policyApproved: false,
    numberedMigrationRegistered: false,
    postgresAccepted: false,
    providerAccepted: false,
  },
  entries: [
    ["baseDomain", "42lms.com", "HOSTNAME", "DEPLOYMENT_CONFIG", "DNS_FQDN"],
    ["globalHost", "", "HOSTNAME_OR_EMPTY", "DEPLOYMENT_CONFIG", "DNS_FQDN_OR_EMPTY"],
    ["cookieDomain", "", "COOKIE_DOMAIN_OR_EMPTY", "DEPLOYMENT_CONFIG", "HOST_ONLY_BY_DEFAULT_ALLOWLISTED_SUFFIX_ONLY"],
    ["cookieSameSite", "Lax", "COOKIE_SAMESITE", "DEPLOYMENT_CONFIG", "LAX_OR_STRICT_DEFAULT"],
    ["otp.maxAttempts", 5, "INTEGER", "TYPED_GLOBAL_POLICY_DRAFT", "INTEGER_RANGE", 1, 5],
    ["otp.windowSeconds", 900, "INTEGER", "TYPED_GLOBAL_POLICY_DRAFT", "INTEGER_RANGE", 60, 3600],
    ["ops.identityMaxJsonSize", 10000, "INTEGER", "TYPED_GLOBAL_POLICY_DRAFT", "INTEGER_RANGE", 1024, 131072],
  ].map(([key, defaultValue, valueType, storage, rule, min, max]) => ({
    key, defaultValue, valueType, storage, scope: "GLOBAL",
    clientSettingsExposed: false, consumer: "SERVER_POLICY",
    validation: {
      rule, ...(min === undefined ? {} : { min, max }),
      ...(key === "cookieSameSite" ? {
        accepted: ["Lax", "Strict"], noneRequiresExplicitSecurityException: true,
      } : {}),
    },
  })),
};
const sourceRegistry = {
  entries: realPolicy.entries.map(({ key }) => ({
    key, domain: "DB01", scope: "GLOBAL", disposition: "ROUTE_DB01",
  })),
};
const sql = `
CREATE TABLE identity_global_security_policy (
 singleton_key varchar(6) PRIMARY KEY,
 otp_max_attempts integer CONSTRAINT identity_global_security_policy_otp_max_ck CHECK (otp_max_attempts BETWEEN 1 AND 5),
 otp_window_seconds integer CONSTRAINT identity_global_security_policy_otp_window_ck CHECK (otp_window_seconds BETWEEN 60 AND 3600),
 identity_max_json_size integer CONSTRAINT identity_global_security_policy_json_max_ck CHECK (identity_max_json_size BETWEEN 1024 AND 131072),
 policy_version bigint CONSTRAINT identity_global_security_policy_version_ck CHECK (policy_version >= 1),
 CONSTRAINT identity_global_security_policy_singleton_ck CHECK (singleton_key = 'GLOBAL')
);
`;
const clone = (value) => structuredClone(value);
const audit = (policy = realPolicy, registry = sourceRegistry, proposedSql = sql) =>
  auditDb01Settings(policy, registry, proposedSql);
const reject = (data, reason) =>
  assert.ok(!data.ok && data.findings.some((x) => x.includes(reason)),
    JSON.stringify(data));

test("DB01 security policy accepts a strictly typed proposed shape", () => {
  assert.deepEqual(audit(), { ok: true, findings: [], keysChecked: 7 });
});
test("duplicate keys are rejected", () => {
  const p = clone(realPolicy); p.entries.push(clone(p.entries[0]));
  reject(audit(p), "key set mismatch");
});
test("missing auth setting is rejected", () => {
  const p = clone(realPolicy); p.entries.pop();
  reject(audit(p), "key set mismatch");
});
test("unexpected legacy DB01 ownership is rejected", () => {
  const r = clone(sourceRegistry); r.entries.pop();
  reject(audit(realPolicy, r), "source registry keys changed");
});
test("source default 900 second OTP window cannot silently drift", () => {
  const p = clone(realPolicy); p.entries.find((x) => x.key === "otp.windowSeconds").defaultValue = 120;
  reject(audit(p), "Incorrect source default");
});
test("OTP retry ceiling cannot increase beyond persisted counter bound", () => {
  const p = clone(realPolicy); p.entries.find((x) => x.key === "otp.maxAttempts").validation.max = 1000;
  reject(audit(p), "Unsafe integer bound");
});
test("negative identity JSON maximum is rejected", () => {
  const p = clone(realPolicy); p.entries.find((x) => x.key === "ops.identityMaxJsonSize").validation.min = -1;
  reject(audit(p), "Unsafe integer bound");
});
test("cookie SameSite None cannot silently become allowed", () => {
  const p = clone(realPolicy);
  p.entries.find((x) => x.key === "cookieSameSite").validation.accepted.push("None");
  reject(audit(p), "Cookie SameSite");
});
test("security-sensitive settings cannot enter generic client settings", () => {
  const p = clone(realPolicy); p.entries.find((x) => x.key === "cookieDomain").clientSettingsExposed = true;
  reject(audit(p), "exposed to generic client-settings");
});
test("cookie deployment policy cannot be an arbitrary DB value", () => {
  const p = clone(realPolicy); p.entries.find((x) => x.key === "cookieDomain").storage = "TYPED_GLOBAL_POLICY_DRAFT";
  reject(audit(p), "Unexpected scope/storage");
});
test("per-tenant OTP policy is rejected by source-only contract", () => {
  const p = clone(realPolicy); p.entries.find((x) => x.key === "otp.maxAttempts").scope = "COLLEGE";
  reject(audit(p), "Unexpected scope/storage");
});
test("approval and Postgres execution cannot be forged", () => {
  const p = clone(realPolicy); p.gate.postgresAccepted = true;
  reject(audit(p), "cannot claim execution or approval");
});
test("raw bearer columns cannot be added to staged SQL", () => {
  reject(audit(realPolicy, sourceRegistry, sql.replace(");", ", access_token text);")), "Raw credentials");
});
test("destructive DDL cannot be appended to staged SQL", () => {
  reject(audit(realPolicy, sourceRegistry, sql + "DROP TABLE users;"), "Destructive");
});
test("numeric policy bounds must match source-reviewed values", () => {
  reject(audit(realPolicy, sourceRegistry,
    sql.replace("otp_max_attempts BETWEEN 1 AND 5", "otp_max_attempts BETWEEN 0 AND 100")),
    "Typed policy bounds");
});
test("real repository policy and SQL satisfy source-only checks", () => {
  const result = auditRepositorySource();
  assert.equal(result.ok, true, JSON.stringify(result));
});
