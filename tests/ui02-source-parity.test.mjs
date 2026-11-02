/**
 * UI-02 P03 — Source parity test (academics domain)
 * Verifies: every MATCHED surface has a vNext page.tsx on disk.
 * No browser needed. Fast (<30s). Runs on every push.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

function exists(rel) {
  return fs.existsSync(path.join(SRC, rel));
}

// ── Surface existence ────────────────────────────────────────────────────────

describe("UI-02 P03 — surface existence (MATCHED/REDESIGNED)", () => {
  const matchedSurfaces = [
    // Batches
    { id: "UI02-S01", path: "app/(authenticated)/admin/batches/page.tsx" },
    { id: "UI02-S02", path: "app/(authenticated)/admin/batches/page.tsx" },
    { id: "UI02-S03", path: "app/(authenticated)/admin/batches/page.tsx" },
    { id: "UI02-S04", path: "app/(authenticated)/admin/batches/page.tsx" },
    { id: "UI02-S05", path: "app/(authenticated)/admin/batches/page.tsx" },
    { id: "UI02-S06", path: "app/(authenticated)/admin/batches/[batchId]/students/page.tsx" },
    // Batch promotion
    { id: "UI02-S07", path: "app/(authenticated)/admin/batch-promotion/page.tsx" },
    { id: "UI02-S08", path: "app/(authenticated)/admin/batch-promotion/page.tsx" },
    // Programs
    { id: "UI02-S09", path: "app/(authenticated)/admin/programs/page.tsx" },
    { id: "UI02-S10", path: "app/(authenticated)/admin/programs/page.tsx" },
    { id: "UI02-S11", path: "app/(authenticated)/admin/programs/page.tsx" },
    { id: "UI02-S12", path: "app/(authenticated)/admin/programs/page.tsx" },
    // Departments
    { id: "UI02-S13", path: "app/(authenticated)/admin/departments/page.tsx" },
    { id: "UI02-S14", path: "app/(authenticated)/admin/departments/page.tsx" },
    { id: "UI02-S15", path: "app/(authenticated)/admin/departments/page.tsx" },
    { id: "UI02-S16", path: "app/(authenticated)/admin/departments/page.tsx" },
    { id: "UI02-S17", path: "app/(authenticated)/admin/departments/all/page.tsx" },
    // Semesters
    { id: "UI02-S18", path: "app/(authenticated)/admin/semesters/page.tsx" },
    { id: "UI02-S19", path: "app/(authenticated)/admin/semesters/page.tsx" },
    { id: "UI02-S20", path: "app/(authenticated)/admin/semesters/page.tsx" },
    { id: "UI02-S21", path: "app/(authenticated)/admin/semesters/page.tsx" },
    // Semester courses
    { id: "UI02-S22", path: "app/(authenticated)/admin/semester-courses/page.tsx" },
    { id: "UI02-S23", path: "app/(authenticated)/admin/semester-courses/page.tsx" },
    { id: "UI02-S24", path: "app/(authenticated)/admin/semester-courses/page.tsx" },
    { id: "UI02-S25", path: "app/(authenticated)/admin/semester-courses/page.tsx" },
    // Classes
    { id: "UI02-S26", path: "app/(authenticated)/admin/classes/page.tsx" },
    { id: "UI02-S27", path: "app/(authenticated)/admin/classes/page.tsx" },
    { id: "UI02-S28", path: "app/(authenticated)/admin/classes/page.tsx" },
    { id: "UI02-S29", path: "app/(authenticated)/admin/classes/page.tsx" },
    { id: "UI02-S30", path: "app/(authenticated)/admin/classes/page.tsx" },
    // Lecture halls
    { id: "UI02-S31", path: "app/(authenticated)/admin/lecture-halls/page.tsx" },
    { id: "UI02-S32", path: "app/(authenticated)/admin/lecture-halls/page.tsx" },
    { id: "UI02-S33", path: "app/(authenticated)/admin/lecture-halls/[hallId]/page.tsx" },
    { id: "UI02-S34", path: "app/(authenticated)/admin/lecture-halls/page.tsx" },
    // Faculty assignment
    { id: "UI02-S35", path: "app/(authenticated)/admin/faculty-assignment/page.tsx" },
    { id: "UI02-S36", path: "app/(authenticated)/admin/faculty-assignment/page.tsx" },
    { id: "UI02-S37", path: "app/(authenticated)/admin/faculty-assignment/page.tsx" },
    { id: "UI02-S38", path: "app/(authenticated)/admin/faculty-assignment/page.tsx" },
    // Electives
    { id: "UI02-S39", path: "app/(authenticated)/college/electives/page.tsx" },
    { id: "UI02-S40", path: "app/(authenticated)/college/electives/[slotId]/page.tsx" },
    { id: "UI02-S41", path: "app/(authenticated)/college/electives/[slotId]/allocate/page.tsx" },
    { id: "UI02-S42", path: "app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx" },
    { id: "UI02-S43", path: "app/(authenticated)/admin/electives/page.tsx" },
    // Student groups
    { id: "UI02-S44", path: "app/(authenticated)/college/groups/page.tsx" },
    { id: "UI02-S45", path: "app/(authenticated)/college/groups/[groupId]/page.tsx" },
    { id: "UI02-S46", path: "app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx" },
    { id: "UI02-S47", path: "app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx" },
    // Learner groups
    { id: "UI02-S48", path: "app/(authenticated)/learn/groups/page.tsx" },
    { id: "UI02-S49", path: "app/(authenticated)/learn/groups/[groupId]/page.tsx" },
    // College-admin mirrors
    { id: "UI02-S50", path: "app/(authenticated)/college/batches/page.tsx" },
    { id: "UI02-S52", path: "app/(authenticated)/college/batch-promotion/page.tsx" },
    { id: "UI02-S53", path: "app/(authenticated)/college/programs/page.tsx" },
    { id: "UI02-S54", path: "app/(authenticated)/college/semesters/page.tsx" },
    { id: "UI02-S55", path: "app/(authenticated)/college/semester-courses/page.tsx" },
    { id: "UI02-S56", path: "app/(authenticated)/college/classes/page.tsx" },
    { id: "UI02-S57", path: "app/(authenticated)/college/classes/recurring-preview/page.tsx" },
    { id: "UI02-S58", path: "app/(authenticated)/college/departments/page.tsx" },
    { id: "UI02-S59", path: "app/(authenticated)/college/lecture-halls/page.tsx" },
    { id: "UI02-S60", path: "app/(authenticated)/college/lecture-halls/[hallId]/page.tsx" },
    { id: "UI02-S61", path: "app/(authenticated)/college/faculty-assignment/page.tsx" },
  ];

  for (const surface of matchedSurfaces) {
    it(`${surface.id} page.tsx exists on disk`, () => {
      assert.ok(
        exists(surface.path),
        `MISSING surface ${surface.id}: src/${surface.path}`
      );
    });
  }
});

// ── College-admin batch students ─────────────────────────────────────────────

describe("UI-02 P03 — college-admin batch students", () => {
  it("UI02-S51 college/batches/[cohortId]/students page exists", () => {
    assert.ok(
      exists("app/(authenticated)/college/batches/[cohortId]/students/page.tsx"),
      "MISSING: college/batches/[cohortId]/students/page.tsx"
    );
  });
});

// ── String catalogue spot checks ──────────────────────────────────────────────

describe("UI-02 P03 — string catalogue spot checks (MATCHED strings in vNext source)", () => {
  const STRINGS_FILE = path.join(ROOT, "docs/planning/ui-strings-ui02.json");

  it("string catalogue file exists", () => {
    assert.ok(fs.existsSync(STRINGS_FILE), "ui-strings-ui02.json not found");
  });

  it("string catalogue has required keys", () => {
    const catalogue = JSON.parse(fs.readFileSync(STRINGS_FILE, "utf8"));
    const required = [
      "batch.list.col.batchName",
      "batch.create.success",
      "batch.edit.okText",
      "batch.delete.okText",
      "program.list.col.name",
      "program.create.success",
      "department.create.success",
      "semester.create.success",
      "class.create.success",
      "lectureHall.create.success",
      "facultyAssignment.delete.okText",
      "electives.featureOff.title",
      "studentGroups.sourceLabel.manual",
    ];
    for (const key of required) {
      assert.ok(
        key in catalogue.strings,
        `Missing string key: ${key}`
      );
    }
  });
});

// ── Inventory file checks ─────────────────────────────────────────────────────

describe("UI-02 P03 — inventory completeness", () => {
  const INVENTORY_FILE = path.join(ROOT, "docs/planning/ui-inventory-ui02.json");

  it("inventory file exists", () => {
    assert.ok(fs.existsSync(INVENTORY_FILE), "ui-inventory-ui02.json not found");
  });

  it("inventory has 60+ surfaces catalogued", () => {
    const inv = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
    assert.ok(
      inv.surfaces.length >= 60,
      `Expected 60+ surfaces, got ${inv.surfaces.length}`
    );
  });

  it("every surface has required fields", () => {
    const inv = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
    for (const s of inv.surfaces) {
      assert.ok(s.id, `Surface missing id: ${JSON.stringify(s)}`);
      assert.ok(s.type, `Surface ${s.id} missing type`);
      assert.ok(s.disposition, `Surface ${s.id} missing disposition`);
      assert.ok(
        ["MATCHED", "MISSING", "REDESIGNED"].includes(s.disposition),
        `Surface ${s.id} invalid disposition: ${s.disposition}`
      );
    }
  });

  it("no UNKNOWN dispositions", () => {
    const inv = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
    const unknown = inv.surfaces.filter(s => !s.disposition || s.disposition === "UNKNOWN");
    assert.equal(unknown.length, 0, `Surfaces with unknown disposition: ${unknown.map(s => s.id).join(", ")}`);
  });
});
