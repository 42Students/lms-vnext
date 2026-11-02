// API-02-P01: Academics, groups and electives endpoint crosswalk gate.
// Source-only — no database required.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api02.json");
const FROZEN_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const EXPECTED_TOTAL = 94;

let crosswalk;

test("API-02 crosswalk file exists and is valid JSON", () => {
  assert.ok(fs.existsSync(crosswalkPath), "api-crosswalk-api02.json must exist");
  crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.equal(crosswalk.milestoneId, "API-02");
  assert.ok(Array.isArray(crosswalk.endpoints), "endpoints must be an array");
});

test("API-02 all 94 legacy endpoints have a disposition", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.equal(crosswalk.endpoints.length, EXPECTED_TOTAL,
    `Expected ${EXPECTED_TOTAL} endpoints, got ${crosswalk.endpoints.length}`);
  const missing = crosswalk.endpoints.filter(e => !e.disposition);
  assert.equal(missing.length, 0,
    `Endpoints without disposition: ${missing.map(e => e.legacyPath).join(", ")}`);
});

test("API-02 no endpoint has disposition OPEN", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const open = crosswalk.endpoints.filter(e => e.disposition === "OPEN");
  assert.equal(open.length, 0,
    `OPEN (unclassified) endpoints: ${open.map(e => e.legacyPath).join(", ")}`);
});

test("API-02 every MAPPED endpoint vNextPath exists as a real file", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const mapped = crosswalk.endpoints.filter(e => e.disposition === "MAPPED");
  assert.ok(mapped.length > 0, "Expected at least one MAPPED endpoint");
  for (const ep of mapped) {
    assert.ok(ep.vNextPath, `MAPPED endpoint ${ep.legacyPath} missing vNextPath`);
    const fullPath = path.join(root, ep.vNextPath);
    assert.ok(fs.existsSync(fullPath),
      `MAPPED vNextPath does not exist on disk: ${ep.vNextPath} (for ${ep.legacyPath})`);
  }
});

test("API-02 every REDESIGNED endpoint has a vNextPath and notes explaining the redesign", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const redesigned = crosswalk.endpoints.filter(e => e.disposition === "REDESIGNED");
  assert.ok(redesigned.length > 0, "Expected at least one REDESIGNED endpoint");
  for (const ep of redesigned) {
    assert.ok(ep.vNextPath, `REDESIGNED endpoint ${ep.legacyPath} missing vNextPath`);
    assert.ok(ep.notes && ep.notes.length > 0,
      `REDESIGNED endpoint ${ep.legacyPath} missing notes`);
    const fullPath = path.join(root, ep.vNextPath);
    assert.ok(fs.existsSync(fullPath),
      `REDESIGNED vNextPath does not exist on disk: ${ep.vNextPath} (for ${ep.legacyPath})`);
  }
});

test("API-02 missing endpoint count matches summary", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const missing = crosswalk.endpoints.filter(e => e.disposition === "MISSING");
  assert.equal(missing.length, crosswalk.summary.missing,
    `Missing count mismatch: found ${missing.length} but summary says ${crosswalk.summary.missing}`);
  assert.ok(crosswalk.missingGapNotes && crosswalk.missingGapNotes.length > 0,
    "Missing gap notes must be documented");
  // Every MISSING endpoint must have null vNextPath
  for (const ep of missing) {
    assert.equal(ep.vNextPath, null,
      `MISSING endpoint ${ep.legacyPath} should have null vNextPath`);
  }
});

test("API-02 frozen legacy SHA matches expected value", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.equal(crosswalk.frozenLegacySha, FROZEN_SHA,
    "frozenLegacySha must match canonical frozen legacy backend SHA");
});

test("API-02 tenant-scoped endpoints are identified", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const withScope = crosswalk.endpoints.filter(e => e.tenantScoped === true || e.tenantScoped === false);
  assert.equal(withScope.length, EXPECTED_TOTAL,
    "All endpoints must have tenantScoped field set");
  const tenantScoped = crosswalk.endpoints.filter(e => e.tenantScoped === true);
  assert.ok(tenantScoped.length > 0, "At least some endpoints must be tenant-scoped");
});

test("API-02 summary counts are internally consistent", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const { total, mapped, redesigned, retired, missing } = crosswalk.summary;
  assert.equal(mapped + redesigned + (retired || 0) + missing, total,
    `Summary counts don't add up: ${mapped}+${redesigned}+${retired||0}+${missing} != ${total}`);
  assert.equal(total, EXPECTED_TOTAL, `Summary total must be ${EXPECTED_TOTAL}`);
});
