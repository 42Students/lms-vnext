import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inspectClosureFirst, inspectTracker } from "../scripts/tracker.mjs";

const fresh = () => JSON.parse(readFileSync("docs/tracker.json", "utf8"));
const clone = value => JSON.parse(JSON.stringify(value));

test("closure-first is the same canonical 81-task tracker, not another progress source", () => {
  const doc=fresh();
  const report=inspectClosureFirst(doc);
  assert.equal(report.accepted, doc.tasks.filter(t=>t.done).length);
  assert.equal(report.total, doc.tasks.length);
  assert.equal(report.remaining, doc.tasks.filter(t=>!t.done).length);
  assert.equal(report.maximumUnacceptedPassesPerTask, 2);
  assert.ok(report.priority.length>0);
  const ids=new Set();
  for(const item of report.priority){
    assert.equal(doc.tasks.find(t=>t.id===item.id)?.done,false);
    assert.ok(!ids.has(item.id));
    assert.ok(item.nextGate?.trim());
    assert.ok(doc.execution.lanes.find(l=>l.id===item.laneId)?.dbTaskIds.includes(item.id));
    ids.add(item.id);
  }
  assert.deepEqual(inspectTracker(doc).errors,[]);
});

test("lane-specific queue shows only open owned work and skips completed items", () => {
  const doc=fresh();
  for(const lane of doc.execution.lanes){
    const report=inspectClosureFirst(doc,lane.id);
    assert.ok(report.priority.every(q=>q.laneId===lane.id));
    const open=new Set(lane.dbTaskIds.filter(id=>doc.tasks.some(t=>t.id===id&&!t.done)));
    assert.equal(report.remaining,open.size);
    assert.ok(report.priority.every(q=>open.has(q.id)));
    assert.ok(report.otherOpen.every(id=>open.has(id)));
  }
  const accepted=doc.tasks.find(t=>t.done && doc.execution.lanes.some(l=>l.dbTaskIds.includes(t.id)));
  const owner=doc.execution.lanes.find(l=>l.dbTaskIds.includes(accepted.id));
  const changed=clone(doc);
  changed.execution.closureFirstProtocol.focusTasks.push({
    id:accepted.id,laneId:owner.id,nextGate:"Previously accepted, skip unless independently verified regression",
  });
  assert.ok(!inspectClosureFirst(changed).priority.some(q=>q.id===accepted.id),
    "stale focus hint must never reopen an accepted task");
});

test("closure protocol fails closed on wrong lane ownership or missing executable gate", () => {
  const doc=fresh(),index=0;
  const invalidOwner=clone(doc);
  invalidOwner.execution.closureFirstProtocol.focusTasks[index].laneId="L99";
  assert.ok(inspectTracker(invalidOwner).errors.some(e=>e.code==="INVALID_CLOSURE_FIRST_FOCUS"));
  const missingGate=clone(doc);
  missingGate.execution.closureFirstProtocol.focusTasks[index].nextGate="";
  assert.ok(inspectTracker(missingGate).errors.some(e=>e.code==="INVALID_CLOSURE_FIRST_FOCUS"));
  const noTwoPass=clone(doc);
  noTwoPass.execution.closureFirstProtocol.laneRules.maximumUnacceptedPassesPerTask=999;
  assert.ok(inspectTracker(noTwoPass).errors.some(e=>e.code==="INVALID_CLOSURE_FIRST_PROTOCOL"));
  const duplicate=clone(doc);
  duplicate.execution.closureFirstProtocol.focusTasks.push(
    clone(duplicate.execution.closureFirstProtocol.focusTasks[0]));
  assert.ok(inspectTracker(duplicate).errors.some(e=>e.code==="INVALID_CLOSURE_FIRST_FOCUS"));
});

test("a stage-only accepted task cannot erase its remaining runtime implementation", () => {
  const doc=fresh();
  const stage=doc.tasks.find(t => t.done &&
    /^EXECUTED_SCOPED_SOURCE.*ENGINEERING_ACCEPTANCE$/.test(t.closureBasis ?? ""));
  assert.ok(stage,"Expected an existing scoped stage acceptance fixture");
  const noOwners=clone(doc);
  noOwners.tasks.find(t=>t.id===stage.id).remainingDistinctIntegrationTasks=[];
  assert.ok(inspectTracker(noOwners).errors.some(e =>
    e.code==="STAGED_SCOPE_MISSING_DISTINCT_RUNTIME_OWNER" && e.id===stage.id));
  const noBoundary=clone(doc);
  delete noBoundary.tasks.find(t=>t.id===stage.id).notInThisTaskAcceptance;
  assert.ok(inspectTracker(noBoundary).errors.some(e =>
    e.code==="STAGED_SCOPE_MISSING_DISTINCT_RUNTIME_OWNER" && e.id===stage.id));
  const noScope=clone(doc);
  noScope.tasks.find(t=>t.id===stage.id).acceptanceScope="";
  assert.ok(inspectTracker(noScope).errors.some(e =>
    e.code==="STAGED_SCOPE_MISSING_DISTINCT_RUNTIME_OWNER" && e.id===stage.id));
  const noSemantics=clone(doc);
  delete noSemantics.execution.closureFirstProtocol.scopeSemantics;
  assert.ok(inspectTracker(noSemantics).errors.some(e =>
    e.code==="INVALID_CLOSURE_SCOPE_SEMANTICS"));
});

test("explicit closure-first instructions are visible to every entrypoint", () => {
  const agent=readFileSync("AGENTS.md","utf8");
  const readme=readFileSync("README.md","utf8");
  assert.match(agent,/closure-first/i);
  assert.match(agent,/--closure-next/);
  assert.match(agent,/two (?:useful |unaccepted )?passes|two no-closure passes/i);
  assert.match(readme,/--closure-next/);
  assert.match(readme,/docs\/tracker\.json/);
});
