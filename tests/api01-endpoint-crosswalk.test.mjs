#!/usr/bin/env node
// API-01-P01: Endpoint crosswalk completeness test.
// Source-only gate — no database required.
// Verifies:
//   1. Crosswalk JSON exists and is valid
//   2. Every legacy endpoint has a disposition (MAPPED|REDESIGNED|RETIRED|MISSING)
//   3. Summary counts match actual endpoint array
//   4. MAPPED/REDESIGNED entries have a non-null vNextPath
//   5. MISSING entries are explicitly documented (notes required)
//   6. vNextPath files exist on disk (MAPPED/REDESIGNED only)
//   7. Inventory file exists and endpoint counts match

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api01.json");
const inventoryPath = path.join(root, "docs/planning/api-inventory-api01.json");

const VALID_DISPOSITIONS = new Set(["MAPPED", "REDESIGNED", "RETIRED", "MISSING"]);

describe("API-01-P01 endpoint crosswalk", () => {
  let crosswalk;
  let inventory;

  it("crosswalk file exists", () => {
    assert.ok(fs.existsSync(crosswalkPath), `Missing: ${crosswalkPath}`);
  });

  it("crosswalk file parses as valid JSON", () => {
    const raw = fs.readFileSync(crosswalkPath, "utf8");
    crosswalk = JSON.parse(raw);
    assert.ok(crosswalk, "crosswalk is truthy");
  });

  it("crosswalk has milestoneId API-01", () => {
    assert.equal(crosswalk.milestoneId, "API-01");
  });

  it("crosswalk has required top-level fields", () => {
    assert.ok(crosswalk.summary, "has summary");
    assert.ok(Array.isArray(crosswalk.endpoints), "has endpoints array");
    assert.ok(crosswalk.frozenLegacySha, "has frozenLegacySha");
  });

  it("summary total matches endpoints array length", () => {
    assert.equal(
      crosswalk.endpoints.length,
      crosswalk.summary.total,
      `summary.total (${crosswalk.summary.total}) !== endpoints.length (${crosswalk.endpoints.length})`
    );
  });

  it("summary counts match actual disposition counts", () => {
    const counts = { mapped: 0, redesigned: 0, retired: 0, missing: 0 };
    for (const ep of crosswalk.endpoints) {
      const key = ep.disposition.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    }
    assert.equal(counts.mapped, crosswalk.summary.mapped,
      `mapped: expected ${crosswalk.summary.mapped} got ${counts.mapped}`);
    assert.equal(counts.redesigned, crosswalk.summary.redesigned,
      `redesigned: expected ${crosswalk.summary.redesigned} got ${counts.redesigned}`);
    assert.equal(counts.retired, crosswalk.summary.retired,
      `retired: expected ${crosswalk.summary.retired} got ${counts.retired}`);
    assert.equal(counts.missing, crosswalk.summary.missing,
      `missing: expected ${crosswalk.summary.missing} got ${counts.missing}`);
  });

  it("every endpoint has a valid disposition", () => {
    const bad = crosswalk.endpoints.filter(ep => !VALID_DISPOSITIONS.has(ep.disposition));
    assert.equal(
      bad.length, 0,
      `Invalid dispositions: ${bad.map(e => `${e.legacyPath}:${e.disposition}`).join(", ")}`
    );
  });

  it("every endpoint has legacyPath, legacyMethod, legacyController", () => {
    const bad = crosswalk.endpoints.filter(
      ep => !ep.legacyPath || !ep.legacyMethod || !ep.legacyController
    );
    assert.equal(
      bad.length, 0,
      `Missing required fields on: ${bad.map(e => e.legacyPath || "(no path)").join(", ")}`
    );
  });

  it("MAPPED and REDESIGNED entries have vNextPath", () => {
    const bad = crosswalk.endpoints.filter(
      ep => (ep.disposition === "MAPPED" || ep.disposition === "REDESIGNED") && !ep.vNextPath
    );
    assert.equal(
      bad.length, 0,
      `MAPPED/REDESIGNED without vNextPath: ${bad.map(e => e.legacyPath).join(", ")}`
    );
  });

  it("MISSING entries have non-empty notes", () => {
    const bad = crosswalk.endpoints.filter(
      ep => ep.disposition === "MISSING" && (!ep.notes || ep.notes.trim() === "")
    );
    assert.equal(
      bad.length, 0,
      `MISSING without notes: ${bad.map(e => e.legacyPath).join(", ")}`
    );
  });

  it("RETIRED entries have non-empty notes", () => {
    const bad = crosswalk.endpoints.filter(
      ep => ep.disposition === "RETIRED" && (!ep.notes || ep.notes.trim() === "")
    );
    assert.equal(
      bad.length, 0,
      `RETIRED without notes: ${bad.map(e => e.legacyPath).join(", ")}`
    );
  });

  it("vNextPath files exist on disk for MAPPED and REDESIGNED entries", () => {
    const missing = [];
    for (const ep of crosswalk.endpoints) {
      if (ep.disposition !== "MAPPED" && ep.disposition !== "REDESIGNED") continue;
      if (!ep.vNextPath) continue;
      const abs = path.join(root, ep.vNextPath);
      if (!fs.existsSync(abs)) {
        missing.push(`${ep.legacyPath} → ${ep.vNextPath}`);
      }
    }
    assert.equal(
      missing.length, 0,
      `vNextPath files not found on disk:\n${missing.join("\n")}`
    );
  });

  it("no duplicate legacyPath+legacyMethod combinations", () => {
    const seen = new Set();
    const dupes = [];
    for (const ep of crosswalk.endpoints) {
      const key = `${ep.legacyMethod}:${ep.legacyPath}`;
      if (seen.has(key)) dupes.push(key);
      seen.add(key);
    }
    assert.equal(dupes.length, 0, `Duplicate endpoints: ${dupes.join(", ")}`);
  });

  it("inventory file exists", () => {
    assert.ok(fs.existsSync(inventoryPath), `Missing: ${inventoryPath}`);
  });

  it("inventory endpoint count matches crosswalk summary total", () => {
    const inv = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
    inventory = inv;
    assert.equal(
      inv.totalEndpoints,
      crosswalk.summary.total,
      `inventory.totalEndpoints (${inv.totalEndpoints}) !== crosswalk total (${crosswalk.summary.total})`
    );
  });

  it("crosswalk covers every controller in the inventory", () => {
    const invControllers = new Set(inventory.controllers.map(c => c.className));
    const xwalkControllers = new Set(crosswalk.endpoints.map(e => e.legacyController));
    const uncovered = [...invControllers].filter(c => !xwalkControllers.has(c));
    assert.equal(
      uncovered.length, 0,
      `Inventory controllers not in crosswalk: ${uncovered.join(", ")}`
    );
  });
});
