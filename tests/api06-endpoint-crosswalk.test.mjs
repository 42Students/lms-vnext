// API-06-P01: Projects, templates, mentorship and history endpoint crosswalk gate.
// Source-only — no database needed.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api06.json");

let crosswalk;

test("API-06 crosswalk file exists and is valid JSON", () => {
  assert.ok(fs.existsSync(crosswalkPath), "api-crosswalk-api06.json must exist");
  crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.equal(crosswalk.milestoneId, "API-06");
  assert.ok(Array.isArray(crosswalk.endpoints), "endpoints must be an array");
});

test("API-06 all 43 legacy endpoints have a disposition", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const VALID = new Set(["MAPPED", "REDESIGNED", "RETIRED", "MISSING"]);
  const bad = crosswalk.endpoints.filter(e => !VALID.has(e.disposition));
  assert.equal(bad.length, 0, `Endpoints with invalid disposition: ${bad.map(e=>e.legacyPath).join(", ")}`);
  assert.equal(crosswalk.endpoints.length, 43, `Expected 43 endpoints, got ${crosswalk.endpoints.length}`);
});

test("API-06 no endpoint has disposition OPEN", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const open = crosswalk.endpoints.filter(e => e.disposition === "OPEN");
  assert.equal(open.length, 0, `Unclassified OPEN endpoints: ${open.map(e=>e.legacyPath).join(", ")}`);
});

test("API-06 every MAPPED endpoint vNextPath exists as a real file", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const mapped = crosswalk.endpoints.filter(e => e.disposition === "MAPPED");
  assert.ok(mapped.length > 0, "Expected at least one MAPPED endpoint");
  for (const ep of mapped) {
    assert.ok(ep.vNextPath, `MAPPED endpoint ${ep.legacyPath} missing vNextPath`);
    const fullPath = path.join(root, ep.vNextPath);
    assert.ok(fs.existsSync(fullPath), `MAPPED vNextPath does not exist on disk: ${ep.vNextPath}`);
  }
});

test("API-06 every REDESIGNED endpoint has vNextPath and notes", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const redesigned = crosswalk.endpoints.filter(e => e.disposition === "REDESIGNED");
  assert.ok(redesigned.length > 0, "Expected at least one REDESIGNED endpoint");
  for (const ep of redesigned) {
    assert.ok(ep.vNextPath, `REDESIGNED ${ep.legacyPath} missing vNextPath`);
    assert.ok(ep.notes && ep.notes.length > 0, `REDESIGNED ${ep.legacyPath} missing notes`);
    const fullPath = path.join(root, ep.vNextPath);
    assert.ok(fs.existsSync(fullPath), `REDESIGNED vNextPath does not exist on disk: ${ep.vNextPath}`);
  }
});

test("API-06 missing endpoint count matches summary", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const missing = crosswalk.endpoints.filter(e => e.disposition === "MISSING");
  assert.equal(missing.length, crosswalk.summary.missing,
    `MISSING count mismatch: found ${missing.length}, summary says ${crosswalk.summary.missing}`);
  assert.ok(missing.length > 0, "Expected at least one MISSING endpoint to be documented");
  for (const ep of missing) {
    assert.equal(ep.vNextPath, null, `MISSING ${ep.legacyPath} should have null vNextPath`);
    assert.ok(ep.notes && ep.notes.length > 0, `MISSING ${ep.legacyPath} must have notes explaining the gap`);
  }
});

test("API-06 frozen legacy SHA matches expected value", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.equal(
    crosswalk.frozenLegacySha,
    "21bad59d4dfaf2fa11fdeaf9353327ce105697d5",
    "frozenLegacySha must match canonical frozen legacy backend SHA"
  );
});

test("API-06 tenant-scoped endpoints are identified", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const tenantScoped = crosswalk.endpoints.filter(e => e.tenantScoped === true);
  assert.ok(tenantScoped.length > 0, "Expected project endpoints to be tenant-scoped");
  // All project endpoints should be tenant-scoped (college-specific)
  const notScoped = crosswalk.endpoints.filter(e =>
    e.disposition !== "MISSING" && e.tenantScoped !== true
  );
  assert.equal(notScoped.length, 0,
    `Non-tenant-scoped active project endpoints: ${notScoped.map(e=>e.legacyPath).join(", ")}`);
});

test("API-06 summary counts are self-consistent", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const { total, mapped, redesigned, retired, missing } = crosswalk.summary;
  assert.equal(mapped + redesigned + retired + missing, total,
    `Summary counts don't add up: ${mapped}+${redesigned}+${retired}+${missing} != ${total}`);
  assert.equal(total, 43, "Total must be 43");
});
