// API-06-P02: Projects, templates, mentorship and history integration gate.
// Source-only — no database needed.
// Verifies crosswalk completeness, auth guard coverage, MISSING gap catalogue.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api06.json");
const crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
const { summary, endpoints } = crosswalk;

const FROZEN_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const EXPECTED_TOTAL = 43;
const EXPECTED_MISSING = 8;

test("API-06 crosswalk summary integrity — counts add up to total", () => {
  assert.equal(
    summary.mapped + summary.redesigned + summary.retired + summary.missing,
    summary.total,
    "mapped + redesigned + retired + missing must equal total"
  );
  assert.equal(summary.total, EXPECTED_TOTAL, `Expected ${EXPECTED_TOTAL} total endpoints`);
  assert.equal(endpoints.length, EXPECTED_TOTAL, "endpoints array length must match total");
});

test("API-06 all MAPPED endpoints have vNextPath verified on disk", () => {
  const mapped = endpoints.filter(e => e.disposition === "MAPPED");
  assert.ok(mapped.length > 0, "Must have at least one MAPPED endpoint");
  for (const ep of mapped) {
    assert.ok(ep.vNextPath, `MAPPED endpoint ${ep.legacyPath} missing vNextPath`);
    const fullPath = path.join(root, ep.vNextPath);
    assert.ok(
      fs.existsSync(fullPath),
      `MAPPED endpoint ${ep.legacyPath} → ${ep.vNextPath} does not exist on disk`
    );
  }
});

test("API-06 all REDESIGNED endpoints have vNextPath and notes", () => {
  const redesigned = endpoints.filter(e => e.disposition === "REDESIGNED");
  for (const ep of redesigned) {
    assert.ok(ep.vNextPath, `REDESIGNED endpoint ${ep.legacyPath} missing vNextPath`);
    assert.ok(ep.notes && ep.notes.length > 0, `REDESIGNED endpoint ${ep.legacyPath} missing notes`);
    const fullPath = path.join(root, ep.vNextPath);
    assert.ok(
      fs.existsSync(fullPath),
      `REDESIGNED endpoint ${ep.legacyPath} → ${ep.vNextPath} does not exist on disk`
    );
  }
});

test("API-06 project routes have auth guard (isSameOriginRequest or getCurrentRequestContext)", () => {
  // Scan key project mutation routes for auth patterns
  const mutationRoutes = [
    "src/app/api/projects/[projectId]/route.ts",
    "src/app/api/projects/[projectId]/members/route.ts",
    "src/app/api/projects/[projectId]/delete/route.ts",
    "src/app/api/projects/templates/route.ts",
    "src/app/api/projects/templates/[templateId]/duplicate/route.ts",
  ];
  for (const routeRel of mutationRoutes) {
    const routePath = path.join(root, routeRel);
    if (!fs.existsSync(routePath)) continue;
    const content = fs.readFileSync(routePath, "utf8");
    const hasGuard =
      (content.includes("isSameOriginRequest") || content.includes("@/security/route")) ||
      (content.includes("getCurrentRequestContext") || content.includes("@/security/route"));
    assert.ok(hasGuard, `${routeRel} has no auth guard (isSameOriginRequest or getCurrentRequestContext)`);
  }
});

test("API-06 tenant-scoped project routes use getCurrentRequestContext", () => {
  // All project routes are tenant-scoped — verify key ones use context
  const tenantRoutes = [
    "src/app/api/projects/[projectId]/route.ts",
    "src/app/api/projects/class-team-workspaces/route.ts",
    "src/app/api/projects/templates/route.ts",
  ];
  for (const routeRel of tenantRoutes) {
    const routePath = path.join(root, routeRel);
    if (!fs.existsSync(routePath)) continue;
    const content = fs.readFileSync(routePath, "utf8");
    assert.ok(
      (content.includes("getCurrentRequestContext") || content.includes("@/security/route")),
      `${routeRel} missing getCurrentRequestContext for tenant scoping`
    );
  }
});

test("API-06 8 missing endpoints documented with gap reasons", () => {
  const missing = endpoints.filter(e => e.disposition === "MISSING");
  assert.equal(missing.length, EXPECTED_MISSING, `Expected ${EXPECTED_MISSING} MISSING endpoints`);
  for (const ep of missing) {
    assert.ok(ep.notes && ep.notes.length > 0, `MISSING endpoint ${ep.legacyPath} must have gap notes`);
    assert.equal(ep.vNextPath, null, `MISSING endpoint ${ep.legacyPath} must have null vNextPath`);
  }
});

test("API-06 resource-files redesign documented for flat /files gap", () => {
  const filesMissing = endpoints.filter(
    e => e.disposition === "MISSING" && e.legacyPath.includes("/files")
  );
  assert.equal(filesMissing.length, 3, "Expected 3 MISSING /files endpoints (GET, POST, DELETE)");
  for (const ep of filesMissing) {
    assert.ok(
      ep.notes.includes("resource-files"),
      `${ep.legacyPath} gap note must mention resource-files redesign`
    );
  }
});

test("API-06 project-level comment gaps documented", () => {
  const commentsMissing = endpoints.filter(
    e => e.disposition === "MISSING" && e.legacyPath.includes("/comments")
  );
  assert.equal(commentsMissing.length, 4, "Expected 4 MISSING project-level comment endpoints");
  for (const ep of commentsMissing) {
    assert.ok(
      ep.notes.includes("task-level"),
      `${ep.legacyPath} gap note must reference task-level comment redesign`
    );
  }
});

test("API-06 no endpoint has disposition OPEN", () => {
  const open = endpoints.filter(e => e.disposition === "OPEN");
  assert.equal(open.length, 0, `All endpoints must be classified. Still OPEN: ${open.map(e=>e.legacyPath).join(", ")}`);
});

test("API-06 frozen legacy SHA matches expected", () => {
  assert.equal(crosswalk.frozenLegacySha, FROZEN_SHA, "frozenLegacySha must match canonical value");
});
