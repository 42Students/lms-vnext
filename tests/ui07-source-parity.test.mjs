#!/usr/bin/env node
// UI-07 P03: Source parity test — placements (learner and admin)
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventory = JSON.parse(
  fs.readFileSync(path.join(root, "docs/planning/ui-inventory-ui07.json"), "utf8")
);
const catalogue = JSON.parse(
  fs.readFileSync(path.join(root, "docs/planning/ui-strings-ui07.json"), "utf8")
);

describe("UI-07 source parity — placements learner and admin", () => {
  test("inventory file exists and references UI-07", () => {
    const domainStr = (inventory.domain || inventory.milestone || "").toLowerCase();
    assert.ok(
      domainStr.includes("07") || domainStr.includes("placement"),
      "inventory must reference UI-07 or placements"
    );
    assert.ok(Array.isArray(inventory.surfaces), "surfaces must be array");
    assert.ok(inventory.surfaces.length >= 40, `expected >= 40 surfaces, got ${inventory.surfaces.length}`);
  });

  test("string catalogue file exists", () => {
    const domainStr = (catalogue.milestone || catalogue.domain || "").toLowerCase();
    assert.ok(
      domainStr.includes("07") || domainStr.includes("placement"),
      "catalogue must reference UI-07 or placements"
    );
    assert.ok(typeof catalogue.strings === "object", "strings must be object");
    assert.ok(Object.keys(catalogue.strings).length > 0, "catalogue must not be empty");
  });

  test("zero MISSING surfaces", () => {
    const missing = inventory.surfaces.filter(s => s.disposition === "MISSING");
    assert.strictEqual(
      missing.length,
      0,
      `Found ${missing.length} MISSING: ${missing.map(s => s.id + " " + (s.name || s.title || "")).join(", ")}`
    );
  });

  describe("MATCHED surfaces have vNext files on disk", () => {
    const matched = inventory.surfaces.filter(s => s.disposition === "MATCHED");
    for (const surface of matched) {
      test(`${surface.id}: ${surface.name || surface.title || "(untitled)"}`, () => {
        const vNextPath = surface.vNextPath || surface.vnextPath;
        assert.ok(vNextPath, `Surface ${surface.id} has no vNextPath`);
        assert.ok(
          fs.existsSync(path.join(root, vNextPath)),
          `vNext file missing: ${vNextPath} (surface: ${surface.id})`
        );
      });
    }
  });

  describe("key placement pages exist", () => {
    const required = [
      "src/app/(authenticated)/admin/placements/page.tsx",
    ];
    for (const p of required) {
      test(`${p} exists`, () => {
        assert.ok(fs.existsSync(path.join(root, p)), `Missing: ${p}`);
      });
    }
  });
});
