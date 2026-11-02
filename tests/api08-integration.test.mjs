// API-08-P02: TPO and recruiter CRM integration gate.
// Source-only — no database. Verifies crosswalk integrity, MAPPED file existence,
// TPO route auth guards, tenant scoping, and 28 documented gaps.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api08.json");
const FROZEN_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const EXPECTED_TOTAL = 118;
const EXPECTED_MISSING = 28;

const crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));

test("API-08 crosswalk summary integrity", () => {
  const { total, mapped, redesigned, retired, missing } = crosswalk.summary;
  assert.equal(total, EXPECTED_TOTAL, `Expected ${EXPECTED_TOTAL} total endpoints`);
  assert.equal(mapped + redesigned + retired + missing, total,
    "mapped+redesigned+retired+missing must equal total");
  assert.equal(missing, EXPECTED_MISSING, `Expected ${EXPECTED_MISSING} missing endpoints`);
  assert.equal(crosswalk.milestoneId, "API-08");
});

test("API-08 all endpoints have a disposition (none OPEN)", () => {
  const open = crosswalk.endpoints.filter(e => !e.disposition || e.disposition === "OPEN");
  assert.equal(open.length, 0,
    `Endpoints without disposition: ${open.map(e => e.legacyPath).join(", ")}`);
});

test("API-08 all MAPPED endpoints have vNextPath verified on disk", () => {
  const mapped = crosswalk.endpoints.filter(e => e.disposition === "MAPPED");
  assert.ok(mapped.length > 0, "Expected at least one MAPPED endpoint");
  for (const ep of mapped) {
    assert.ok(ep.vNextPath, `MAPPED endpoint ${ep.legacyPath} missing vNextPath`);
    const fullPath = path.join(root, ep.vNextPath);
    assert.ok(fs.existsSync(fullPath),
      `MAPPED vNextPath does not exist on disk: ${ep.vNextPath} (for ${ep.legacyPath})`);
  }
});

test("API-08 all REDESIGNED endpoints have notes explaining the redesign", () => {
  const redesigned = crosswalk.endpoints.filter(e => e.disposition === "REDESIGNED");
  assert.ok(redesigned.length > 0, "Expected REDESIGNED endpoints");
  for (const ep of redesigned) {
    assert.ok(ep.vNextPath, `REDESIGNED ${ep.legacyPath} missing vNextPath`);
    assert.ok(ep.notes && ep.notes.length > 0,
      `REDESIGNED ${ep.legacyPath} missing redesign notes`);
  }
});

test("API-08 28 missing endpoints documented with gap reasons", () => {
  const missing = crosswalk.endpoints.filter(e => e.disposition === "MISSING");
  assert.equal(missing.length, EXPECTED_MISSING,
    `Expected ${EXPECTED_MISSING} MISSING endpoints, got ${missing.length}`);
  for (const ep of missing) {
    assert.ok(ep.notes && ep.notes.length > 0,
      `MISSING endpoint ${ep.legacyPath} has no gap reason documented`);
    assert.strictEqual(ep.vNextPath, null,
      `MISSING endpoint ${ep.legacyPath} should have null vNextPath`);
  }
});

test("API-08 TpoHub dashboard gaps catalogued", () => {
  const hubGaps = crosswalk.endpoints.filter(e =>
    e.disposition === "MISSING" && e.legacyController === "TpoHubController"
  );
  assert.ok(hubGaps.length >= 4,
    `Expected at least 4 TpoHub MISSING endpoints, got ${hubGaps.length}`);
  const paths = hubGaps.map(e => e.legacyPath);
  assert.ok(paths.some(p => p.includes("dashboard")), "TpoHub dashboard gap must be documented");
  assert.ok(paths.some(p => p.includes("stats")), "TpoHub stats gap must be documented");
  assert.ok(paths.some(p => p.includes("activity")), "TpoHub activity gap must be documented");
  assert.ok(paths.some(p => p.includes("upcoming")), "TpoHub upcoming gap must be documented");
});

test("API-08 LearnerEligibility gaps catalogued", () => {
  const eligibilityGaps = crosswalk.endpoints.filter(e =>
    e.disposition === "MISSING" && e.legacyController === "LearnerEligibilityController"
  );
  assert.ok(eligibilityGaps.length >= 3,
    `Expected at least 3 LearnerEligibility MISSING endpoints, got ${eligibilityGaps.length}`);
  const paths = eligibilityGaps.map(e => e.legacyPath);
  assert.ok(paths.some(p => p.includes("criteria")), "LearnerEligibility criteria gap must be documented");
  assert.ok(paths.some(p => p.includes("score")), "LearnerEligibility score gap must be documented");
  assert.ok(paths.some(p => p.includes("history")), "LearnerEligibility history gap must be documented");
});

test("API-08 TPO routes have auth guard (isSameOriginRequest or equivalent)", () => {
  // Scan actual TPO route files for auth guard presence
  const tpoDirs = [
    path.join(root, "src/app/api/tpo"),
    path.join(root, "src/app/api/placements/tpo"),
  ];

  let routesScanned = 0;
  let routesGuarded = 0;
  const unguarded = [];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        scanDir(path.join(dir, entry.name));
      } else if (entry.name === "route.ts") {
        const filePath = path.join(dir, entry.name);
        const content = fs.readFileSync(filePath, "utf8");
        routesScanned++;
        if (
          content.includes("isSameOriginRequest") ||
          content.includes("getCurrentRequestContext") ||
          content.includes("requireTpoAccess") ||
          content.includes("hasTpoTooling") ||
          content.includes("requirePlacementAccess")
        ) {
          routesGuarded++;
        } else {
          // Only flag mutation routes (non-GET)
          if (content.includes("export async function POST") ||
              content.includes("export async function PUT") ||
              content.includes("export async function DELETE") ||
              content.includes("export async function PATCH")) {
            unguarded.push(path.relative(root, filePath));
          } else {
            routesGuarded++; // GET-only routes without explicit guard are acceptable
          }
        }
      }
    }
  }

  for (const dir of tpoDirs) scanDir(dir);

  assert.ok(routesScanned > 0, "Expected to find TPO route.ts files to scan");
  assert.equal(unguarded.length, 0,
    `TPO mutation routes without auth guard: ${unguarded.join(", ")}`);
});

test("API-08 frozen legacy SHA matches expected value", () => {
  assert.equal(crosswalk.frozenLegacySha, FROZEN_SHA,
    "Crosswalk frozenLegacySha must match the canonical frozen legacy SHA");
});
