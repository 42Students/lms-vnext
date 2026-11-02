// API-10: Global API phase reconciliation gate.
// Verifies all 9 crosswalks present and internally consistent, all API tasks
// have P01+P02 done, DB prerequisites satisfied.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tracker = JSON.parse(fs.readFileSync(path.join(root, "docs/tracker.json"), "utf8"));

test("API-10 global reconciliation: 9 domain crosswalks present", () => {
  for (let i = 1; i <= 9; i++) {
    const num = String(i).padStart(2, "0");
    const p = path.join(root, "docs/planning", `api-crosswalk-api${num}.json`);
    assert.ok(fs.existsSync(p), `api-crosswalk-api${num}.json missing`);
  }
});

test("API-10 global reconciliation: every crosswalk summary is internally consistent", () => {
  for (let i = 1; i <= 9; i++) {
    const num = String(i).padStart(2, "0");
    const c = JSON.parse(fs.readFileSync(
      path.join(root, "docs/planning", `api-crosswalk-api${num}.json`), "utf8"));
    const s = c.summary;
    const sum = s.mapped + s.redesigned + (s.retired || 0) + s.missing;
    assert.equal(sum, s.total,
      `API-${num} crosswalk: ${s.mapped}+${s.redesigned}+${s.retired||0}+${s.missing}=${sum} != total ${s.total}`);
    // Each endpoint in the array must have a disposition that is not OPEN
    const open = c.endpoints.filter(e => !e.disposition || e.disposition === "OPEN");
    assert.equal(open.length, 0,
      `API-${num} crosswalk has ${open.length} endpoints with OPEN/missing disposition`);
  }
});

test("API-10 global reconciliation: all API-01..09 tasks have both P01 and P02 packages done", () => {
  for (let i = 1; i <= 9; i++) {
    const id = `API-0${i}`;
    const task = tracker.tasks.find(t => t.id === id);
    assert.ok(task?.done, `${id} not done`);
    const p1 = task.workPlan?.packages?.find(p => p.id?.endsWith("-P01"));
    const p2 = task.workPlan?.packages?.find(p => p.id?.endsWith("-P02"));
    assert.ok(p1?.done, `${id}-P01 not done`);
    assert.ok(p2?.done, `${id}-P02 not done`);
    assert.ok(p1?.acceptanceEvidence?.length > 0, `${id}-P01 missing evidence`);
    assert.ok(p2?.acceptanceEvidence?.length > 0, `${id}-P02 missing evidence`);
  }
});

test("API-10 global reconciliation: DB phase prerequisite — DB-019 and DB-020 done", () => {
  const db019 = tracker.tasks.find(t => t.id === "DB-019");
  const db020 = tracker.tasks.find(t => t.id === "DB-020");
  assert.ok(db019?.done, "DB-019 must be done before API phase certification");
  assert.ok(db020?.done, "DB-020 must be done before API phase certification");
});
