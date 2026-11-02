/**
 * UI-03 P03 — Source parity test (learner/faculty profiles domain)
 * Verifies: every MATCHED/REDESIGNED surface has a vNext page on disk.
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

describe("UI-03 P03 — surface existence", () => {
  const surfaces = [
    { id: "UI03-S01", path: "app/(authenticated)/learn/profile/page.tsx" },
    { id: "UI03-S04", path: "app/(authenticated)/teacher/profile/page.tsx" },
    { id: "UI03-S05", path: "app/(authenticated)/teacher/profile/page.tsx" },
    { id: "UI03-college-profile", path: "app/(authenticated)/college/profile/page.tsx" },
    { id: "UI03-completeness", path: "app/(authenticated)/learn/profile/completeness/page.tsx" },
    { id: "UI03-people-dir", path: "app/(authenticated)/admin/people/directory/page.tsx" },
    { id: "UI03-college-people", path: "app/(authenticated)/college/people/page.tsx" },
    { id: "UI03-admin-students", path: "app/(authenticated)/admin/students/page.tsx" },
    { id: "UI03-students-import", path: "app/(authenticated)/college/students/import/page.tsx" },
    { id: "UI03-member-audit", path: "app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx" },
    { id: "UI03-member-detail", path: "app/(authenticated)/admin/people/directory/[membershipId]/page.tsx" },
    { id: "UI03-college-students", path: "app/(authenticated)/college/students/page.tsx" },
    { id: "UI03-college-faculty", path: "app/(authenticated)/college/faculty/page.tsx" },
    { id: "UI03-faculty-member", path: "app/(authenticated)/college/faculty/[membershipId]/page.tsx" },
    { id: "UI03-tpo-students", path: "app/(authenticated)/tpo/students/page.tsx" },
    { id: "UI03-hr-profile", path: "app/(authenticated)/hr/profile/page.tsx" },
    { id: "UI03-mentor-profile", path: "app/(authenticated)/mentor/profile/page.tsx" },
    { id: "UI03-tpo-profile", path: "app/(authenticated)/tpo/profile/page.tsx" },
    { id: "UI03-academic-record", path: "app/(authenticated)/learn/profile/academic-record/page.tsx" },
    { id: "UI03-data-access", path: "app/(authenticated)/learn/profile/data-access/page.tsx" },
    { id: "UI03-gallery", path: "app/(authenticated)/learn/profile/gallery/page.tsx" },
  ];

  for (const s of surfaces) {
    it(`${s.id} exists on disk`, () => {
      assert.ok(exists(s.path), `MISSING ${s.id}: src/${s.path}`);
    });
  }
});

describe("UI-03 P03 — inventory completeness", () => {
  const INVENTORY_FILE = path.join(ROOT, "docs/planning/ui-inventory-ui03.json");

  it("inventory file exists", () => {
    assert.ok(fs.existsSync(INVENTORY_FILE), "ui-inventory-ui03.json not found");
  });

  it("inventory has surfaces catalogued", () => {
    const inv = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
    assert.ok(inv.surfaces.length >= 20, `Expected 20+ surfaces, got ${inv.surfaces.length}`);
  });

  it("every surface has id, type, disposition", () => {
    const inv = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
    for (const s of inv.surfaces) {
      assert.ok(s.id, `Surface missing id`);
      assert.ok(s.type, `Surface ${s.id} missing type`);
      assert.ok(["MATCHED","MISSING","REDESIGNED"].includes(s.disposition), `Surface ${s.id} bad disposition: ${s.disposition}`);
    }
  });
});

describe("UI-03 P03 — string catalogue", () => {
  const STRINGS_FILE = path.join(ROOT, "docs/planning/ui-strings-ui03.json");

  it("string catalogue file exists", () => {
    assert.ok(fs.existsSync(STRINGS_FILE), "ui-strings-ui03.json not found");
  });
});
