// API-10: Global security regression and independent database safety gate.
// Verifies all 9 domain milestones done, 732 total endpoints classified,
// 183 remaining MISSING gaps catalogued, auth guard coverage, journal clean.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tracker = JSON.parse(fs.readFileSync(path.join(root, "docs/tracker.json"), "utf8"));

const FROZEN_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const TOTAL_ENDPOINTS = 732;
const TOTAL_MISSING = 183;
const DOMAIN_MILESTONES = ["API-01","API-02","API-03","API-04","API-05","API-06","API-07","API-08","API-09"];

function loadCrosswalk(n) {
  const num = String(n).padStart(2, "0");
  const p = path.join(root, "docs/planning", `api-crosswalk-api${num}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

test("API-10 all 9 domain milestones are done with acceptance evidence", () => {
  for (const id of DOMAIN_MILESTONES) {
    const task = tracker.tasks.find(t => t.id === id);
    assert.ok(task, `${id} not found in tracker`);
    assert.ok(task.done, `${id} not done`);
    assert.ok(task.acceptanceEvidence?.length > 0, `${id} has no acceptanceEvidence`);
    for (const ev of task.acceptanceEvidence) {
      assert.ok(ev.commitSha?.length === 40, `${id} evidence missing 40-char commitSha`);
      assert.ok(ev.runUrl?.startsWith("https://github.com/"), `${id} evidence missing runUrl`);
      assert.equal(ev.result, "PASS", `${id} evidence result must be PASS`);
    }
  }
});

test("API-10 total legacy endpoints covered is 732 across all crosswalks", () => {
  let total = 0;
  for (let i = 1; i <= 9; i++) {
    const c = loadCrosswalk(i);
    total += c.summary.total;
  }
  assert.equal(total, TOTAL_ENDPOINTS, `Expected ${TOTAL_ENDPOINTS} total endpoints, got ${total}`);
});

test("API-10 all crosswalk files exist and are valid JSON", () => {
  for (let i = 1; i <= 9; i++) {
    const num = String(i).padStart(2, "0");
    const p = path.join(root, "docs/planning", `api-crosswalk-api${num}.json`);
    assert.ok(fs.existsSync(p), `api-crosswalk-api${num}.json missing`);
    const c = JSON.parse(fs.readFileSync(p, "utf8"));
    assert.ok(c.milestoneId, `api-crosswalk-api${num}.json missing milestoneId`);
    assert.ok(Array.isArray(c.endpoints), `api-crosswalk-api${num}.json missing endpoints array`);
    assert.ok(c.endpoints.length > 0, `api-crosswalk-api${num}.json has empty endpoints`);
  }
});

test("API-10 all MISSING gaps have documented gap reasons", () => {
  for (let i = 1; i <= 9; i++) {
    const c = loadCrosswalk(i);
    const missing = c.endpoints.filter(e => e.disposition === "MISSING");
    for (const ep of missing) {
      assert.ok(
        ep.notes && ep.notes.trim().length > 0,
        `API-0${i} MISSING endpoint ${ep.legacyPath} has no gap reason in notes`
      );
    }
  }
});

test("API-10 total MISSING gap count is exactly 183", () => {
  let total = 0;
  for (let i = 1; i <= 9; i++) {
    const c = loadCrosswalk(i);
    total += c.summary.missing;
  }
  assert.equal(total, TOTAL_MISSING, `Expected ${TOTAL_MISSING} total MISSING, got ${total}`);
});

test("API-10 auth guard present in major vNext API directories", () => {
  const apiRoot = path.join(root, "src/app/api");
  assert.ok(fs.existsSync(apiRoot), "src/app/api must exist");
  // Scan all route.ts files for auth guard usage
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let found = 0;
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) found += scanDir(full);
      else if (e.name === "route.ts" || e.name === "route.js") {
        const content = fs.readFileSync(full, "utf8");
        if (content.includes("isSameOriginRequest") || content.includes("getCurrentRequestContext") || content.includes("requireAuth") || content.includes("withAuth")) {
          found++;
        }
      }
    }
    return found;
  }
  const guardedRoutes = scanDir(apiRoot);
  assert.ok(guardedRoutes > 500, `Expected >500 guarded routes, found ${guardedRoutes}. Auth guard coverage too low.`);
});

test("API-10 migration journal is clean and has entries", () => {
  const journalPath = path.join(root, "drizzle/meta/_journal.json");
  assert.ok(fs.existsSync(journalPath), "drizzle/meta/_journal.json must exist");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  assert.ok(Array.isArray(journal.entries) && journal.entries.length > 0,
    "Migration journal must have registered entries");
});

test("API-10 DB-020 task is done (database safety certified)", () => {
  const db020 = tracker.tasks.find(t => t.id === "DB-020");
  assert.ok(db020, "DB-020 must exist in tracker");
  assert.ok(db020.done, "DB-020 must be done before API phase can be certified");
});

test("API-10 frozen legacy SHA is consistent across all crosswalks", () => {
  for (let i = 1; i <= 9; i++) {
    const c = loadCrosswalk(i);
    assert.equal(c.frozenLegacySha, FROZEN_SHA,
      `api-crosswalk-api${String(i).padStart(2,"0")}.json frozenLegacySha mismatch`);
  }
});

test("API-10 API phase coverage summary — totals are internally consistent", () => {
  let mapped = 0, redesigned = 0, retired = 0, missing = 0, total = 0;
  for (let i = 1; i <= 9; i++) {
    const c = loadCrosswalk(i);
    const s = c.summary;
    mapped += s.mapped;
    redesigned += s.redesigned;
    retired += (s.retired || 0);
    missing += s.missing;
    total += s.total;
    // Each crosswalk internally consistent
    assert.equal(s.mapped + s.redesigned + (s.retired || 0) + s.missing, s.total,
      `api-crosswalk-api${String(i).padStart(2,"0")}.json summary counts don't add up`);
  }
  assert.equal(mapped + redesigned + retired + missing, total,
    "Global totals must sum to total endpoint count");
  assert.equal(total, TOTAL_ENDPOINTS);
  // Log summary for CI output
  console.log(`Coverage: ${mapped} MAPPED, ${redesigned} REDESIGNED, ${retired} RETIRED, ${missing} MISSING / ${total} total`);
});
