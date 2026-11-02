#!/usr/bin/env node
// UI-08 P03: Source parity test — TPO and recruiter CRM
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventory = JSON.parse(
  fs.readFileSync(path.join(root, "docs/planning/ui-inventory-ui08.json"), "utf8")
);
const catalogue = JSON.parse(
  fs.readFileSync(path.join(root, "docs/planning/ui-strings-ui08.json"), "utf8")
);

describe("UI-08 source parity — TPO and recruiter CRM", () => {
  test("inventory file exists and references UI-08", () => {
    const domainStr = (inventory.domain || inventory.milestone || "").toLowerCase();
    assert.ok(
      domainStr.includes("08") || domainStr.includes("tpo") || domainStr.includes("recruiter"),
      "inventory must reference UI-08 or tpo/recruiter"
    );
    assert.ok(Array.isArray(inventory.surfaces), "surfaces must be array");
    assert.ok(inventory.surfaces.length >= 15, `expected >= 15 surfaces, got ${inventory.surfaces.length}`);
  });

  test("string catalogue file exists", () => {
    const domainStr = (catalogue.milestone || catalogue.domain || "").toLowerCase();
    assert.ok(
      domainStr.includes("08") || domainStr.includes("tpo") || domainStr.includes("recruiter"),
      "catalogue must reference UI-08 or tpo/recruiter"
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

  describe("key TPO and recruiter pages exist", () => {
    const tpoBase = "src/app/(authenticated)/tpo";
    const hrBase = "src/app/(authenticated)/hr";
    test("TPO or HR area exists in vNext", () => {
      const tpoExists = fs.existsSync(path.join(root, tpoBase));
      const hrExists = fs.existsSync(path.join(root, hrBase));
      const recruiterExists = fs.existsSync(path.join(root, "src/app/(authenticated)/recruiter"));
      assert.ok(
        tpoExists || hrExists || recruiterExists,
        "At least one of tpo/hr/recruiter directories must exist in vNext"
      );
    });
  });
});
