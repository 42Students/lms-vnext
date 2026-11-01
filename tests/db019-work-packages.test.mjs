import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {inspectDb019WorkPackages,inspectTracker} from "../scripts/tracker.mjs";

const path=fileURLToPath(new URL("../docs/tracker.json",import.meta.url));
const canonical=JSON.parse(readFileSync(path,"utf8"));
const copy=()=>structuredClone(canonical);
const plan=doc=>doc.tasks.find(t=>t.id==="DB-019").workPlan;
const row=(doc,id)=>plan(doc).packages.find(p=>p.id===id);

test("DB19 199-table/2829-field package inventory is unique, complete and non-accepting",()=>{
 const r=inspectDb019WorkPackages(canonical);
 assert.deepEqual(r.errors,[]);
 assert.equal(r.packages.length,33);
 assert.equal(r.totalTables,199);
 assert.equal(r.totalFields,2829);
 assert.equal(r.done,1);
 assert.equal(r.picked,1);
 assert.equal(r.unpickedOpen,31);
 assert.equal(row(canonical,"DB19-P20").pickedBy,"CURRENT_CHAT_AFTER_COLLEGE");
 assert.equal(canonical.tasks.find(t=>t.id==="DB-019").done,false);
 assert.equal(canonical.tasks.filter(t=>t.done).length,79);
 assert.equal(inspectTracker(canonical).readyForNextPhase,false);
});

test("DB19 pickup status requires named chat assignment but does not certify work",()=>{
 const d=copy(),p=row(d,"DB19-P03");
 p.picked=true;
 assert.ok(inspectDb019WorkPackages(d).errors.some(e=>e.code==="DB19_PICKED_WITHOUT_ASSIGNEE"));
 p.pickedBy="CHAT_A";
 assert.deepEqual(inspectDb019WorkPackages(d).errors,[]);
 assert.equal(p.done,false);
 p.picked=false;
 assert.ok(inspectDb019WorkPackages(d).errors.some(e=>e.code==="DB19_UNPICKED_WITH_ASSIGNEE"));
});

test("DB19 rejects double-assigned source tables, missing fields and lost gates",()=>{
 const d=copy();
 row(d,"DB19-P02").sourceTables.push("flyway_schema_history");
 assert.ok(inspectDb019WorkPackages(d).errors.some(e=>e.code==="DB19_DUPLICATE_OR_INVALID_SOURCE_TABLE"));
 const e=copy();
 row(e,"DB19-P04").sourceFieldCount-=1;
 assert.ok(inspectDb019WorkPackages(e).errors.some(x=>x.code==="DB19_DOMAIN_COVERAGE_DRIFT"));
 const f=copy();
 plan(f).packages=plan(f).packages.filter(p=>p.id!=="DB19-P32");
 assert.ok(inspectDb019WorkPackages(f).errors.some(x=>x.code==="DB19_FINAL_GATES_INCOMPLETE"));
});

test("DB19 cannot mark undone tasks green or close final gates early",()=>{
 const d=copy(),p=row(d,"DB19-P03");
 p.done=true;
 assert.ok(inspectDb019WorkPackages(d).errors.some(e=>e.code==="DB19_DONE_WITHOUT_EXECUTED_PROOF"));
 const e=copy(),gate=row(e,"DB19-P31");
 gate.done=true;gate.acceptedAt="2026-11-01";
 gate.acceptanceEvidence=[{kind:"EXECUTED_ACCEPTANCE",result:"PASS",
  commitSha:"a".repeat(40),
  runUrl:"https://github.com/42Students/lms-vnext/actions/runs/41200000000"}];
 assert.ok(inspectDb019WorkPackages(e).errors.some(x=>x.code==="DB19_GATE_CLOSED_WITH_OPEN_DEPENDENCIES"));
});

test("DB19 work packages never replace the 81 original acceptance tasks",()=>{
 const d=copy();
 row(d,"DB19-P03").picked=true;row(d,"DB19-P03").pickedBy="CHAT_A";
 assert.equal(d.tasks.length,81);
 assert.equal(d.tasks.filter(t=>t.done).length,79);
 assert.equal(d.tasks.find(t=>t.id==="DB-019").done,false);
 assert.equal(d.tasks.find(t=>t.id==="DB-020").done,false);
});
