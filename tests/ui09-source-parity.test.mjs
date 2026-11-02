/**
 * UI-09 P03 — Source parity test (notifications, announcements and discussions)
 * Verifies: every MATCHED/MISSING surface has a vNext file on disk.
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

describe("UI-09 P03 — surface existence", () => {
  // MATCHED surfaces (19 surfaces, deduplicated to unique paths)
  const surfaces = [
    // Notification bell/dropdown + detail modal + empty/error states — share notification-list.tsx
    { id: "UI09-S01", path: "components/activity/notification-list.tsx" },
    // Notification panel loading skeleton — learner-notifications-inbox.tsx
    { id: "UI09-S04", path: "components/activity/learner-notifications-inbox.tsx" },
    // Learner notifications page
    { id: "UI09-S07", path: "app/(authenticated)/learn/notifications/page.tsx" },
    // Faculty notifications page
    { id: "UI09-S09", path: "app/(authenticated)/teacher/notifications/page.tsx" },
    // Mentor notifications page
    { id: "UI09-S10", path: "app/(authenticated)/mentor/notifications/page.tsx" },
    // TPO notifications page
    { id: "UI09-S11", path: "app/(authenticated)/tpo/notifications/page.tsx" },
    // SuperAdmin announcements page (create/edit/delete modals share same page)
    { id: "UI09-S14", path: "app/(authenticated)/admin/announcements/page.tsx" },
    // TPO announcements page (compose + detail view share same page)
    { id: "UI09-S18", path: "app/(authenticated)/tpo/announcements/page.tsx" },
    // Learner placement announcements page (empty state shares same page)
    { id: "UI09-S21", path: "app/(authenticated)/learn/my-placements/announcements/page.tsx" },

    // MISSING surfaces (10 surfaces — vNext-new, no legacy equivalent, all verified on disk)
    // HR notifications page
    { id: "UI09-S12", path: "app/(authenticated)/hr/notifications/page.tsx" },
    // Learner placement notification preferences page
    { id: "UI09-S23", path: "app/(authenticated)/learn/my-placements/notification-preferences/page.tsx" },
    // Admin/College announcements page
    { id: "UI09-S24", path: "app/(authenticated)/college/announcements/page.tsx" },
    // Admin notification delivery page
    { id: "UI09-S25", path: "app/(authenticated)/admin/notification-delivery/page.tsx" },
    // Admin notification templates page
    { id: "UI09-S26", path: "app/(authenticated)/admin/notification-templates/page.tsx" },
    // TPO notification preferences page
    { id: "UI09-S27", path: "app/(authenticated)/tpo/settings/notifications/page.tsx" },
    // Teacher discussion page (course-scoped)
    { id: "UI09-S28", path: "app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx" },
    // Teacher discussion history page
    { id: "UI09-S29", path: "app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx" },
    // Teacher discussion participation page
    { id: "UI09-S30", path: "app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx" },
    // TPO placement job discussion page
    { id: "UI09-S31", path: "app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx" },
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

  it("inventory has surfaces catalogued", () => {
    const inv = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
    assert.ok(inv.surfaces.length >= 29, `Expected 29+ surfaces, got ${inv.surfaces.length}`);
  });

  it("every surface has id, type, disposition", () => {
    const inv = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
    for (const s of inv.surfaces) {
      assert.ok(s.id, `Surface missing id`);
      assert.ok(s.type, `Surface ${s.id} missing type`);
      assert.ok(
        ["MATCHED", "MISSING", "REDESIGNED"].includes(s.disposition),
        `Surface ${s.id} bad disposition: ${s.disposition}`
      );
    }
  });
});

describe("UI-09 P03 — string catalogue", () => {
  const STRINGS_FILE = path.join(ROOT, "docs/planning/ui-strings-ui09.json");

  it("string catalogue file exists", () => {
    assert.ok(fs.existsSync(STRINGS_FILE), "ui-strings-ui09.json not found");
  });

  it("string catalogue has entries", () => {
    const cat = JSON.parse(fs.readFileSync(STRINGS_FILE, "utf8"));
    const count = Object.keys(cat.strings || {}).length;
    assert.ok(count >= 50, `Expected 50+ strings, got ${count}`);
  });
});
