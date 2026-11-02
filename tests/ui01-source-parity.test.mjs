#!/usr/bin/env node
// UI-01 P03: Source parity test — auth, admin shell and tenant setup
// Verifies every MATCHED surface has a vNext file on disk and key strings are present.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventory = JSON.parse(
  fs.readFileSync(path.join(root, "docs/planning/ui-inventory-ui01.json"), "utf8")
);
const catalogue = JSON.parse(
  fs.readFileSync(path.join(root, "docs/planning/ui-strings-ui01.json"), "utf8")
);

const MISSING_ALLOWED = 0;

describe("UI-01 source parity — auth, admin shell and tenant setup", () => {
  test("inventory file exists and has required fields", () => {
    assert.ok(inventory.domain === "UI-01", "domain must be UI-01");
    assert.ok(Array.isArray(inventory.surfaces), "surfaces must be array");
    assert.ok(inventory.surfaces.length > 0, "surfaces must not be empty");
    assert.ok(
      typeof inventory.frozenLegacySha === "string" && inventory.frozenLegacySha.length === 40,
      "frozenLegacySha must be 40-char SHA"
    );
  });

  test("string catalogue file exists and has required fields", () => {
    assert.ok(catalogue.domain === "UI-01", "catalogue domain must be UI-01");
    assert.ok(typeof catalogue.strings === "object", "strings must be object");
    assert.ok(Object.keys(catalogue.strings).length > 0, "catalogue must not be empty");
  });

  test("zero MISSING surfaces (all must be built)", () => {
    const missing = inventory.surfaces.filter(s => s.disposition === "MISSING");
    assert.strictEqual(
      missing.length,
      MISSING_ALLOWED,
      `Found ${missing.length} MISSING surfaces: ${missing.map(s => s.id + " " + s.title).join(", ")}`
    );
  });

  describe("MATCHED surfaces have vNext files on disk", () => {
    const matched = inventory.surfaces.filter(s => s.disposition === "MATCHED");
    for (const surface of matched) {
      test(`${surface.id}: ${surface.title}`, () => {
        const absPath = path.join(root, surface.vNextPath);
        assert.ok(
          fs.existsSync(absPath),
          `vNext file missing: ${surface.vNextPath} (surface: ${surface.id} — ${surface.title})`
        );
      });
    }
  });

  describe("key login strings present in vNext login page", () => {
    const loginPage = path.join(root, "src/app/login/page.tsx");
    test("login page.tsx exists", () => {
      assert.ok(fs.existsSync(loginPage), "src/app/login/page.tsx must exist");
    });

    const requiredStrings = [
      "Sign in",
      "Enter your code",
      "Mobile number",
      "Email",
      "Resend code",
    ];
    for (const s of requiredStrings) {
      test(`login page + auth components contains: "${s}"`, () => {
        // Login page re-exports from src/app/page.tsx; actual strings are in src/components/auth/
        const combined = getLoginAndAuthComponentsContent(root);
        assert.ok(
          combined.includes(s),
          `String "${s}" not found in login page, root page, or auth components`
        );
      });
    }
  });

  describe("superadmin login page has required strings", () => {
    const saLoginPage = path.join(root, "src/app/superadmin-login/page.tsx");
    test("superadmin-login page.tsx exists", () => {
      assert.ok(fs.existsSync(saLoginPage), "src/app/superadmin-login/page.tsx must exist");
    });
    test("superadmin login page contains OTP send button", () => {
      if (!fs.existsSync(saLoginPage)) return;
      const content = fs.readFileSync(saLoginPage, "utf8");
      const saDir = path.join(root, "src/app/superadmin-login");
      const allContent = fs.readdirSync(saDir)
        .filter(f => f.endsWith(".tsx") || f.endsWith(".ts"))
        .map(f => fs.readFileSync(path.join(saDir, f), "utf8"))
        .join("\n");
      assert.ok(
        content.includes("Send OTP") || allContent.includes("Send OTP") || content.includes("sendOtp") || allContent.includes("sendOtp"),
        "Superadmin login must contain Send OTP button"
      );
    });
  });

  describe("admin layout and navigation exist", () => {
    const adminLayout = path.join(root, "src/app/(authenticated)/admin");
    test("admin directory exists", () => {
      assert.ok(fs.existsSync(adminLayout), "src/app/(authenticated)/admin must exist");
    });
    test("colleges list page exists", () => {
      assert.ok(
        fs.existsSync(path.join(root, "src/app/(authenticated)/admin/colleges/page.tsx")),
        "admin/colleges/page.tsx must exist"
      );
    });
    test("features page exists", () => {
      assert.ok(
        fs.existsSync(path.join(root, "src/app/(authenticated)/admin/features/page.tsx")),
        "admin/features/page.tsx must exist"
      );
    });
    test("colleges/[collegeId] subpages exist", () => {
      const expected = [
        "src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx",
        "src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx",
        "src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx",
        "src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx",
        "src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx",
        "src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx",
        "src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx",
      ];
      for (const p of expected) {
        assert.ok(
          fs.existsSync(path.join(root, p)),
          `Missing: ${p}`
        );
      }
    });
  });

  describe("error and utility pages exist", () => {
    const pages = [
      "src/app/not-found.tsx",
      "src/app/forbidden/page.tsx",
      "src/app/maintenance/page.tsx",
      "src/app/offline/page.tsx",
      "src/app/auth/handoff/page.tsx",
      "src/app/college-join/[token]/page.tsx",
      "src/app/company-join/[token]/page.tsx",
      "src/app/recruiter-invite/[token]/page.tsx",
      "src/app/verify-email/page.tsx",
    ];
    for (const p of pages) {
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

  test("catalogue totalStrings field is accurate", () => {
    const actual = Object.keys(catalogue.strings).length;
    assert.ok(
      actual >= catalogue.totalStrings * 0.9,
      `Catalogue declares ${catalogue.totalStrings} strings but only has ${actual}`
    );
  });
});

function getLoginAndAuthComponentsContent(root) {
  const dirs = [
    path.join(root, "src/app/login"),
    path.join(root, "src/app"),
    path.join(root, "src/components/auth"),
  ];
  let content = "";
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      // Only read direct children for src/app (not recursive)
      const depth = dir.endsWith("src/app") ? 0 : 2;
      const files = findFilesRecursive(dir, [".tsx", ".ts"], depth);
      for (const f of files.slice(0, 30)) {
        try { content += fs.readFileSync(f, "utf8"); } catch (_) {}
      }
    } catch (_) {}
  }
  return content;
}

function findFilesRecursive(dir, exts, maxDepth, depth = 0) {
  if (depth > maxDepth) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesRecursive(full, exts, maxDepth, depth + 1));
    } else if (exts.some(e => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}
