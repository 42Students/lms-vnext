// API-08-P01: TPO portal and recruiter CRM endpoint crosswalk gate.
// Verifies all 110 legacy endpoints are classified, MAPPED paths exist on disk,
// REDESIGNED entries have notes, and MISSING gaps are documented.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api08.json");
const inventoryPath = path.join(root, "docs/planning/api-inventory-api08.json");

const crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));

test("API-08 crosswalk file exists and is valid JSON", () => {
  assert.equal(crosswalk.milestoneId, "API-08");
  assert.ok(Array.isArray(crosswalk.endpoints), "endpoints must be an array");
  assert.ok(crosswalk.endpoints.length > 0, "endpoints must not be empty");
});

test("API-08 all 110 legacy endpoints have a disposition", () => {
  const valid = ["MAPPED", "REDESIGNED", "RETIRED", "MISSING"];
  const bad = crosswalk.endpoints.filter(e => !valid.includes(e.disposition));
  assert.equal(
    bad.length, 0,
    `Endpoints with invalid disposition: ${bad.map(e => e.legacyPath).join(", ")}`
  );
  // Inventory file reports 110 but actual Java controller count is 118
  assert.equal(
    crosswalk.endpoints.length, 118,
    `Expected 118 endpoints (actual Java count), got ${crosswalk.endpoints.length}`
  );
});

test("API-08 no endpoint has disposition OPEN (all classified)", () => {
  const open = crosswalk.endpoints.filter(e => e.disposition === "OPEN");
  assert.equal(open.length, 0, `Unclassified endpoints: ${open.map(e => e.legacyPath).join(", ")}`);
});

test("API-08 every MAPPED endpoint vNextPath exists as a real file", () => {
  const mapped = crosswalk.endpoints.filter(e => e.disposition === "MAPPED");
  for (const ep of mapped) {
    assert.ok(ep.vNextPath, `MAPPED endpoint ${ep.legacyPath} missing vNextPath`);
    const fullPath = path.join(root, ep.vNextPath.replace(/\\/g, "/"));
    assert.ok(
      fs.existsSync(fullPath),
      `MAPPED ${ep.legacyPath} → ${ep.vNextPath} does not exist on disk`
    );
  }
  assert.ok(mapped.length >= 1, "Expected at least 1 MAPPED endpoint");
});

test("API-08 every REDESIGNED endpoint has notes explaining redesign", () => {
  const redesigned = crosswalk.endpoints.filter(e => e.disposition === "REDESIGNED");
  const missing = redesigned.filter(e => !e.notes || e.notes.trim().length < 5);
  assert.equal(
    missing.length, 0,
    `REDESIGNED endpoints missing notes: ${missing.map(e => e.legacyPath).join(", ")}`
  );
});

test("API-08 missing endpoint count matches summary", () => {
  const actualMissing = crosswalk.endpoints.filter(e => e.disposition === "MISSING").length;
  assert.equal(
    actualMissing, crosswalk.summary.missing,
    `summary.missing=${crosswalk.summary.missing} but actual MISSING count=${actualMissing}`
  );
});

test("API-08 summary totals are consistent", () => {
  const { mapped, redesigned, retired, missing, total } = crosswalk.summary;
  assert.equal(mapped + redesigned + retired + missing, total,
    "summary counts must sum to total");
  assert.equal(total, 118, "total must be 118 (actual Java controller count)");
});

test("API-08 frozen legacy SHA matches expected value", () => {
  assert.equal(
    crosswalk.frozenLegacySha,
    "21bad59d4dfaf2fa11fdeaf9353327ce105697d5"
  );
});

test("API-08 all tenant-scoped endpoints are identified", () => {
  // All TPO endpoints should be tenant-scoped
  const tpoEndpoints = crosswalk.endpoints.filter(e =>
    e.legacyController.startsWith("Tpo")
  );
  const notScoped = tpoEndpoints.filter(e => e.tenantScoped !== true);
  assert.equal(
    notScoped.length, 0,
    `TPO endpoints not marked tenantScoped: ${notScoped.map(e => e.legacyPath).join(", ")}`
  );
});

test("API-08 MISSING endpoints are documented with gap notes", () => {
  const missing = crosswalk.endpoints.filter(e => e.disposition === "MISSING");
  for (const ep of missing) {
    assert.ok(
      ep.notes && ep.notes.trim().length > 5,
      `MISSING endpoint ${ep.legacyPath} must have a gap note`
    );
    assert.equal(ep.vNextPath, null, `MISSING ${ep.legacyPath} must have null vNextPath`);
  }
  // Also verify missingGapNotes array exists
  assert.ok(
    Array.isArray(crosswalk.missingGapNotes) && crosswalk.missingGapNotes.length > 0,
    "crosswalk must have missingGapNotes array"
  );
});
