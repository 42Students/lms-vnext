// API-07-P01: Placement policies, applications and offer lifecycle endpoint crosswalk gate.
// Source-only — no database required.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cwPath = path.join(root, "docs/planning/api-crosswalk-api07.json");
const FROZEN_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const EXPECTED_TOTAL = 70;

let cw;
test("API-07 crosswalk file exists and is valid JSON", () => {
  assert.ok(fs.existsSync(cwPath), "api-crosswalk-api07.json must exist");
  cw = JSON.parse(fs.readFileSync(cwPath, "utf8"));
  assert.equal(cw.milestoneId, "API-07");
});

test("API-07 all 70 legacy endpoints have a disposition", () => {
  cw = cw || JSON.parse(fs.readFileSync(cwPath, "utf8"));
  assert.equal(cw.endpoints.length, EXPECTED_TOTAL,
    `Expected ${EXPECTED_TOTAL} endpoints, got ${cw.endpoints.length}`);
  const open = cw.endpoints.filter(e => !e.disposition || e.disposition === "OPEN");
  assert.equal(open.length, 0,
    `Unclassified endpoints: ${open.map(e => e.legacyPath).join(", ")}`);
});

test("API-07 summary counts match actual endpoint classifications", () => {
  cw = cw || JSON.parse(fs.readFileSync(cwPath, "utf8"));
  const counts = { mapped: 0, redesigned: 0, retired: 0, missing: 0 };
  for (const e of cw.endpoints) counts[e.disposition.toLowerCase()]++;
  assert.equal(counts.mapped, cw.summary.mapped, `mapped mismatch`);
  assert.equal(counts.redesigned, cw.summary.redesigned, `redesigned mismatch`);
  assert.equal(counts.retired, cw.summary.retired, `retired mismatch`);
  assert.equal(counts.missing, cw.summary.missing, `missing mismatch`);
  assert.equal(
    counts.mapped + counts.redesigned + counts.retired + counts.missing,
    EXPECTED_TOTAL
  );
});

test("API-07 every MAPPED endpoint vNextPath exists as a real file", () => {
  cw = cw || JSON.parse(fs.readFileSync(cwPath, "utf8"));
  const mapped = cw.endpoints.filter(e => e.disposition === "MAPPED");
  for (const e of mapped) {
    assert.ok(e.vNextPath, `MAPPED endpoint ${e.legacyPath} has no vNextPath`);
    const fullPath = path.join(root, e.vNextPath);
    assert.ok(fs.existsSync(fullPath),
      `MAPPED ${e.legacyPath} → vNextPath does not exist: ${e.vNextPath}`);
  }
});

test("API-07 every REDESIGNED endpoint has vNextPath and notes", () => {
  cw = cw || JSON.parse(fs.readFileSync(cwPath, "utf8"));
  const redesigned = cw.endpoints.filter(e => e.disposition === "REDESIGNED");
  for (const e of redesigned) {
    assert.ok(e.vNextPath, `REDESIGNED ${e.legacyPath} missing vNextPath`);
    assert.ok(e.notes && e.notes.length > 0, `REDESIGNED ${e.legacyPath} missing notes`);
    const fullPath = path.join(root, e.vNextPath);
    assert.ok(fs.existsSync(fullPath),
      `REDESIGNED ${e.legacyPath} → vNextPath does not exist on disk: ${e.vNextPath}`);
  }
});

test("API-07 MISSING endpoints are documented with gap notes", () => {
  cw = cw || JSON.parse(fs.readFileSync(cwPath, "utf8"));
  const missing = cw.endpoints.filter(e => e.disposition === "MISSING");
  assert.ok(missing.length > 0, "Expected some MISSING endpoints to be documented");
  for (const e of missing) {
    assert.ok(e.notes && e.notes.length > 0,
      `MISSING endpoint ${e.legacyPath} must have gap notes`);
    assert.equal(e.vNextPath, null, `MISSING endpoint ${e.legacyPath} must have null vNextPath`);
  }
  assert.equal(missing.length, cw.summary.missing,
    `MISSING count ${missing.length} != summary.missing ${cw.summary.missing}`);
});

test("API-07 frozen legacy SHA matches expected value", () => {
  cw = cw || JSON.parse(fs.readFileSync(cwPath, "utf8"));
  assert.equal(cw.frozenLegacySha, FROZEN_SHA,
    "frozenLegacySha must match canonical frozen legacy backend SHA");
});

test("API-07 tenant-scoped endpoints are identified", () => {
  cw = cw || JSON.parse(fs.readFileSync(cwPath, "utf8"));
  const tenantScoped = cw.endpoints.filter(e => e.tenantScoped === true);
  assert.ok(tenantScoped.length > 0, "Expected at least some tenant-scoped endpoints");
  // HR college endpoints are cross-tenant (tenantScoped=false) — verify some exist
  const crossTenant = cw.endpoints.filter(e => e.tenantScoped === false);
  assert.ok(crossTenant.length > 0, "Expected HR/recruiter cross-tenant endpoints");
});

test("API-07 vNext placements domain has substantial route coverage (>50 routes)", () => {
  const placementsDir = path.join(root, "src/app/api/placements");
  assert.ok(fs.existsSync(placementsDir), "src/app/api/placements must exist");
  function countRoutes(dir) {
    let count = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) count += countRoutes(path.join(dir, entry.name));
      else if (entry.name === "route.ts") count++;
    }
    return count;
  }
  const routeCount = countRoutes(placementsDir);
  assert.ok(routeCount > 50,
    `Expected >50 placements route.ts files, found ${routeCount}. vNext placements is substantially built.`);
});
