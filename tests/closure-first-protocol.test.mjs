import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inspectClosureFirst,inspectTracker} from "../scripts/tracker.mjs";

const fresh=()=>JSON.parse(readFileSync("docs/tracker.json","utf8"));
const clone=value=>structuredClone(value);

test("closure-first uses the same canonical 81-task tracker, without worker claims",()=>{
  const doc=fresh(),report=inspectClosureFirst(doc);
  assert.equal(report.accepted,doc.tasks.filter(t=>t.done).length);
  assert.equal(report.total,doc.tasks.length);
  assert.equal(report.remaining,doc.tasks.filter(t=>!t.done).length);
  assert.equal(report.maximumUnacceptedPassesPerTask,2);
  assert.ok(report.priority.length>0);
  const ids=new Set();
  for(const item of report.priority){
    assert.equal(doc.tasks.find(t=>t.id===item.id)?.done,false);
    assert.ok(!ids.has(item.id));
    assert.ok(item.nextGate?.trim());
    assert.equal(Object.hasOwn(item,"laneId"),false);
    assert.equal(Object.hasOwn(item,"laneClaim"),false);
    ids.add(item.id);
  }
  assert.deepEqual(inspectTracker(doc).errors,[]);
});

test("any OPEN task is eligible; an accepted task in stale priority never reopens",()=>{
  const doc=fresh();
  const queue=inspectClosureFirst(doc);
  const covered=new Set([...queue.priority.map(q=>q.id),...queue.otherOpen]);
  assert.deepEqual([...covered].sort(),doc.tasks.filter(t=>!t.done).map(t=>t.id).sort());
  const accepted=doc.tasks.find(t=>t.done);
  const changed=clone(doc);
  changed.execution.closureFirstProtocol.focusTasks.push({
    id:accepted.id,nextGate:"Already accepted: skip absent a reproduced regression",
  });
  assert.ok(!inspectClosureFirst(changed).priority.some(q=>q.id===accepted.id),
    "stale focus hints must not reopen accepted tasks");
});

test("closure protocol rejects obsolete lane ownership, missing proof gates and relaxation",()=>{
  const doc=fresh();
  const owned=clone(doc);
  owned.execution.closureFirstProtocol.focusTasks[0].laneId="L99";
  assert.ok(inspectTracker(owned).errors.some(e=>e.code==="INVALID_CLOSURE_FIRST_FOCUS"));
  const missingGate=clone(doc);
  missingGate.execution.closureFirstProtocol.focusTasks[0].nextGate="";
  assert.ok(inspectTracker(missingGate).errors.some(e=>e.code==="INVALID_CLOSURE_FIRST_FOCUS"));
  const noTwoPass=clone(doc);
  noTwoPass.execution.closureFirstProtocol.operatingRules.maximumUnacceptedPassesPerTask=999;
  assert.ok(inspectTracker(noTwoPass).errors.some(e=>e.code==="INVALID_CLOSURE_FIRST_PROTOCOL"));
  const duplicate=clone(doc);
  duplicate.execution.closureFirstProtocol.focusTasks.push(
    clone(duplicate.execution.closureFirstProtocol.focusTasks[0]));
  assert.ok(inspectTracker(duplicate).errors.some(e=>e.code==="INVALID_CLOSURE_FIRST_FOCUS"));
});

test("stage-only accepted task never erases separately open runtime acceptance",()=>{
  const doc=fresh();
  const stage=doc.tasks.find(t=>t.done&&
    /^EXECUTED_SCOPED_SOURCE.*ENGINEERING_ACCEPTANCE$/.test(t.closureBasis??""));
  assert.ok(stage,"Expected a scoped stage acceptance fixture");
  const noOwners=clone(doc);
  noOwners.tasks.find(t=>t.id===stage.id).remainingDistinctIntegrationTasks=[];
  assert.ok(inspectTracker(noOwners).errors.some(e=>
    e.code==="STAGED_SCOPE_MISSING_DISTINCT_RUNTIME_OWNER"&&e.id===stage.id));
  const noBoundary=clone(doc);
  delete noBoundary.tasks.find(t=>t.id===stage.id).notInThisTaskAcceptance;
  assert.ok(inspectTracker(noBoundary).errors.some(e=>
    e.code==="STAGED_SCOPE_MISSING_DISTINCT_RUNTIME_OWNER"&&e.id===stage.id));
  const noScope=clone(doc);
  noScope.tasks.find(t=>t.id===stage.id).acceptanceScope="";
  assert.ok(inspectTracker(noScope).errors.some(e=>
    e.code==="STAGED_SCOPE_MISSING_DISTINCT_RUNTIME_OWNER"&&e.id===stage.id));
  const noSemantics=clone(doc);
  delete noSemantics.execution.closureFirstProtocol.scopeSemantics;
  assert.ok(inspectTracker(noSemantics).errors.some(e=>
    e.code==="INVALID_CLOSURE_SCOPE_SEMANTICS"));
});

test("the new open-contribution policy is visible at both primary entrypoints",()=>{
  const agent=readFileSync("AGENTS.md","utf8");
  const readme=readFileSync("README.md","utf8");
  assert.match(agent,/closure-first/i);
  assert.match(agent,/--closure-next/);
  assert.match(agent,/no worker lanes/i);
  assert.match(agent,/two (?:useful |unaccepted )?passes|two no-closure passes/i);
  assert.match(readme,/--closure-next/);
  assert.match(readme,/docs\/tracker\.json/);
});
