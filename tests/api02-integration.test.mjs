// API-02-P02: Academics, groups, electives integration gate.
// Source-only — no database. Verifies crosswalk integrity, MAPPED file existence,
// auth guard coverage on academics/college routes, and MISSING gap catalogue.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api02.json");
const followupPath = path.join(root, "docs/planning/db02-api-followup-after-database.md");

const crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
const endpoints = crosswalk.endpoints;
const summary = crosswalk.summary;

test("API-02 crosswalk summary integrity — counts add up to total", () => {
  const counted = summary.mapped + summary.redesigned + summary.retired + summary.missing;
  assert.equal(counted, summary.total,
    `Summary counts (${counted}) do not add up to total (${summary.total})`);
  assert.equal(summary.total, 94, "Expected 94 total legacy endpoints for API-02");
  assert.equal(endpoints.length, summary.total,
    `Endpoint array length (${endpoints.length}) must equal summary.total (${summary.total})`);
});

test("API-02 all MAPPED endpoints have vNextPath verified on disk", () => {
  const mapped = endpoints.filter(e => e.disposition === "MAPPED");
  assert.equal(mapped.length, summary.mapped, `Expected ${summary.mapped} MAPPED entries`);
  for (const ep of mapped) {
    assert.ok(ep.vNextPath, `MAPPED endpoint ${ep.legacyPath} missing vNextPath`);
    const full = path.join(root, ep.vNextPath);
    assert.ok(fs.existsSync(full),
      `MAPPED ${ep.legacyPath} → ${ep.vNextPath} does not exist on disk`);
  }
});

test("API-02 all endpoints have a disposition that is not OPEN", () => {
  const VALID = new Set(["MAPPED", "REDESIGNED", "RETIRED", "MISSING"]);
  for (const ep of endpoints) {
    assert.ok(VALID.has(ep.disposition),
      `${ep.legacyPath} has invalid disposition: ${ep.disposition}`);
  }
});

test("API-02 every REDESIGNED endpoint has vNextPath and notes", () => {
  const redesigned = endpoints.filter(e => e.disposition === "REDESIGNED");
  assert.equal(redesigned.length, summary.redesigned);
  for (const ep of redesigned) {
    assert.ok(ep.vNextPath, `REDESIGNED ${ep.legacyPath} missing vNextPath`);
    assert.ok(ep.notes && ep.notes.length > 0, `REDESIGNED ${ep.legacyPath} missing notes`);
    const full = path.join(root, ep.vNextPath);
    assert.ok(fs.existsSync(full),
      `REDESIGNED ${ep.legacyPath} → ${ep.vNextPath} does not exist on disk`);
  }
});

test("API-02 MISSING endpoints count matches summary and have documented gap notes", () => {
  const missing = endpoints.filter(e => e.disposition === "MISSING");
  assert.equal(missing.length, summary.missing,
    `Expected ${summary.missing} MISSING, got ${missing.length}`);
  assert.equal(missing.length, 24, "API-02 must have exactly 24 documented MISSING endpoints");
  for (const ep of missing) {
    assert.ok(ep.notes && ep.notes.length > 10,
      `MISSING ${ep.legacyPath} needs a substantive gap note`);
    assert.equal(ep.vNextPath, null, `MISSING ${ep.legacyPath} should have null vNextPath`);
  }
});

test("API-02 learner groups gap is formally documented (5 endpoints)", () => {
  const learnerGroupMissing = endpoints.filter(
    e => e.disposition === "MISSING" && e.legacyController === "LearnerGroupController"
  );
  assert.equal(learnerGroupMissing.length, 5,
    "All 5 LearnerGroupController endpoints must be MISSING");
  for (const ep of learnerGroupMissing) {
    assert.ok(ep.notes.includes("No learner-facing groups API"),
      `LearnerGroupController MISSING endpoint ${ep.legacyPath} must note absent learner groups API`);
  }
});

test("API-02 academics routes have auth guard on mutations", () => {
  const academicsDir = path.join(root, "src/app/api/academics");
  const collegeDir = path.join(root, "src/app/api/college");
  let checkedRoutes = 0;
  let violations = [];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { scanDir(full); continue; }
      if (e.name !== "route.ts") continue;
      const src = fs.readFileSync(full, "utf8");
      const hasMutation = /export (?:async function|const) (POST|PUT|PATCH|DELETE)\b/.test(src);
      if (!hasMutation) continue;
      checkedRoutes++;
      const hasGuard = (src.includes("isSameOriginRequest") || src.includes("@/security/route")) ||
                       src.includes("@/security/route") ||
                       (src.includes("getCurrentRequestContext") || src.includes("@/security/route")) ||
                       src.includes("requireAdminAccess") ||
                       src.includes("requireCollegeAdmin") ||
                       src.includes("requireFaculty");
      if (!hasGuard) {
        violations.push(path.relative(root, full));
      }
    }
  }

  scanDir(academicsDir);
  scanDir(collegeDir);

  assert.ok(checkedRoutes > 0, "Must find mutation route files to check");
  assert.equal(violations.length, 0,
    `Routes with mutations but no auth guard:\n${violations.join("\n")}`);
});

test("API-02 tenant-scoped endpoints use getCurrentRequestContext", () => {
  const tenantScoped = endpoints.filter(e => e.tenantScoped && e.vNextPath);
  let missing = [];
  for (const ep of tenantScoped) {
    const full = path.join(root, ep.vNextPath);
    if (!fs.existsSync(full)) continue;
    const src = fs.readFileSync(full, "utf8");
    if (!(src.includes("getCurrentRequestContext") || src.includes("@/security/route"))) {
      missing.push(ep.vNextPath);
    }
  }
  assert.equal(missing.length, 0,
    `Tenant-scoped routes missing getCurrentRequestContext:\n${missing.join("\n")}`);
});

test("API-02 related planning doc db02-api-followup exists and covers academics", () => {
  assert.ok(fs.existsSync(followupPath),
    "docs/planning/db02-api-followup-after-database.md must exist");
  const content = fs.readFileSync(followupPath, "utf8");
  assert.ok(content.toLowerCase().includes("cohort") || content.toLowerCase().includes("batch") || content.toLowerCase().includes("program"),
    "db02-api-followup must reference academic domain concepts (cohort/batch/program)");
});

test("API-02 frozen legacy SHA matches expected value", () => {
  assert.equal(crosswalk.frozenLegacySha, "21bad59d4dfaf2fa11fdeaf9353327ce105697d5",
    "frozenLegacySha must match canonical frozen legacy backend SHA");
});
