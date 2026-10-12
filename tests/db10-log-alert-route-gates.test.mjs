import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const paths = [
  "src/app/api/tracker/logs/known-errors/route.ts",
  "src/app/api/tracker/logs/known-errors/[signatureId]/route.ts",
  "src/app/api/tracker/logs/viewed/route.ts",
];
const code = paths.map((path) => readFileSync(path, "utf8"));
const service = readFileSync("src/modules/log-alerts/admin-service.ts", "utf8");
const readiness = readFileSync("src/modules/log-alerts/readiness.ts", "utf8");
const schema = readFileSync("src/db/schema/db10-log-alerts.draft.ts", "utf8");

test("all known-error endpoints fail closed before any database reader", () => {
  assert.match(readiness, /DB10_LOG_ALERTS_READY\s*===\s*"DB10_VERIFIED"/);
  for (const file of code) {
    assert.match(file, /DB10_LOG_ALERTS_MIGRATIONS_PENDING/);
    assert.match(file, /status:\s*503/);
    assert.ok(file.indexOf("if (!logAlertsRuntimeEnabled())") <
      file.indexOf("await getCurrentRequestContext()"));
  }
});

test("mutation endpoints require exact same-origin write protection", () => {
  assert.match(code[1], /isSameOriginRequest\(request\)/);
  assert.match(code[2], /isSameOriginRequest\(request\)/);
  assert.doesNotMatch(code[0], /export async function POST/);
});

test("service gates global super admin, locks triage row and preserves poll cursor", () => {
  assert.match(service, /isSuperAdmin\(context\)/);
  assert.match(service, /context\.adminScope\?\.collegeId/);
  assert.match(service, /context\.adminScope\?\.organizationId/);
  assert.match(service, /\.for\("update"\)/);
  assert.match(service, /onConflictDoUpdate/);
  assert.match(service, /clock_timestamp\(\)/);
  assert.doesNotMatch(service, /sampleMessage:\s*db10LogAlertSignatures\.sampleMessage/);
  assert.match(schema, /db10LogAlertSignatures/);
  assert.match(schema, /db10LogAlertStates/);
});
