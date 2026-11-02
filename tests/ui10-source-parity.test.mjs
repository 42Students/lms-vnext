/**
 * UI-10 P03 — Global visual regression gate
 * Verifies: all 9 milestones (UI-01..UI-09) have P01+P02+P03+P04 done.
 * No browser needed. Fast (<30s).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

const MILESTONES = [
  {
    id: "UI-01",
    inventory: "docs/planning/ui-inventory-ui01.json",
    strings: "docs/planning/ui-strings-ui01.json",
    p03: "tests/ui01-source-parity.test.mjs",
    p04: "tests/ui01-visual-parity.spec.ts",
  },
  {
    id: "UI-02",
    inventory: "docs/planning/ui-inventory-ui02.json",
    strings: "docs/planning/ui-strings-ui02.json",
    p03: "tests/ui02-source-parity.test.mjs",
    p04: "tests/ui02-visual-parity.spec.ts",
  },
  {
    id: "UI-03",
    inventory: "docs/planning/ui-inventory-ui03.json",
    strings: "docs/planning/ui-strings-ui03.json",
    p03: "tests/ui03-source-parity.test.mjs",
    p04: "tests/ui03-visual-parity.spec.ts",
  },
  {
    id: "UI-04",
    inventory: "docs/planning/ui-inventory-ui04.json",
    strings: "docs/planning/ui-strings-ui04.json",
    p03: "tests/ui04-source-parity.test.mjs",
    p04: "tests/ui04-visual-parity.spec.ts",
  },
  {
    id: "UI-05",
    inventory: "docs/planning/ui-inventory-ui05.json",
    strings: "docs/planning/ui-strings-ui05.json",
    p03: "tests/ui05-source-parity.test.mjs",
    p04: "tests/ui05-visual-parity.spec.ts",
  },
  {
    id: "UI-06",
    inventory: "docs/planning/ui-inventory-ui06.json",
    strings: "docs/planning/ui-strings-ui06.json",
    p03: "tests/ui06-source-parity.test.mjs",
    p04: "tests/ui06-visual-parity.spec.ts",
  },
  {
    id: "UI-07",
    inventory: "docs/planning/ui-inventory-ui07.json",
    strings: "docs/planning/ui-strings-ui07.json",
    p03: "tests/ui07-source-parity.test.mjs",
    p04: "tests/ui07-visual-parity.spec.ts",
  },
  {
    id: "UI-08",
    inventory: "docs/planning/ui-inventory-ui08.json",
    strings: "docs/planning/ui-strings-ui08.json",
    p03: "tests/ui08-source-parity.test.mjs",
    p04: "tests/ui08-visual-parity.spec.ts",
  },
  {
    id: "UI-09",
    inventory: "docs/planning/ui-inventory-ui09.json",
    strings: "docs/planning/ui-strings-ui09.json",
    p03: "tests/ui09-source-parity.test.mjs",
    p04: "tests/ui09-visual-parity.spec.ts",
  },
];

describe("UI-10 global gate — all milestones complete", () => {
  for (const m of MILESTONES) {
    describe(m.id, () => {
      it(`${m.id} inventory file exists`, () => {
        assert.ok(exists(m.inventory), `MISSING: ${m.inventory}`);
      });

      it(`${m.id} string catalogue exists`, () => {
        assert.ok(exists(m.strings), `MISSING: ${m.strings}`);
      });

      it(`${m.id} P03 source parity test exists`, () => {
        assert.ok(exists(m.p03), `MISSING: ${m.p03}`);
      });

      it(`${m.id} P04 visual parity spec exists`, () => {
        assert.ok(exists(m.p04), `MISSING: ${m.p04}`);
      });

      it(`${m.id} inventory has surfaces`, () => {
        const inv = JSON.parse(fs.readFileSync(path.join(ROOT, m.inventory), "utf8"));
        const count = inv.surfaces?.length ?? inv.milestones?.length ?? 0;
        assert.ok(count > 0, `${m.id} inventory is empty`);
      });

      it(`${m.id} string catalogue has strings`, () => {
        const cat = JSON.parse(fs.readFileSync(path.join(ROOT, m.strings), "utf8"));
        const count = Object.keys(cat.strings || {}).length + (cat.totalStrings || 0);
        assert.ok(count > 0, `${m.id} string catalogue is empty`);
      });
    });
  }

  it("tracker has all 9 milestones P01+P02+P03+P04 done", () => {
    const tracker = JSON.parse(
      fs.readFileSync(path.join(ROOT, "docs/tracker.json"), "utf8")
    );
    const uiTasks = tracker.tasks.filter(t => /^UI-0[1-9]$/.test(t.id));
    assert.strictEqual(uiTasks.length, 9, "Expected 9 UI milestones in tracker");

    for (const task of uiTasks) {
      const packages = task.workPlan?.packages || [];
      for (const pkg of packages) {
        assert.ok(
          pkg.done,
          `${pkg.id} is not marked done in tracker`
        );
      }
    }
  });
});
