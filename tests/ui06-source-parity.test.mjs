#!/usr/bin/env node
// UI-06 P03: Source parity test — projects and mentorship
// Verifies every MATCHED surface has a vNext file on disk.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventory = JSON.parse(
  fs.readFileSync(path.join(root, "docs/planning/ui-inventory-ui06.json"), "utf8")
);
const catalogue = JSON.parse(
  fs.readFileSync(path.join(root, "docs/planning/ui-strings-ui06.json"), "utf8")
);

describe("UI-06 source parity — projects and mentorship", () => {
  test("inventory file exists and references UI-06", () => {
    const domainStr = (inventory.domain || "").toLowerCase();
    assert.ok(
      domainStr.includes("06") || domainStr.includes("project") || domainStr.includes("mentor"),
      "inventory domain must reference UI-06 or projects/mentorship"
    );
    assert.ok(Array.isArray(inventory.surfaces), "surfaces must be array");
    assert.ok(inventory.surfaces.length > 0, "surfaces must not be empty");
  });

  test("string catalogue file exists", () => {
    const domainStr = (catalogue.milestone || catalogue.domain || "").toLowerCase();
    assert.ok(
      domainStr.includes("06") || domainStr.includes("project") || domainStr.includes("mentor"),
      "catalogue must reference UI-06 or projects/mentorship"
    );
    assert.ok(typeof catalogue.strings === "object", "strings must be object");
    assert.ok(Object.keys(catalogue.strings).length > 0, "catalogue must not be empty");
  });

  test("zero MISSING surfaces (all must be built)", () => {
    const missing = inventory.surfaces.filter(s => s.disposition === "MISSING");
    assert.strictEqual(
      missing.length,
      0,
      `Found ${missing.length} MISSING surfaces: ${missing.map(s => s.id + " " + (s.name || s.title || "")).join(", ")}`
    );
  });

  describe("MATCHED surfaces have vNext files on disk", () => {
    const matched = inventory.surfaces.filter(s => s.disposition === "MATCHED");
    for (const surface of matched) {
      test(`${surface.id}: ${surface.name || surface.title || "(untitled)"}`, () => {
        const absPath = path.join(root, surface.vNextPath);
        assert.ok(
          fs.existsSync(absPath),
          `vNext file missing: ${surface.vNextPath} (surface: ${surface.id})`
        );
      });
    }
  });

  describe("key project pages exist", () => {
    const required = [
      "src/app/(authenticated)/admin/projects/page.tsx",
      "src/app/(authenticated)/admin/projects/templates/page.tsx",
      "src/app/(authenticated)/mentor/projects/page.tsx",
      "src/app/(authenticated)/mentor/reviews/page.tsx",
    ];
    for (const p of required) {
      test(`${p} exists`, () => {
        assert.ok(fs.existsSync(path.join(root, p)), `Missing: ${p}`);
      });
    }
  });

  test("inventory surface count is sane (>= 40 surfaces for projects domain)", () => {
    assert.ok(
      inventory.surfaces.length >= 40,
      `Expected at least 40 surfaces for projects/mentorship, got ${inventory.surfaces.length}`
    );
  });
});
