import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const registry = JSON.parse(readFileSync(
  "docs/planning/database-parity-app-setting-disposition.json", "utf8",
));
const contract = readFileSync(
  "docs/planning/database-parity-app-settings-contract.md", "utf8",
);

test("DB33 registry has one unique disposition per reviewed source key", () => {
  assert.equal(registry.counts.reviewedKeys, 25);
  assert.equal(registry.entries.length, 25);
  assert.equal(new Set(registry.entries.map(e => e.key)).size, 25);
  const allowed = new Set([
    "ROUTE_DB01", "ROUTE_DB05", "ROUTE_DB08", "ROUTE_DB10",
    "MAP_MODULE_ACCESS_RULES", "SOURCE_RETIRED",
  ]);
  for (const row of registry.entries) {
    assert.ok(row.key && row.sourceOwner && row.valueType && row.domain);
    assert.ok(allowed.has(row.disposition), row.key + ": invalid disposition");
    assert.ok(row.evidence, row.key + ": missing source evidence");
  }
});

test("DB33 count summary matches actual dispositions", () => {
  const count = name => registry.entries.filter(e => e.disposition === name).length;
  assert.equal(registry.counts.routeDb01, count("ROUTE_DB01"));
  assert.equal(registry.counts.routeDb05, count("ROUTE_DB05"));
  assert.equal(registry.counts.routeDb08, count("ROUTE_DB08"));
  assert.equal(registry.counts.routeDb10, count("ROUTE_DB10"));
  assert.equal(registry.counts.moduleAccess, count("MAP_MODULE_ACCESS_RULES"));
  assert.equal(registry.counts.sourceRetired, count("SOURCE_RETIRED"));
});

test("DB33 maps only optional module decisions to module_access_rules", () => {
  const moduleRows = registry.entries.filter(e => e.disposition === "MAP_MODULE_ACCESS_RULES");
  assert.deepEqual(moduleRows.map(e => e.key).sort(), [
    "module.electives.enabled",
    "module.electives.locked",
    "module.placements.enabled",
    "module.placements.locked",
    "module.projects.enabled",
    "module.projects.locked",
  ]);
  for (const row of registry.entries.filter(e => !e.key.startsWith("module."))) {
    assert.notEqual(row.disposition, "MAP_MODULE_ACCESS_RULES");
  }
});

test("DB33 preserves source retirement of course module toggles", () => {
  for (const key of ["module.courses.enabled", "module.courses.locked"]) {
    const row = registry.entries.find(e => e.key === key);
    assert.equal(row?.disposition, "SOURCE_RETIRED");
    assert.equal(row?.canonicalTarget, null);
  }
});

test("DB33 routes security, course and placement keys away from DB10 generic ownership", () => {
  const expected = new Map([
    ["otp.maxAttempts", "ROUTE_DB01"],
    ["otp.windowSeconds", "ROUTE_DB01"],
    ["cookieDomain", "ROUTE_DB01"],
    ["cookieSameSite", "ROUTE_DB01"],
    ["course.watchedThresholdPercent", "ROUTE_DB05"],
    ["placement.applyRateLimitPerMinute", "ROUTE_DB08"],
  ]);
  for (const [key, disposition] of expected) {
    assert.equal(registry.entries.find(e => e.key === key)?.disposition, disposition);
  }
});

test("DB33 public-client tunables are explicit and sensitive keys remain outside them", () => {
  const clientKeys = new Set([
    "ui.chatPollIntervalMs",
    "ui.progressSaveIntervalMs",
    "course.watchedThresholdPercent",
  ]);
  for (const key of clientKeys) assert.ok(registry.entries.some(e => e.key === key));
  for (const row of registry.entries.filter(e =>
    e.key.startsWith("otp.") || e.key.startsWith("sms.") ||
    e.key.startsWith("cookie") || e.key === "baseDomain" || e.key === "globalHost"
  )) {
    assert.ok(!clientKeys.has(row.key), row.key + " leaked into client whitelist");
  }
  assert.match(contract, /generic “return all runtime settings” endpoint is a privacy\/security regression/);
});

test("DB33 records arbitrary-key persistence as a typed-registry redesign, not verified parity", () => {
  assert.equal(
    registry.arbitraryKeySurface.disposition,
    "REDESIGN_REQUIRED_TYPED_KEY_REGISTRY",
  );
  assert.deepEqual(
    registry.arbitraryKeySurface.writableScopes,
    ["GLOBAL", "ORGANIZATION", "COLLEGE"],
  );
  assert.match(registry.status, /UNKNOWN_DYNAMIC_KEYS_UNRESOLVED/);
  assert.match(registry.warning, /not proof that no other legacy row\/key can exist/);
  assert.match(contract, /Unknown keys should fail closed/);
});

test("DB33 enumerates all 15 acceptance requirements without claiming execution", () => {
  for (let i = 1; i <= 15; i += 1) {
    const id = "DB33-" + String(i).padStart(2, "0");
    assert.ok(contract.includes(id), "Missing acceptance requirement " + id);
  }
  assert.match(contract, /Required acceptance — NOT RUN/);
  assert.match(contract, /cannot become DONE_VERIFIED until/);
});
