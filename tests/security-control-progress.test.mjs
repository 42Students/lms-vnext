import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { extractControls, readCatalogue, inspectSecurityProgress, PROGRAMS, STATES,
  inspectSecurityClosureQueue, SECURITY_CLOSURE_ORDER } from
  "../scripts/security/control-progress.mjs";
import { inspectTracker } from "../scripts/tracker.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const actual=JSON.parse(fs.readFileSync(path.join(root,"docs/tracker.json"),"utf8"));
const copy=()=>structuredClone(actual);
const errors=(doc,catalogue)=>inspectSecurityProgress(doc,catalogue??readCatalogue()).errors.map(e=>e.code);
const first="SEC-01-001";
const evidenced="SEC-08-014";
const partialFixture=()=>{
  const doc=copy();
  // Synthetic status fixture: tests remain valid even after genuine future
  // security progress promotes this real control to VERIFIED.
  doc.security.controls[evidenced]={
    state:"PARTIAL_EVIDENCE",assessedAt:"2026-11-04",
    nextProof:"Independent production authorization and scope review",
    evidence:[{type:"EXECUTED_SCOPED_TEST",
      commitSha:"8b236bedb51d9afa4ec4f9317171bf4f23afc545",
      runUrl:"https://github.com/42Students/lms-vnext/actions/runs/41795753719",
      scope:"Focused export-boundary tests only"}],
  };
  return doc;
};

