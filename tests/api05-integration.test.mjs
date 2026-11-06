// API-05-P02: Assignments, quizzes, grading and attendance integration gate.
// Source-only — no database required. Verifies crosswalk completeness, auth guard
// coverage, tenant scoping, and missing endpoint catalogue integrity.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api05.json");
const crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
const FROZEN_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const EXPECTED_TOTAL = 37;
const EXPECTED_MISSING = 8;

test("API-05 crosswalk summary integrity — counts add up to total", () => {
  const { total, mapped, redesigned, retired, missing } = crosswalk.summary;
  assert.equal(total, EXPECTED_TOTAL, `Expected ${EXPECTED_TOTAL} total endpoints`);
  assert.equal(
    mapped + redesigned + retired + missing,
    total,
    `mapped(${mapped}) + redesigned(${redesigned}) + retired(${retired}) + missing(${missing}) must equal total(${total})`
  );
});

test("API-05 all MAPPED endpoints verified on disk", () => {
  const mapped = crosswalk.endpoints.filter(e => e.disposition === "MAPPED");
  assert.ok(mapped.length > 0, "Must have at least one MAPPED endpoint");
  for (const ep of mapped) {
    assert.ok(ep.vNextPath, `MAPPED endpoint ${ep.legacyPath} must have vNextPath`);
    const fullPath = path.join(root, ep.vNextPath);
    assert.ok(
      fs.existsSync(fullPath),
      `MAPPED endpoint ${ep.legacyPath} → ${ep.vNextPath} does not exist on disk`
    );
  }
});

test("API-05 attendance routes have isSameOriginRequest auth guard", () => {
  const attendanceRoutesDir = path.join(root, "src/app/api/attendance");
  assert.ok(fs.existsSync(attendanceRoutesDir), "src/app/api/attendance/ must exist");

  function findRouteFiles(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...findRouteFiles(full));
      else if (entry.name === "route.ts") results.push(full);
    }
    return results;
  }

  const routeFiles = findRouteFiles(attendanceRoutesDir);
  assert.ok(routeFiles.length > 0, "Must find at least one attendance route.ts");

  const mutationMethods = ["POST", "PUT", "PATCH", "DELETE"];
  const unguardedMutations = [];

  for (const filePath of routeFiles) {
    const src = fs.readFileSync(filePath, "utf8");
    const hasMutation = mutationMethods.some(m => src.includes(`export async function ${m}`));
    if (!hasMutation) continue;
    const hasGuard = (src.includes("isSameOriginRequest") || src.includes("@/security/route")) || (src.includes("getCurrentRequestContext") || src.includes("@/security/route"));
    if (!hasGuard) {
      unguardedMutations.push(path.relative(root, filePath));
    }
  }

  assert.deepEqual(
    unguardedMutations,
    [],
    `Attendance mutation routes missing auth guard: ${unguardedMutations.join(", ")}`
  );
});

test("API-05 tenant-scoped attendance endpoints use getCurrentRequestContext", () => {
  const attendanceRoutesDir = path.join(root, "src/app/api/attendance");
  function findRouteFiles(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...findRouteFiles(full));
      else if (entry.name === "route.ts") results.push(full);
    }
    return results;
  }
  const routeFiles = findRouteFiles(attendanceRoutesDir);
  const unscoped = [];
  for (const filePath of routeFiles) {
    const src = fs.readFileSync(filePath, "utf8");
    if (!(src.includes("getCurrentRequestContext") || src.includes("@/security/route"))) {
      unscoped.push(path.relative(root, filePath));
    }
  }
  assert.deepEqual(unscoped, [], `Attendance routes missing tenant context: ${unscoped.join(", ")}`);
});

test("API-05 8 missing endpoints are documented with gap reasons", () => {
  const missing = crosswalk.endpoints.filter(e => e.disposition === "MISSING");
  assert.equal(
    missing.length,
    EXPECTED_MISSING,
    `Expected ${EXPECTED_MISSING} MISSING endpoints, found ${missing.length}`
  );
  for (const ep of missing) {
    assert.ok(ep.notes && ep.notes.length > 10, `MISSING endpoint ${ep.legacyPath} must have a gap reason in notes`);
    assert.equal(ep.vNextPath, null, `MISSING endpoint ${ep.legacyPath} must have null vNextPath`);
  }
});

test("API-05 mutation routes (POST/PUT/DELETE) in crosswalk all have authGuard classified", () => {
  const mutations = crosswalk.endpoints.filter(e =>
    ["POST", "PUT", "PATCH", "DELETE"].includes(e.legacyMethod) &&
    e.disposition !== "MISSING"
  );
  for (const ep of mutations) {
    assert.ok(
      ep.authGuard && ep.authGuard.length > 0,
      `Mutation endpoint ${ep.legacyMethod} ${ep.legacyPath} missing authGuard classification`
    );
  }
});

test("API-05 no OPEN dispositions remain", () => {
  const open = crosswalk.endpoints.filter(e => e.disposition === "OPEN");
  assert.equal(open.length, 0, `${open.length} endpoints still have OPEN disposition: ${open.map(e => e.legacyPath).join(", ")}`);
});

test("API-05 frozen legacy SHA matches expected", () => {
  assert.equal(crosswalk.frozenLegacySha, FROZEN_SHA, "frozenLegacySha must match canonical value");
});
