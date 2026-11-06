// API01-P02: Auth/admin/shared-infra integration gate.
// Source-quality tests — no database needed.
// Verifies crosswalk completeness, MAPPED file existence,
// auth guard coverage on admin mutations, and MISSING gap catalogue integrity.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api01.json");
const crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
const { endpoints, summary, missingGapNotes } = crosswalk;

const EXPECTED_TOTAL = 124;
const EXPECTED_MISSING = 47;
const FROZEN_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";

test("API01-P02 crosswalk summary counts match endpoint array", () => {
  assert.equal(endpoints.length, summary.total,
    `endpoints array length ${endpoints.length} must match summary.total ${summary.total}`);
  assert.equal(summary.total, EXPECTED_TOTAL,
    `total must be exactly ${EXPECTED_TOTAL}`);

  const counts = { mapped: 0, redesigned: 0, retired: 0, missing: 0 };
  for (const ep of endpoints) counts[ep.disposition.toLowerCase()]++;
  assert.equal(counts.mapped, summary.mapped, "mapped count mismatch");
  assert.equal(counts.redesigned, summary.redesigned, "redesigned count mismatch");
  assert.equal(counts.retired, summary.retired, "retired count mismatch");
  assert.equal(counts.missing, summary.missing, "missing count mismatch");
  assert.equal(counts.missing, EXPECTED_MISSING,
    `missing endpoints must be exactly ${EXPECTED_MISSING}`);
});

test("API01-P02 all endpoints have a valid disposition (none left as OPEN)", () => {
  const valid = new Set(["MAPPED", "REDESIGNED", "RETIRED", "MISSING"]);
  const bad = endpoints.filter(ep => !valid.has(ep.disposition));
  assert.equal(bad.length, 0,
    `${bad.length} endpoints have invalid disposition: ${bad.map(e => e.legacyPath).join(", ")}`);
});

test("API01-P02 every MAPPED endpoint has a vNextPath file that exists on disk", () => {
  const mapped = endpoints.filter(ep => ep.disposition === "MAPPED");
  assert.ok(mapped.length > 0, "must have at least one MAPPED endpoint");
  const missing = [];
  for (const ep of mapped) {
    assert.ok(ep.vNextPath, `MAPPED endpoint ${ep.legacyPath} has no vNextPath`);
    const abs = path.join(root, ep.vNextPath);
    if (!fs.existsSync(abs)) missing.push(`${ep.legacyPath} → ${ep.vNextPath}`);
  }
  assert.equal(missing.length, 0,
    `MAPPED vNextPath files not found on disk:\n${missing.join("\n")}`);
});

test("API01-P02 every REDESIGNED endpoint has a vNextPath and notes", () => {
  const redesigned = endpoints.filter(ep => ep.disposition === "REDESIGNED");
  const problems = [];
  for (const ep of redesigned) {
    if (!ep.vNextPath) problems.push(`${ep.legacyPath}: missing vNextPath`);
    if (!ep.notes || ep.notes.trim().length === 0)
      problems.push(`${ep.legacyPath}: missing redesign notes`);
    else {
      const abs = path.join(root, ep.vNextPath);
      if (!fs.existsSync(abs))
        problems.push(`${ep.legacyPath} → ${ep.vNextPath}: vNextPath file not on disk`);
    }
  }
  assert.equal(problems.length, 0,
    `REDESIGNED endpoint problems:\n${problems.join("\n")}`);
});

test("API01-P02 every MISSING endpoint has documented notes explaining the gap", () => {
  const missing = endpoints.filter(ep => ep.disposition === "MISSING");
  const undocumented = missing.filter(ep => !ep.notes || ep.notes.trim().length < 10);
  assert.equal(undocumented.length, 0,
    `MISSING endpoints without adequate gap notes: ${undocumented.map(e => e.legacyPath).join(", ")}`);
});

test("API01-P02 missingGapNotes covers all major gap clusters", () => {
  assert.ok(Array.isArray(missingGapNotes) && missingGapNotes.length >= 8,
    "must have at least 8 gap cluster notes covering the documented missing areas");
  const text = missingGapNotes.join(" ").toLowerCase();
  assert.ok(text.includes("tenant") || text.includes("settings"), "gap notes must mention tenant/settings gaps");
  assert.ok(text.includes("impersonat") || text.includes("superadmin users") || text.includes("user admin"),
    "gap notes must mention impersonation/superadmin user gaps");
  assert.ok(text.includes("domain") || text.includes("switch"), "gap notes must mention domain/switch gaps");
});

test("API01-P02 frozen legacy SHA is pinned correctly", () => {
  assert.equal(crosswalk.frozenLegacySha, FROZEN_SHA,
    "frozenLegacySha must match the canonical frozen legacy backend SHA");
});

test("API01-P02 admin mutation routes have an auth guard (isSameOriginRequest or getCurrentRequestContext)", () => {
  const adminDir = path.join(root, "src/app/api/admin");
  if (!fs.existsSync(adminDir)) {
    assert.fail("src/app/api/admin directory not found");
    return;
  }

  // Recursively find all route.ts files under admin/
  function findRoutes(dir) {
    const routes = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) routes.push(...findRoutes(full));
      else if (entry.isFile() && entry.name === "route.ts") routes.push(full);
    }
    return routes;
  }

  const routes = findRoutes(adminDir);
  assert.ok(routes.length > 0, "must find at least one admin route.ts");

  const mutationMethods = ["POST", "PUT", "PATCH", "DELETE"];
  const authPatterns = [
    "isSameOriginRequest",
    "getCurrentRequestContext",
    "exportSuperAdminScoped",
    "isSuperAdmin",
    "requireSuperAdmin",
    "INTERNAL_ONLY",
  ];

  const unguarded = [];
  for (const routeFile of routes) {
    const src = fs.readFileSync(routeFile, "utf8");
    // Only check if the route exports mutation handlers
    const hasMutation = mutationMethods.some(m =>
      src.includes(`async function ${m}`) || src.includes(`function ${m}`)
    );
    if (!hasMutation) continue;

    const hasGuard = authPatterns.some(p => src.includes(p));
    if (!hasGuard) {
      unguarded.push(path.relative(root, routeFile));
    }
  }

  assert.equal(unguarded.length, 0,
    `Admin mutation routes with no recognisable auth guard:\n${unguarded.join("\n")}`);
});

test("API01-P02 auth route files export the expected HTTP methods", () => {
  const checks = [
    { file: "src/app/api/auth/memberships/route.ts", methods: ["GET"] },
    { file: "src/app/api/v1/auth/logout/route.ts", methods: ["POST"] },
    { file: "src/app/api/v1/organization/create/route.ts", methods: ["POST"] },
    { file: "src/app/api/v1/organization/fetch/route.ts", methods: ["GET"] },
    { file: "src/app/api/v1/public/tenant-bootstrap/route.ts", methods: ["GET"] },
    { file: "src/app/api/admin/module-access/tree/route.ts", methods: ["GET"] },
  ];
  for (const { file, methods } of checks) {
    const abs = path.join(root, file);
    assert.ok(fs.existsSync(abs), `Route file not found: ${file}`);
    const src = fs.readFileSync(abs, "utf8");
    for (const m of methods) {
      const exported = src.includes(`function ${m}`) || src.includes(`export const ${m} =`) || src.includes(`export {${m}`) ||
        src.includes(`export { ${m}`) || src.includes(`${m} }`);
      assert.ok(exported, `${file} does not export ${m} handler`);
    }
  }
});