test("security catalogue has 493 unique requirements across exactly 26 domains",()=>{
  const {rows,byId}=extractControls(readCatalogue());
  assert.equal(rows.length,493);
  assert.equal(byId.size,493);
  assert.equal(new Set(rows.map(x=>x.domain)).size,26);
  assert.equal(PROGRAMS.length,10);
  assert.deepEqual(PROGRAMS.flatMap(x=>x[2]).sort((a,b)=>a-b),
    Array.from({length:26},(_,i)=>i+1));
});
test("canonical tracker has one status for every control and all counts reconcile",()=>{
  const report=inspectSecurityProgress(actual);
  assert.deepEqual(report.errors,[]);
  assert.equal(report.total,493);
  assert.equal(Object.keys(actual.security.controls).length,493);
  assert.equal(report.perProgram.reduce((n,x)=>n+x.total,0),493);
  assert.equal(Object.values(report.counts).reduce((n,x)=>n+x,0),493);
  assert.equal(report.verified+report.remaining+report.counts.NOT_APPLICABLE,493);
  assert.equal(report.assessed+report.counts.UNASSESSED,493);
  assert.equal(report.releaseReady,false);
  assert.deepEqual(inspectTracker(actual).errors,[]);
  // The 101 original DB/API/UI engineering tasks are preserved, not recertified.
  assert.equal(actual.tasks.length,101);
});
test("missing and extra controls fail instead of silently shifting the denominator",()=>{
  const missing=copy();delete missing.security.controls[first];
  assert.ok(errors(missing).includes("SECURITY_CONTROL_MISSING"));
  const extra=copy();extra.security.controls["SEC-99-999"]={state:"UNASSESSED"};
  assert.ok(errors(extra).includes("SECURITY_UNKNOWN_CONTROL"));
  const denominator=copy();denominator.security.controlCount=492;
  assert.ok(errors(denominator).includes("SECURITY_DENOMINATOR_DRIFT"));
});
test("new catalogued requirements fail CI until explicitly added to the tracker",()=>{
  const enlarged=readCatalogue()+"\n- **SEC-26-999** — Newly appended control\n";
  assert.ok(errors(actual,enlarged).includes("SECURITY_CONTROL_MISSING"));
  const duplicate=readCatalogue()+"\n- **SEC-01-001** — Accidental duplicate\n";
  assert.ok(errors(actual,duplicate).includes("SECURITY_CATALOGUE_DUPLICATE_OR_EMPTY"));
});
test("unassessed never masquerades as not started or completed",()=>{
  const doc=copy();doc.security.controls[first]={state:"UNASSESSED",evidence:[{type:"EXECUTED_SCOPED_TEST"}]};
  assert.ok(errors(doc).includes("SECURITY_UNASSESSED_HAS_CLAIMS"));
  delete doc.security.controls[first].evidence;
  doc.security.controls[first].state="DONE";
  assert.ok(errors(doc).includes("SECURITY_INVALID_CONTROL_STATE"));
});
test("partial claims require exact-SHA executed evidence and a next proof",()=>{
  const doc=partialFixture(),item=doc.security.controls[evidenced];
  item.evidence[0].commitSha="a";
  assert.ok(errors(doc).includes("SECURITY_EVIDENCE_INVALID"));
  item.evidence[0].commitSha="8b236bedb51d9afa4ec4f9317171bf4f23afc545";
  item.nextProof="";
  assert.ok(errors(doc).includes("SECURITY_NEXT_PROOF_REQUIRED"));
});
test("implemented but unverified demands explicitly outstanding checks",()=>{
  const doc=partialFixture(),item=doc.security.controls[evidenced];
  item.state="IMPLEMENTED_UNVERIFIED";
  assert.ok(errors(doc).includes("SECURITY_IMPLEMENTED_WITHOUT_REMAINING_CHECKS"));
  item.remainingChecks=["Independent tenant isolation review"];
  assert.ok(!errors(doc).includes("SECURITY_IMPLEMENTED_WITHOUT_REMAINING_CHECKS"));
});
test("verified is impossible without an independent positive/negative, deployed-config receipt",()=>{
  const doc=partialFixture();doc.security.controls[evidenced].state="VERIFIED";
  assert.ok(errors(doc).includes("SECURITY_VERIFIED_WITHOUT_INDEPENDENT_CLOSURE"));
  doc.security.controls[evidenced].closure={
    reviewer:"Independent reviewer",reviewUrl:"https://github.com/42Students/lms-vnext/pull/1",
    commitSha:"8b236bedb51d9afa4ec4f9317171bf4f23afc545",
    acceptedAt:"2026-11-04",positiveAndNegativeVerified:true,
    deployedConfigurationReviewed:false,releaseEvidence:"Some evidence",
  };
  assert.ok(errors(doc).includes("SECURITY_VERIFIED_WITHOUT_INDEPENDENT_CLOSURE"));
});
test("never exclude a control as not applicable without review",()=>{
  const doc=partialFixture();doc.security.controls[evidenced].state="NOT_APPLICABLE";
  assert.ok(errors(doc).includes("SECURITY_UNAPPROVED_EXCLUSION"));
});
test("global release flag cannot bypass 493 open controls",()=>{
  const doc=copy();doc.security.releaseSignoff.approved=true;
  assert.ok(errors(doc).includes("SECURITY_RELEASE_WITH_OPEN_CONTROLS"));
});
test("program reassignment and absence of progress metadata are hard errors",()=>{
  const doc=copy();doc.security.programIds.reverse();
  assert.ok(errors(doc).includes("SECURITY_PROGRAM_REGISTRY_DRIFT"));
  delete doc.security;
  assert.ok(errors(doc).includes("SECURITY_TRACKER_SCHEMA_INVALID"));
});
test("all six known states are explicit, only verified counts as completed",()=>{
  assert.deepEqual(STATES,[
    "UNASSESSED","GAP_CONFIRMED","PARTIAL_EVIDENCE",
    "IMPLEMENTED_UNVERIFIED","VERIFIED","NOT_APPLICABLE",
  ]);
  const report=inspectSecurityProgress(actual);
  assert.equal(report.verified,report.counts.VERIFIED);
  assert.equal(report.remaining,report.total-report.verified-report.counts.NOT_APPLICABLE);
});
test("existing tracker CLI exposes security and refuses invalid bookkeeping",()=>{
  for(const opt of ["--security","--security-json"]){
    const run=spawnSync(process.execPath,["scripts/tracker.mjs",opt],{
      cwd:root,encoding:"utf8",maxBuffer:1024*1024,
    });
    assert.equal(run.status,0,run.stderr);
    assert.match(run.stdout,/493/);
  }
});

