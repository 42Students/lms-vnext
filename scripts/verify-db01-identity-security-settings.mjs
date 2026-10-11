import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expected = Object.freeze({
  baseDomain: { defaultValue: "42lms.com", type: "HOSTNAME", storage: "DEPLOYMENT_CONFIG", client: false },
  globalHost: { defaultValue: "", type: "HOSTNAME_OR_EMPTY", storage: "DEPLOYMENT_CONFIG", client: false },
  cookieDomain: { defaultValue: "", type: "COOKIE_DOMAIN_OR_EMPTY", storage: "DEPLOYMENT_CONFIG", client: false },
  cookieSameSite: { defaultValue: "Lax", type: "COOKIE_SAMESITE", storage: "DEPLOYMENT_CONFIG", client: false },
  "otp.maxAttempts": { defaultValue: 5, type: "INTEGER", storage: "TYPED_GLOBAL_POLICY_DRAFT", client: false, min: 1, max: 5 },
  "otp.windowSeconds": { defaultValue: 900, type: "INTEGER", storage: "TYPED_GLOBAL_POLICY_DRAFT", client: false, min: 60, max: 3600 },
  "ops.identityMaxJsonSize": { defaultValue: 10000, type: "INTEGER", storage: "TYPED_GLOBAL_POLICY_DRAFT", client: false, min: 1024, max: 131072 },
});

function isSameSet(left, right) {
  return left.length === right.length &&
    new Set(left).size === left.length &&
    left.every((key) => right.includes(key));
}

/**
 * Validate source-level DB01 disposition. This does NOT parse or execute SQL,
 * prove a deployed configuration, or approve the proposed DB design.
 */
export function auditDb01Settings(policy, sourceRegistry, candidateSql) {
  const findings = [];
  const fail = (message) => findings.push(message);
  const rows = Array.isArray(policy?.entries) ? policy.entries : [];
  const sourceRows = Array.isArray(sourceRegistry?.entries) ?
    sourceRegistry.entries.filter((r) => r.domain === "DB01") : [];
  const keys = rows.map((r) => r.key);
  const wanted = Object.keys(expected);

  if (!isSameSet(keys, wanted)) fail("DB01 key set mismatch or duplicate");
  if (!isSameSet(sourceRows.map((r) => r.key), wanted)) {
    fail("Legacy DB01 source registry keys changed");
  }
  if (policy?.status !== "SOURCE_SUPPORTED_POLICY_PROPOSAL_NOT_APPROVED_NOT_REGISTERED") {
    fail("DB01 policy accidentally claims approval");
  }
  if (policy?.gate?.policyApproved !== false ||
      policy?.gate?.numberedMigrationRegistered !== false ||
      policy?.gate?.postgresAccepted !== false ||
      policy?.gate?.providerAccepted !== false) {
    fail("DB01 policy cannot claim execution or approval");
  }

  for (const row of rows) {
    const expectedRow = expected[row.key];
    if (!expectedRow) continue;
    if (row.defaultValue !== expectedRow.defaultValue ||
        row.valueType !== expectedRow.type) fail(`Incorrect source default/type: ${row.key}`);
    if (row.scope !== "GLOBAL" ||
        row.storage !== expectedRow.storage) fail(`Unexpected scope/storage: ${row.key}`);
    if (row.clientSettingsExposed !== false) {
      fail(`Secret/security setting exposed to generic client-settings: ${row.key}`);
    }
    if (!row.consumer || !row.validation?.rule) fail(`Missing typed consumer/rule: ${row.key}`);
    if (expectedRow.type === "INTEGER") {
      if (row.validation.rule !== "INTEGER_RANGE" ||
          row.validation.min !== expectedRow.min ||
          row.validation.max !== expectedRow.max ||
          !Number.isInteger(row.defaultValue) ||
          row.defaultValue < row.validation.min ||
          row.defaultValue > row.validation.max) {
        fail(`Unsafe integer bound: ${row.key}`);
      }
    }
    if (row.key === "cookieSameSite" &&
        (!isSameSet(row.validation?.accepted ?? [], ["Lax", "Strict"]) ||
         row.validation.noneRequiresExplicitSecurityException !== true)) {
      fail("Cookie SameSite must default to Lax/Strict only");
    }
  }

  for (const sourceRow of sourceRows) {
    if (sourceRow.scope !== "GLOBAL" || sourceRow.disposition !== "ROUTE_DB01") {
      fail(`Legacy source ownership or scope changed: ${sourceRow.key}`);
    }
  }

  const sql = String(candidateSql ?? "").replace(/^\s*--[^\n]*$/gm, "");
  const table = /CREATE\s+TABLE\s+identity_global_security_policy\b/i.test(sql);
  if (!table) fail("Missing typed singleton policy table");
  for (const key of [
    "identity_global_security_policy_singleton_ck",
    "identity_global_security_policy_otp_max_ck",
    "identity_global_security_policy_otp_window_ck",
    "identity_global_security_policy_json_max_ck",
    "identity_global_security_policy_version_ck",
  ]) {
    if (!sql.includes(key)) fail(`Missing named policy constraint: ${key}`);
  }
  if (/\b(DROP\s+(TABLE|SCHEMA)|TRUNCATE|DELETE\s+FROM|GRANT\s+ALL)\b/i.test(sql)) {
    fail("Destructive or broad privilege SQL is not allowed in draft");
  }
  if (/access_token|refresh_token|password\s+(text|varchar)|otp_code\s+(text|varchar)/i.test(sql)) {
    fail("Raw credentials or OTP storage must not be staged");
  }
  if (/cookie_domain\s+|cookie_samesite\s+|base_domain\s+|global_host\s+/i.test(sql)) {
    fail("Deployment-owned host/cookie config cannot silently become DB columns");
  }
  if (!/CHECK\s*\(otp_max_attempts\s+BETWEEN\s+1\s+AND\s+5\)/i.test(sql) ||
      !/CHECK\s*\(otp_window_seconds\s+BETWEEN\s+60\s+AND\s+3600\)/i.test(sql) ||
      !/CHECK\s*\(identity_max_json_size\s+BETWEEN\s+1024\s+AND\s+131072\)/i.test(sql)) {
    fail("Typed policy bounds in SQL diverge from registry");
  }
  return { ok: findings.length === 0, findings, keysChecked: wanted.length };
}

export function auditRepositorySource() {
  const readJson = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));
  const sql = readFileSync(path.join(root,
    "docs/planning/sql/db01-identity-global-security-policy-staging.sql"), "utf8");
  return auditDb01Settings(
    readJson("docs/planning/db01-identity-security-settings-policy.json"),
    readJson("docs/planning/database-parity-app-setting-disposition.json"),
    sql,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditRepositorySource();
  process.stdout.write(JSON.stringify({
    verdict: result.ok ? "SOURCE_CONTRACT_PASS_NOT_DB_VERIFIED" : "SOURCE_CONTRACT_FAIL",
    ...result,
  }, null, 2) + "\n");
  if (!result.ok) process.exitCode = 1;
}
