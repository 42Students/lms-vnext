// API-07-P02: Placements/offer lifecycle integration gate.
// Source-only — verifies crosswalk integrity, auth guard coverage on 333 placement routes,
// tenant scoping, and formal MISSING gap catalogue for 14 undocumented endpoints.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api07.json");
const crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
const { summary, endpoints } = crosswalk;
const FROZEN_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";

test("API-07 crosswalk summary integrity — counts add up to total", () => {
  const computed = summary.mapped + summary.redesigned + summary.retired + summary.missing;
  assert.equal(computed, summary.total,
    `mapped(${summary.mapped}) + redesigned(${summary.redesigned}) + retired(${summary.retired}) + missing(${summary.missing}) = ${computed}, expected ${summary.total}`);
  assert.equal(summary.total, 70, "API-07 must have exactly 70 legacy endpoints");
});

test("API-07 all REDESIGNED endpoints have notes (0 MAPPED — fully redesigned domain)", () => {
  assert.equal(summary.mapped, 0, "API-07 has 0 directly MAPPED endpoints — placements was fully redesigned");
  const redesigned = endpoints.filter(e => e.disposition === "REDESIGNED");
  assert.equal(redesigned.length, summary.redesigned);
  for (const ep of redesigned) {
    assert.ok(ep.notes && ep.notes.length > 0,
      `REDESIGNED endpoint ${ep.legacyMethod} ${ep.legacyPath} missing notes`);
    assert.ok(ep.vNextPath, `REDESIGNED ${ep.legacyMethod} ${ep.legacyPath} missing vNextPath`);
    assert.ok(fs.existsSync(path.join(root, ep.vNextPath)),
      `REDESIGNED vNextPath does not exist on disk: ${ep.vNextPath}`);
  }
});

test("API-07 placement routes have auth guard (isSameOriginRequest or getCurrentRequestContext)", () => {
  const placementsDir = path.join(root, "src/app/api/placements");
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let guarded = 0, total = 0, unguarded = [];
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        const sub = scanDir(full);
        guarded += sub.guarded; total += sub.total; unguarded.push(...sub.unguarded);
      } else if (e.name === "route.ts") {
        total++;
        const content = fs.readFileSync(full, "utf8");
        if (content.includes("isSameOriginRequest") || content.includes("getCurrentRequestContext") || content.includes("@/security/route") || content.includes("@/security/secure-handler") ||
            content.includes("getPlacementRequestContext") || content.includes("requirePlacement")) {
          guarded++;
        } else {
          unguarded.push(path.relative(root, full));
        }
      }
    }
    return { guarded, total, unguarded };
  }
  const { guarded, total, unguarded } = scanDir(placementsDir);
  assert.ok(total >= 333, `Expected at least 333 placement routes, found ${total}`);
  // Allow at most 5% unguarded (e.g. public read routes)
  const pct = ((total - guarded) / total) * 100;
  assert.ok(pct <= 5,
    `${unguarded.length}/${total} placement routes have no recognizable auth guard (${pct.toFixed(1)}% > 5% threshold).\nUnguarded: ${unguarded.slice(0,10).join(", ")}`);
});

test("API-07 tenant-scoped placement routes use college context", () => {
  const tenantScoped = endpoints.filter(e => e.tenantScoped && e.vNextPath);
  for (const ep of tenantScoped) {
    const fullPath = path.join(root, ep.vNextPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    // route() from the central wrapper resolves the signed-in tenant context before the handler runs.
    const hasTenantContext = content.includes("getCurrentRequestContext") || content.includes("@/security/route") ||
      content.includes("collegeId") || content.includes("tenantId") ||
      content.includes("membershipId") || content.includes("getPlacementRequestContext");
    assert.ok(hasTenantContext,
      `Tenant-scoped route ${ep.vNextPath} shows no tenant context usage`);
  }
});

test("API-07 14 missing endpoints documented with gap reasons", () => {
  const missing = endpoints.filter(e => e.disposition === "MISSING");
  assert.equal(missing.length, 14, `Expected 14 MISSING endpoints, got ${missing.length}`);
  for (const ep of missing) {
    assert.ok(!ep.vNextPath, `MISSING endpoint ${ep.legacyPath} should not have vNextPath`);
    assert.ok(ep.notes && ep.notes.length > 10,
      `MISSING endpoint ${ep.legacyMethod} ${ep.legacyPath} needs a gap reason in notes`);
  }
});

test("API-07 HR college browse gaps (7 endpoints) catalogued", () => {
  const hrCollegeGaps = endpoints.filter(e =>
    e.legacyController === "HrCollegeController" && e.disposition === "MISSING"
  );
  assert.equal(hrCollegeGaps.length, 7,
    `Expected 7 HrCollegeController MISSING endpoints, got ${hrCollegeGaps.length}`);
  const paths = hrCollegeGaps.map(e => e.legacyPath);
  assert.ok(paths.some(p => p.includes("/hr/colleges")),
    "HR college browse gaps must reference /api/v1/hr/colleges paths");
});

test("API-07 vNext placements is a superset — 333 vNext routes vs 70 legacy documented", () => {
  const placementsDir = path.join(root, "src/app/api/placements");
  function countRoutes(dir) {
    let count = 0;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) count += countRoutes(full);
      else if (e.name === "route.ts") count++;
    }
    return count;
  }
  const vNextCount = countRoutes(placementsDir);
  assert.ok(vNextCount >= summary.total,
    `vNext has ${vNextCount} placement routes, which should exceed the ${summary.total} legacy endpoints`);
  // Document the superset ratio
  const ratio = (vNextCount / summary.total).toFixed(1);
  assert.ok(parseFloat(ratio) >= 4.0,
    `vNext placements superset ratio ${ratio}x should be >= 4.0x (333 vNext / 70 legacy)`);
});

test("API-07 frozen SHA matches expected value", () => {
  assert.equal(crosswalk.frozenLegacySha, FROZEN_SHA,
    "Crosswalk frozenLegacySha must match canonical frozen legacy SHA");
});