test("security is the active workstream without reopening the 101 engineering packages",()=>{
  assert.equal(actual.currentWorkstream,"SECURITY");
  assert.equal(actual.currentPhase,"UI");
  assert.equal(actual.tasks.length,101);
  assert.equal(actual.tasks.filter(t=>t.done===true).length,101);
  const report=inspectTracker(actual);
  assert.equal(report.activeWorkstream,"SECURITY");
  assert.deepEqual(report.errors,[]);
});
test("security closure queue prioritizes substantiated gaps and never promotes partial evidence",()=>{
  const doc=partialFixture();
  doc.currentWorkstream="SECURITY";
  const firstControl=doc.security.controls[first];
  firstControl.state="GAP_CONFIRMED";
  firstControl.assessedAt="2026-11-05";
  firstControl.nextProof="Run adversarial and deployed checks on this confirmed gap";
  firstControl.evidence=[{
    type:"EXECUTED_SCOPED_TEST",
    commitSha:"8b236bedb51d9afa4ec4f9317171bf4f23afc545",
    runUrl:"https://github.com/42Students/lms-vnext/actions/runs/41795753719",
    scope:"Synthetic failed negative-case fixture",
  }];
  const queue=inspectSecurityClosureQueue(doc,{limit:493});
  assert.equal(queue.total,493);
  assert.equal(queue.verified,0);
  assert.equal(queue.open,queue.remaining);
  assert.equal(queue.priority[0].state,"GAP_CONFIRMED");
  const ranks=new Map(SECURITY_CLOSURE_ORDER.map((s,i)=>[s,i]));
  for(let i=1;i<queue.priority.length;i++)
    assert.ok(ranks.get(queue.priority[i-1].state)<=ranks.get(queue.priority[i].state));
  assert.ok(queue.priority.every(p=>p.nextProof.length>0));
  assert.equal(queue.releaseReady,false);
  assert.deepEqual(queue.errors,[]);
});
test("invalid active workstream and invalid closure limits fail closed",()=>{
  const doc=copy();doc.currentWorkstream="RELEASE_COMPLETE";
  assert.ok(inspectTracker(doc).errors.some(e=>e.code==="INVALID_CURRENT_WORKSTREAM"));
  assert.throws(()=>inspectSecurityClosureQueue(actual,{limit:0}),/SECURITY_CLOSURE_LIMIT_INVALID/);
});
test("canonical closure-next CLI now shows security and reports the full unverified scope",()=>{
  for(const args of [["--closure-next"],["--security-next"],[]]){
    const run=spawnSync(process.execPath,["scripts/tracker.mjs",...args],{
      cwd:root,encoding:"utf8",maxBuffer:1024*1024,
    });
    assert.equal(run.status,0,run.stderr);
    assert.match(run.stdout,/SECURITY CLOSURE FIRST/);
    assert.match(run.stdout,/493/);
    assert.match(run.stdout,/NEXT PROOF/);
  }
});


test("canonical security workflow runs for every pull request and main push",()=>{
  const source=fs.readFileSync(path.join(root,".github/workflows/security-control-progress.yml"),"utf8");
  const triggers=source.split(/^permissions:/m)[0];
  assert.match(triggers,/^on:\s*$/m);
  assert.match(triggers,/^  pull_request:\s*\n    branches: \[main\]/m);
  assert.match(triggers,/^  push:\s*\n    branches: \[main\]/m);
  // Path filtering makes a nominally required check never report on some PRs.
  assert.doesNotMatch(triggers,/^    paths(?:-ignore)?:/m);
});
