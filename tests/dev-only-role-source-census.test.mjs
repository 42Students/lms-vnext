import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inspectTracker, inspectClosureFirst } from "../scripts/tracker.mjs";

const doc=JSON.parse(readFileSync("docs/audit/legacy-dev-census/2026-11-03-role-delta.json","utf8"));
const tracker=JSON.parse(readFileSync("docs/tracker.json","utf8"));
const matrix=readFileSync("docs/planning/account-surface-parity.md","utf8");

test("frozen prod→dev FE and BE source identities are explicit, not screenshots or stale names",()=>{
  for(const key of ["legacyFrontendDev","legacyFrontendProd","legacyBackendDev","legacyBackendProd","vNextAtCensus"]){
    assert.match(doc.source[key].sha,/^[0-9a-f]{40}$/);
  }
  assert.notEqual(doc.source.legacyFrontendDev.sha,doc.source.legacyFrontendProd.sha);
  assert.notEqual(doc.source.legacyBackendDev.sha,doc.source.legacyBackendProd.sha);
});

test("dev-only user role source files are all uniquely counted without inventing 37 user jobs",()=>{
  const coordinator=doc.devOnlyFrontend.coordinator, global=doc.devOnlyFrontend.globalTpo;
  assert.equal(coordinator.length,24);
  assert.equal(global.length,13);
  assert.equal(new Set([...coordinator,...global]).size,37);
  assert.ok(coordinator.every(p=>p.startsWith("src/pages/course-coordinator/")&&p.endsWith(".js")));
  assert.ok(global.every(p=>p.startsWith("src/pages/global-tpo/")&&p.endsWith(".js")));
  assert.equal(doc.devOnlyFrontend.routePageFiles,37);
  assert.equal(doc.devOnlyFrontend.uiComponentFiles,57);
  assert.equal(doc.devOnlyBackend.coordinatorControllerFiles,27);
  assert.equal(doc.devOnlyBackend.globalTpoAndSuperadminStaffControllerFiles,18);
});

test("fresh dev-only roles have explicit OPEN canonical tasks and milestones",()=>{
  const expected=["UI-11","UI-12","UI-13"];
  assert.deepEqual(tracker.tasks.filter(t=>t.done!==true).map(t=>t.id),expected);
  assert.equal(tracker.tasks.length,104);
  assert.equal(tracker.tasks.filter(t=>t.done===true).length,101);
  for(const id of expected){
    const item=tracker.tasks.find(t=>t.id===id);
    const milestone=tracker.execution.milestones.find(m=>m.id===id);
    assert.equal(item.phase,"UI");
    assert.equal(item.done,false);
    assert.deepEqual(item.acceptanceEvidence,[]);
    assert.equal(milestone?.done,false);
    assert.ok(milestone.requirements.some(x=>/browser|permission|scope|evidence/i.test(x)));
  }
  assert.deepEqual(inspectTracker(tracker).errors,[]);
  const queue=inspectClosureFirst(tracker);
  assert.deepEqual(new Set([...queue.priority.map(r=>r.id),...queue.otherOpen]),new Set(expected));
});

test("existing matrix tracks each unimplemented account as MISSING without claiming runtime closure",()=>{
  assert.match(matrix,/Current legacy DEV-only account obligations/);
  for(const group of ["Course Coordinator: authorized per-course","Global TPO: cross-college"]){
    assert.ok(matrix.includes(group));
    const row=matrix.split("\n").find(line=>line.startsWith("| "+group));
    assert.ok(row);
    assert.match(row,/\|\s*MISSING\s*\|$/);
  }
  assert.ok(doc.caveats.some(line=>line.includes("not unique user jobs")));
});
