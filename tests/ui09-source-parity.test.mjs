/**
 * UI-09 P03 — Source parity test (notifications and announcements)
 * No browser needed. Fast (<30s).
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

describe("UI-09 P03 — surface existence (notifications/announcements)", () => {
  const surfaces = [
    // Notification components
    { id: "UI09-notif-list", path: "components/activity/notification-list.tsx" },
    { id: "UI09-learner-inbox", path: "components/activity/learner-notifications-inbox.tsx" },
    // Learner notifications
    { id: "UI09-learn-notifs", path: "app/(authenticated)/learn/notifications/page.tsx" },
    { id: "UI09-learn-notifs-history", path: "app/(authenticated)/learn/notifications/history/page.tsx" },
    // Teacher/mentor/tpo notifications
    { id: "UI09-teacher-notifs", path: "app/(authenticated)/teacher/notifications/page.tsx" },
    { id: "UI09-mentor-notifs", path: "app/(authenticated)/mentor/notifications/page.tsx" },
    { id: "UI09-tpo-notifs", path: "app/(authenticated)/tpo/notifications/page.tsx" },
    // Admin notifications hub
    { id: "UI09-admin-notifs", path: "app/(authenticated)/notifications/page.tsx" },
    // Announcements
    { id: "UI09-admin-announcements", path: "app/(authenticated)/admin/announcements/page.tsx" },
    { id: "UI09-tpo-announcements", path: "app/(authenticated)/tpo/announcements/page.tsx" },
    { id: "UI09-learn-placements-announcements", path: "app/(authenticated)/learn/my-placements/announcements/page.tsx" },
  ];

  for (const s of surfaces) {
    it(`${s.id} exists on disk`, () => {
      assert.ok(exists(s.path), `MISSING ${s.id}: src/${s.path}`);
    });
  }
});

describe("UI-09 P03 — inventory completeness", () => {
  const INVENTORY_FILE = path.join(ROOT, "docs/planning/ui-inventory-ui09.json");

  it("inventory file exists", () => {
    assert.ok(fs.existsSync(INVENTORY_FILE), "ui-inventory-ui09.json not found");
  });

  it("has 20+ surfaces", () => {
    const inv = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
    assert.ok(inv.surfaces.length >= 20, `Expected 20+ surfaces, got ${inv.surfaces.length}`);
  });

  it("every surface has required fields", () => {
    const inv = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
    for (const s of inv.surfaces) {
      assert.ok(s.id);
      assert.ok(s.type);
      assert.ok(["MATCHED","MISSING","REDESIGNED"].includes(s.disposition), `${s.id}: ${s.disposition}`);
    }
  });
});

describe("UI-09 P03 — string catalogue", () => {
  const STRINGS_FILE = path.join(ROOT, "docs/planning/ui-strings-ui09.json");
  it("string catalogue exists", () => {
    assert.ok(fs.existsSync(STRINGS_FILE), "ui-strings-ui09.json not found");
  });
});
