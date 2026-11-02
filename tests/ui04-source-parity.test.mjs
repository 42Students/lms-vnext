#!/usr/bin/env node
// UI-04 P03: Source parity test — courses and learning content
// Verifies every MATCHED surface has a vNext file on disk.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventory = JSON.parse(
  fs.readFileSync(path.join(root, "docs/planning/ui-inventory-ui04.json"), "utf8")
);
const catalogue = JSON.parse(
  fs.readFileSync(path.join(root, "docs/planning/ui-strings-ui04.json"), "utf8")
);

describe("UI-04 source parity — courses and learning content", () => {
  test("inventory file exists and has required fields", () => {
    assert.ok(inventory.domain === "UI-04", "domain must be UI-04");
    assert.ok(Array.isArray(inventory.surfaces), "surfaces must be array");
    assert.ok(inventory.surfaces.length > 0, "surfaces must not be empty");
  });

  test("string catalogue file exists", () => {
    // domain field may be "UI-04" or "ui04-courses-content" depending on agent
    assert.ok(typeof catalogue.domain === "string" && catalogue.domain.toLowerCase().includes("04"), "catalogue must reference UI-04");
    assert.ok(typeof catalogue.strings === "object", "strings must be object");
    assert.ok(Object.keys(catalogue.strings).length > 0, "catalogue must not be empty");
  });

  test("MISSING surfaces are documented (not silently ignored)", () => {
    const missing = inventory.surfaces.filter(s => s.disposition === "MISSING");
    // UI-04 has 1 documented MISSING — S45 (undefined teacher blueprint surface).
    // All MISSING must be tracked and must be built before milestone closes.
    console.log(`MISSING surfaces: ${missing.length} — ${missing.map(s => s.id + " " + (s.title||"untitled")).join(", ")}`);
    // We allow up to 2 MISSING at the P03 stage — these must be built for P04.
    assert.ok(missing.length <= 2, `Too many MISSING surfaces (${missing.length}). Must build them before milestone close.`);
  });

  describe("MATCHED surfaces have vNext files on disk", () => {
    const matched = inventory.surfaces.filter(s => s.disposition === "MATCHED");
    for (const surface of matched) {
      test(`${surface.id}: ${surface.title || "(untitled)"}`, () => {
        const absPath = path.join(root, surface.vNextPath);
        assert.ok(
          fs.existsSync(absPath),
          `vNext file missing: ${surface.vNextPath} (surface: ${surface.id})`
        );
      });
    }
  });

  describe("key course area pages exist", () => {
    const required = [
      "src/app/(authenticated)/admin/courses/page.tsx",
    ];
    for (const p of required) {
      test(`${p} exists`, () => {
        assert.ok(fs.existsSync(path.join(root, p)), `Missing: ${p}`);
      });
    }
  });

  test("inventory surface count matches totalSurfaces field", () => {
    assert.strictEqual(
      inventory.surfaces.length,
      inventory.totalSurfaces,
      `Surface count mismatch: found ${inventory.surfaces.length}, declared ${inventory.totalSurfaces}`
    );
  });
});
