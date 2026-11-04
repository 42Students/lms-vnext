#!/usr/bin/env node
/**
 * Sole current LMS vNext task tracker. Read-only: does not run database checks,
 * certify a phase or mutate task decisions. Historical six-chat coordination
 * files are not inputs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectDatabaseProgress, formatDatabaseProgress } from './progress-evidence.mjs';
import { inspectSecurityProgress, formatSecurityMarkdown,
  inspectSecurityClosureQueue, formatSecurityClosureQueue } from './security/control-progress.mjs';
export {inspectDatabaseProgress,formatDatabaseProgress} from './progress-evidence.mjs';

export const PHASES = Object.freeze(['DATABASE', 'API', 'UI', 'RELEASE']);
export const CORE_ELEVEN = Object.freeze([
  'DB-002', 'DB-003', 'DB-004', 'DB-005', 'DB-007', 'DB-008',
  'DB-012', 'DB-017', 'DB-019', 'DB-020', 'DB-030',
]);
/** Thematic groups are informational: no exclusive workers or claims. */
const canonicalPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../docs/tracker.json');
const canonicalDocument = JSON.parse(fs.readFileSync(canonicalPath,'utf8'));
export const DATABASE_DOMAIN_PACKAGES = Object.freeze(
  canonicalDocument.execution.domains.map(domain => ({
    label:domain.name,taskIds:Object.freeze([...domain.dbTaskIds]),
  }))
);
export function inspectDomainPackages(doc) {
  const tasks=new Map((doc?.tasks??[]).filter(t=>t.phase==='DATABASE').map(t=>[t.id,t]));
  const domains=doc?.execution?.domains??[];
  const seen=new Set(),duplicates=[],unknown=[];
  const packages=domains.map(domain=>{
    const ids=Array.isArray(domain.dbTaskIds)?domain.dbTaskIds:[];
    for(const id of ids){if(seen.has(id))duplicates.push(id);seen.add(id);if(!tasks.has(id))unknown.push(id)}
    const done=ids.filter(id=>tasks.get(id)?.done===true).length;
    return {label:domain.name,done,total:ids.length,notDone:ids.length-done,
      remainingIds:ids.filter(id=>tasks.get(id)?.done!==true)};
  });
  return {packages,unassigned:[...tasks.keys()].filter(id=>!seen.has(id)),
    duplicates,unknown,readyForNextPhase:false};
}

/**
 * Closure-first work selection is derived from the SAME canonical tracker;
 * focusTasks are suggestions, never additional completion records.
 * Accepted IDs are suppressed even if another lane has not refreshed hints.
 */
export function inspectClosureFirst(doc) {
  const protocol=doc?.execution?.closureFirstProtocol??{};
  const tasks=new Map((doc?.tasks??[]).map(t=>[t.id,t]));
  const priority=(protocol.focusTasks??[]).map(q=>{
    const task=tasks.get(q.id);
    return {id:q.id,title:task?.title??'Unknown task',accepted:task?.done===true,
      blockedBy:(task?.dependsOn??[]).filter(id=>tasks.get(id)?.done!==true),
      nextGate:q.nextGate};
  }).filter(q=>!q.accepted);
  const open=(doc?.tasks??[]).filter(t=>t.done!==true);
  return {mode:'CLOSURE_FIRST_NOT_ACCEPTANCE',
    accepted:(doc?.tasks??[]).filter(t=>t.done===true).length,
    total:(doc?.tasks??[]).length,remaining:open.length,priority,
    otherOpen:open.filter(t=>!priority.some(q=>q.id===t.id)).map(t=>t.id),
    maximumUnacceptedPassesPerTask:protocol.operatingRules?.maximumUnacceptedPassesPerTask??null};
}

export function inspectExecution(doc) {
  const e = doc?.execution ?? {};
  const milestones = Array.isArray(e.milestones) ? e.milestones : [];
  const result = {};
  for (const stage of ['API','UI','DESIGN','RELEASE']) {
    const all = milestones.filter(m=>m.stage===stage);
    result[stage] = {total:all.length,done:all.filter(m=>m.done===true).length,
      open:all.filter(m=>m.done!==true).map(m=>m.id)};
  }
  const globalPhases=(e.globalPhases??[]).map(p=>({
    id:p.id,title:p.title,sequence:p.sequence,
    gateCertified:e.globalPhaseCertificates?.[p.id]?.certified===true,
    accepted:p.id==='DATABASE'?
      (doc.tasks??[]).filter(t=>t.phase==='DATABASE'&&t.done===true).length:
      (result[p.id]?.done??0),
    total:p.id==='DATABASE'?
      (doc.tasks??[]).filter(t=>t.phase==='DATABASE').length:
      (result[p.id]?.total??0),
    prerequisites:p.prerequisitePhaseIds,
  }));
  return {globalPhases,domains:inspectDomainPackages(doc).packages,phases:result,certificates:e.globalPhaseCertificates,
    readyForNextPhase:false};
}

const SHA = /^[a-f0-9]{40}$/i;
const validString = x => typeof x === 'string' && x.trim().length > 0;
const validDate = x => validString(x) && Number.isFinite(Date.parse(x));
const add = (errors, code, data = {}) => errors.push({code, ...data});

/**
 * Advisory per-chat DB-019 allocation board, NOT a second task tracker and
 * NOT a domain ownership/permission mechanism. The 81 parent tasks remain
 * the sole measure of database acceptance.
 */
export function inspectDb019WorkPackages(doc) {
  const errors=[];
  const fail=(code,id=null)=>errors.push({code,...(id?{id}:{})});
  const plan=doc?.tasks?.find(t=>t?.id==="DB-019")?.workPlan;
  if(plan?.schemaVersion!==1||!Array.isArray(plan.packages)){
    fail("DB19_WORK_PACKAGES_MISSING");
    return {errors,packages:[],picked:0,unpickedOpen:0,done:0,open:0,
      totalFields:0,totalTables:0,domainCoverage:{}};
  }
  const expectedDomainFields={DB00:732,DB01:312,DB02:125,DB03:79,
    DB04:103,DB05:92,DB06:248,DB07:358,DB08:280,DB09:279,DB10:221};
  const expectedDomainTables={DB00:39,DB01:22,DB02:13,DB03:6,
    DB04:7,DB05:7,DB06:21,DB07:16,DB08:18,DB09:31,DB10:19};
  const ids=new Set(),sources=new Set(),domainCoverage={};
  for(const name of Object.keys(expectedDomainFields))
    domainCoverage[name]={fields:0,tables:0};
  let totalFields=0,totalTables=0,picked=0,unpickedOpen=0,done=0;
  const packages=plan.packages;
  for(const row of packages){
    const id=row?.id;
    if(!/^DB19-P\d{2}$/.test(id??"")||ids.has(id))fail("DB19_INVALID_PACKAGE_ID",id);
    ids.add(id);
    if(!validString(row?.title)||!validString(row?.acceptance))
      fail("DB19_PACKAGE_MISSING_SCOPE",id);
    if(typeof row?.picked!=="boolean"||typeof row?.done!=="boolean")
      fail("DB19_INVALID_STATUS",id);
    if(row.picked===true&&!validString(row.pickedBy))
      fail("DB19_PICKED_WITHOUT_ASSIGNEE",id);
    if(row.picked===false&&validString(row.pickedBy))
      fail("DB19_UNPICKED_WITH_ASSIGNEE",id);
    if(row.picked===true)picked++;
    if(row.picked===false&&row.done===false)unpickedOpen++;
    if(row.done===true){
      done++;
      if(!validDate(row.acceptedAt)||!Array.isArray(row.acceptanceEvidence)||
        !row.acceptanceEvidence.some(e=>SHA.test(e?.commitSha??"")&&
          ['PASS','PASSED'].includes(e?.result)&&
          typeof e?.kind==='string'&&e.kind.startsWith('EXECUTED')&&
          /^https:\/\/github[.]com\/42Students\/lms-vnext\/actions\/runs\/\d+/.test(e?.runUrl??"")))
        fail("DB19_DONE_WITHOUT_EXECUTED_PROOF",id);
    } else if(row.acceptedAt!=null||(row.acceptanceEvidence?.length??0)>0){
      fail("DB19_OPEN_WITH_ACCEPTANCE_PROOF",id);
    }
    if(row.kind==="DOMAIN"){
      if(!Object.hasOwn(expectedDomainFields,row.domain)||
        !validString(row.sourceInventory)||!Array.isArray(row.sourceTables)||
        !row.sourceTables.length||!Number.isInteger(row.sourceFieldCount)||
        row.sourceFieldCount<=0){
        fail("DB19_INVALID_DOMAIN_SCOPE",id);continue;
      }
      for(const table of row.sourceTables){
        if(!validString(table)||sources.has(table))
          fail("DB19_DUPLICATE_OR_INVALID_SOURCE_TABLE",id);
        sources.add(table);
      }
      domainCoverage[row.domain].fields+=row.sourceFieldCount;
      domainCoverage[row.domain].tables+=row.sourceTables.length;
      totalFields+=row.sourceFieldCount;
      totalTables+=row.sourceTables.length;
    }else if(!["FOUNDATION","GATE"].includes(row.kind) ||
       !Array.isArray(row.sourceTables)||row.sourceTables.length!==0||
       row.sourceFieldCount!==0){
      fail("DB19_INVALID_NON_DOMAIN_SCOPE",id);
    }
  }
  for(const [domain,expected] of Object.entries(expectedDomainFields)){
    if(domainCoverage[domain].fields!==expected||
      domainCoverage[domain].tables!==expectedDomainTables[domain])
      fail("DB19_DOMAIN_COVERAGE_DRIFT",domain);
  }
  if(packages.length!==33||totalFields!==2829||totalTables!==199)
    fail("DB19_GLOBAL_COVERAGE_DRIFT");
  const domainIds=Array.from({length:30},(_,i)=>'DB19-P'+String(i+1).padStart(2,'0'));
  const reconciliation=packages.find(x=>x.id==='DB19-P31');
  const certification=packages.find(x=>x.id==='DB19-P32');
  if(!ids.has('DB19-P00')||!domainIds.every(id=>ids.has(id))||
    !reconciliation||!certification||
    reconciliation.kind!=='GATE'||certification.kind!=='GATE'||
    JSON.stringify(reconciliation.dependsOn)!==JSON.stringify(domainIds)||
    JSON.stringify(certification.dependsOn)!==JSON.stringify(['DB19-P31']))
    fail("DB19_FINAL_GATES_INCOMPLETE");
  for(const gate of [reconciliation,certification].filter(Boolean))
    if(gate.done===true&&gate.dependsOn.some(id=>
      packages.find(p=>p.id===id)?.done!==true))
      fail("DB19_GATE_CLOSED_WITH_OPEN_DEPENDENCIES",gate.id);
  if(doc.tasks.find(x=>x.id==='DB-019')?.done===true&&done!==packages.length)
    fail("DB19_PARENT_CLOSED_WITH_OPEN_PACKAGES");
  return {mode:"DB19_ADVISORY_PICKUP_NOT_GLOBAL_ACCEPTANCE",errors,
    packages,picked,unpickedOpen,done,open:packages.length-done,
    totalFields,totalTables,domainCoverage};
}

export function inspectTracker(doc) {
  const errors = [];
  if (!doc || doc.schemaVersion !== 1) add(errors, 'INVALID_TRACKER_VERSION');
  if (doc?.project !== '42Students/lms-vnext' || doc?.branch !== 'main')
    add(errors, 'INVALID_REPOSITORY_IDENTITY');
  if (!PHASES.includes(doc?.currentPhase)) add(errors, 'INVALID_CURRENT_PHASE');
  // Keep the accepted historical phase order; security is the ACTIVE execution
  // workstream, not a rewrite of completed DB/API/UI phase acceptance.
  if(doc?.currentWorkstream!==undefined&&
     !['ENGINEERING','SECURITY'].includes(doc.currentWorkstream))
    add(errors,'INVALID_CURRENT_WORKSTREAM');
  if (JSON.stringify(doc?.phaseOrder) !== JSON.stringify(PHASES))
    add(errors, 'INVALID_PHASE_ORDER');
  if (!Array.isArray(doc?.tasks)) {
    add(errors, 'INVALID_TASKS');
    return {mode:'TRACKER_STRUCTURE_ONLY_NOT_DATABASE_ACCEPTANCE',errors,readyForNextPhase:false};
  }
  const tasks = new Map();
  // API-NN / UI-NN entries are phase work packages. Their executed-proof gate is the
  // matching execution.milestones entry, so they stay out of the DB task map.
  const phaseTaskIds = new Set();
  for (const t of doc.tasks) {
    if (validString(t?.id) && /^(API|UI)-[0-9]{2}$/.test(t.id) && t.phase === t.id.split('-')[0] &&
        !phaseTaskIds.has(t.id) && !tasks.has(t.id)) {
      phaseTaskIds.add(t.id);
      if (!validString(t.title)) add(errors, 'MISSING_TASK_TITLE', {id:t.id});
      if (typeof t.done !== 'boolean') add(errors, 'NON_BOOLEAN_STATUS', {id:t.id});
      if (!Array.isArray(t.dependsOn) || new Set(t.dependsOn).size !== t.dependsOn.length)
        add(errors, 'INVALID_DEPENDENCIES', {id:t.id});
      if (t.done === true && (!validDate(t.acceptedAt) ||
          !Array.isArray(t.acceptanceEvidence) || t.acceptanceEvidence.length === 0))
        add(errors, 'DONE_WITHOUT_EVIDENCE', {id:t.id});
      if (!(doc.execution?.milestones ?? []).some(m => m?.id === t.id))
        add(errors, 'PHASE_TASK_WITHOUT_MILESTONE', {id:t.id});
      continue;
    }
    if (!validString(t?.id) || !/^DB-[0-9]{3}$/.test(t.id) || tasks.has(t.id)) {
      add(errors, 'DUPLICATE_OR_INVALID_TASK_ID', {id:t?.id ?? null});
      continue;
    }
    tasks.set(t.id,t);
    if (!validString(t.title)) add(errors, 'MISSING_TASK_TITLE', {id:t.id});
    if (!PHASES.includes(t.phase)) add(errors, 'INVALID_TASK_PHASE', {id:t.id});
    if (typeof t.done !== 'boolean') add(errors, 'NON_BOOLEAN_STATUS', {id:t.id});
    if (!Array.isArray(t.dependsOn) || new Set(t.dependsOn).size !== t.dependsOn.length)
      add(errors, 'INVALID_DEPENDENCIES', {id:t.id});
    if (t.done === true) {
      if (!validDate(t.acceptedAt)) add(errors, 'DONE_WITHOUT_DATE', {id:t.id});
      if (!Array.isArray(t.acceptanceEvidence) || t.acceptanceEvidence.length === 0) {
        add(errors, 'DONE_WITHOUT_EVIDENCE', {id:t.id});
      } else if (!t.acceptanceEvidence.some(e =>
        typeof e?.kind === 'string' && e.kind.startsWith('EXECUTED') &&
        SHA.test(e.commitSha ?? '') && e.exitCode === 0 &&
        ['PASS','PASSED'].includes(e.result) &&
        validString(e.runner) &&
        (validString(e.runUrl) ||
         (Array.isArray(e.commands) && e.commands.length > 0 && e.commands.every(validString)))
      )) add(errors, 'DONE_WITHOUT_EXECUTED_PROOF', {id:t.id});
      // Engineering closure with a separate final-review obligation is
      // allowed only with real executed acceptance, never by writing 'deferred'.
      if (t.deferredRelease !== undefined) {
        const d=t.deferredRelease;
        if (t.closureBasis !== 'ENGINEERING_ACCEPTED_RELEASE_REVIEW_DEFERRED' ||
            d?.reviewRequired !== true || d?.notWaived !== true ||
            d?.releaseCertified !== false || d?.noAutomaticReopen !== true ||
            !validString(d?.reviewOwner) || !validString(d?.when) ||
            !validString(d?.register) || !Array.isArray(d?.items) ||
            d.items.length===0 || d.items.some(x=>!validString(x))) {
          add(errors,'INVALID_DEFERRED_RELEASE_CLOSURE',{id:t.id});
        }
      } else if(t.closureBasis==='ENGINEERING_ACCEPTED_RELEASE_REVIEW_DEFERRED') {
        add(errors,'MISSING_DEFERRED_RELEASE_RECEIPT',{id:t.id});
      }
    } else if (t.acceptedAt != null || (t.acceptanceEvidence?.length ?? 0) > 0) {
      add(errors, 'NOT_DONE_HAS_ACCEPTANCE_PROOF', {id:t.id});
    }
  }
  for (const t of tasks.values()) {
    if (!Array.isArray(t.dependsOn)) continue;
    for (const dependency of t.dependsOn) {
      if (!tasks.has(dependency)) add(errors, 'UNKNOWN_DEPENDENCY',{id:t.id,dependency});
      if (dependency === t.id) add(errors, 'SELF_DEPENDENCY',{id:t.id});
    }
  }
  // Stage labels are evidence-informed estimates, never proof of task acceptance.
  errors.push(...inspectDatabaseProgress(doc).errors);
  // Every security control is tracked in the same canonical tracker file.
  const securityProgress=inspectSecurityProgress(doc);
  const securityClosure=inspectSecurityClosureQueue(doc);
  errors.push(...securityProgress.errors);
  errors.push(...inspectDb019WorkPackages(doc).errors);
  // Thematic domain groups remain exhaustive, but do not assign ownership.
  const coverage=inspectDomainPackages(doc);
  for(const id of coverage.unassigned)add(errors,'UNASSIGNED_DATABASE_PACKAGE',{id});
  for(const id of coverage.duplicates)add(errors,'DUPLICATE_DATABASE_PACKAGE',{id});
  for(const id of coverage.unknown)add(errors,'UNKNOWN_DATABASE_PACKAGE',{id});
  const execution=doc.execution;
  if(execution?.schemaVersion!==1||execution.authority?.includes('docs/tracker.json')!==true)
    add(errors,'INVALID_SINGLE_EXECUTION_AUTHORITY');
  const domains=execution?.domains;
  if(!Array.isArray(domains)||domains.length===0||
     domains.some(d=>!validString(d?.name)||!Array.isArray(d.dbTaskIds)||d.dbTaskIds.length===0)||
     new Set((domains??[]).map(d=>d.name)).size!==(domains??[]).length)
    add(errors,'INVALID_DOMAIN_GROUPS');
  if(execution && (Object.hasOwn(execution,'lanes')||Object.hasOwn(execution,'sharedChangeRequests')))
    add(errors,'RETIRED_LANE_COORDINATION_PRESENT');
  const closure=execution?.closureFirstProtocol;
  const rules=closure?.operatingRules;
  if(closure?.schemaVersion!==1||!validString(closure?.objective)||
     !Array.isArray(closure?.requiredSequence)||closure.requiredSequence.length<5||
     closure.requiredSequence.some(x=>!validString(x))||
     !Array.isArray(closure?.selectionPriority)||closure.selectionPriority.length<3||
     closure.selectionPriority.some(x=>!validString(x))||
     rules?.maximumUnacceptedPassesPerTask!==2||
     rules?.acceptedTasksFrozen!==true||
     rules?.noAutomaticTaskPromotion!==true||
     rules?.concurrentWritesRequireFreshHead!==true||
     rules?.sharedMigrationsRequireSerializedWrites!==true)
    add(errors,'INVALID_CLOSURE_FIRST_PROTOCOL');
  // Scope-aware task acceptance: isolated SOURCE/STAGING deliveries are not
  // deployed DB claims. Preserve an explicit downstream OPEN runtime owner
  // instead of making unregistered SQL disappear behind a done:true flag.
  if (!validString(closure?.scopeSemantics?.registeredRuntimeTask) ||
      !validString(closure?.scopeSemantics?.isolatedStageOrDispositionTask) ||
      !Array.isArray(closure?.scopeSemantics?.stagedEvidenceSafeguards) ||
      closure.scopeSemantics.stagedEvidenceSafeguards.length<3)
    add(errors,'INVALID_CLOSURE_SCOPE_SEMANTICS');
  for (const task of tasks.values()) {
    if (task.done!==true ||
        !/^EXECUTED_SCOPED_SOURCE.*ENGINEERING_ACCEPTANCE$/.test(task.closureBasis ?? ''))
      continue;
    if (!validString(task.acceptanceScope) ||
        !validString(task.notInThisTaskAcceptance) ||
        !Array.isArray(task.remainingDistinctIntegrationTasks) ||
        task.remainingDistinctIntegrationTasks.length===0 ||
        task.remainingDistinctIntegrationTasks.some(id =>
          !tasks.has(id) || id===task.id))
      add(errors,'STAGED_SCOPE_MISSING_DISTINCT_RUNTIME_OWNER',{id:task.id});
  }
  if(!Array.isArray(closure?.focusTasks)||closure.focusTasks.length===0||
     closure.focusTasks.length>12)add(errors,'INVALID_CLOSURE_FIRST_QUEUE');
  const focusIds=new Set();
  for(const focus of closure?.focusTasks??[]){
    if(!/^DB-[0-9]{3}$/.test(focus.id??'')||focusIds.has(focus.id)||
       !tasks.has(focus.id)||!validString(focus.nextGate)||
       Object.hasOwn(focus,'laneId'))add(errors,'INVALID_CLOSURE_FIRST_FOCUS',{id:focus.id});
    focusIds.add(focus.id);
  }
  // A complete roadmap is mandatory in the same one tracker; no second phase plan.
  const fullPhaseOrder=['DATABASE','API','UI','DESIGN','RELEASE'];
  const globalPhases=execution?.globalPhases;
  if (!Array.isArray(globalPhases) ||
      JSON.stringify(globalPhases.map(p=>p.id))!==JSON.stringify(fullPhaseOrder))
    add(errors,'INVALID_FIVE_GLOBAL_PHASES');
  else for (let i=0;i<globalPhases.length;i++) {
    const p=globalPhases[i];
    const expectedPrereq=i===0?[]:[fullPhaseOrder[i-1]];
    if (p.sequence!==i+1||!validString(p.title)||!validString(p.goal)||
      !validString(p.completionEvidencePath)||
      p.completionEvidencePath!=='execution.globalPhaseCertificates.'+p.id||
      !Array.isArray(p.prerequisitePhaseIds)||
      JSON.stringify(p.prerequisitePhaseIds)!==JSON.stringify(expectedPrereq)||
      !Array.isArray(p.entryCriteria)||p.entryCriteria.length===0||
      !Array.isArray(p.workstreams)||p.workstreams.length===0||
      !Array.isArray(p.exitCriteria)||p.exitCriteria.length===0||
      !Array.isArray(p.verification)||p.verification.length===0||
      Object.hasOwn(p,'ownerLanes'))
      add(errors,'INVALID_GLOBAL_PHASE_CONTRACT',{stage:p.id});
  }
  if (execution?.globalPhaseRules?.canonicalStageOrder?.includes('DESIGN')!==true ||
      !validString(execution?.globalPhaseRules?.phasePromotion))
    add(errors,'MISSING_GLOBAL_PHASE_PROMOTION_POLICY');
  const milestones=execution?.milestones;
  if (!Array.isArray(milestones) || milestones.length===0) add(errors,'MISSING_FUTURE_PHASE_MILESTONES');
  const msIds = new Set();
  for (const m of milestones ?? []) {
    if (!validString(m.id)||msIds.has(m.id)||!['API','UI','DESIGN','RELEASE'].includes(m.stage)||
        Object.hasOwn(m,'laneId')||!validString(m.title)||
        !Array.isArray(m.requirements)||m.requirements.length===0||typeof m.done!=='boolean')
      add(errors,'INVALID_PHASE_MILESTONE',{id:m.id});
    msIds.add(m.id);
    if (m.done === true && (!validDate(m.acceptedAt)||!Array.isArray(m.acceptanceEvidence)||
        !m.acceptanceEvidence.some(e=>e.kind?.startsWith('EXECUTED')&&SHA.test(e.commitSha??'')&&
          e.exitCode===0&&['PASS','PASSED'].includes(e.result)&&validString(e.runner)&&
          (validString(e.runUrl)||Array.isArray(e.commands)&&e.commands.length>0))))
      add(errors,'MILESTONE_DONE_WITHOUT_EXECUTED_PROOF',{id:m.id});
    if (m.done===false&&(m.acceptedAt!=null||(m.acceptanceEvidence?.length??0)>0))
      add(errors,'OPEN_MILESTONE_HAS_ACCEPTANCE_PROOF',{id:m.id});
  }
  for (const stage of ['DATABASE','API','UI','DESIGN','RELEASE']) {
    const index=['DATABASE','API','UI','DESIGN','RELEASE'].indexOf(stage);
    const cert=execution?.globalPhaseCertificates?.[stage];
    if (cert?.certified===true) {
      for (const prior of ['DATABASE','API','UI','DESIGN','RELEASE'].slice(0,index))
        if(execution?.globalPhaseCertificates?.[prior]?.certified!==true)
          add(errors,'PHASE_CERTIFIED_BEFORE_PREREQUISITE',{stage,prior});
      const notDone=stage==='DATABASE'?(doc.tasks??[]).filter(t=>t.phase==='DATABASE'&&t.done!==true):
        (milestones??[]).filter(m=>m.stage===stage&&m.done!==true);
      if (notDone.length>0) add(errors,'PHASE_CERTIFIED_WITH_OPEN_WORK',{stage,open:notDone.length});
    }
    if (!cert||typeof cert.certified!=='boolean'||!Array.isArray(cert.evidence))
      add(errors,'INVALID_GLOBAL_PHASE_CERTIFICATE',{stage});
    else if (cert.certified && !cert.evidence.some(e=>e?.kind?.startsWith('EXECUTED')&&
      SHA.test(e.commitSha??'')&&e.exitCode===0&&['PASS','PASSED'].includes(e.result)))
      add(errors,'CERTIFIED_PHASE_WITHOUT_EXECUTED_PROOF',{stage});
  }
  if(!Array.isArray(execution?.integrationNotes))
    add(errors,'MISSING_INTEGRATION_NOTES');
  else for(const note of execution.integrationNotes){
    if(!validString(note.id)||!Array.isArray(note.paths)||note.paths.length===0||
       note.paths.some(p=>!validString(p))||
       !['REQUESTED','ACCEPTED','APPLIED','REJECTED'].includes(note.status)||
       Object.hasOwn(note,'fromLane')||Object.hasOwn(note,'toLane'))
      add(errors,'INVALID_INTEGRATION_NOTE',{id:note.id});
  }
  const visiting = new Set(), visited = new Set();
  function walk(id) {
    if (visiting.has(id)) return add(errors, 'DEPENDENCY_CYCLE',{id});
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of tasks.get(id)?.dependsOn ?? []) if (tasks.has(dep)) walk(dep);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of tasks.keys()) walk(id);
  if (!Array.isArray(doc.coreEleven) ||
      JSON.stringify(doc.coreEleven) !== JSON.stringify(CORE_ELEVEN))
    add(errors, 'CORE_ELEVEN_DRIFT');
  for (const phase of PHASES) {
    if (!Array.isArray(doc.phaseGates?.[phase]) ||
        doc.phaseGates[phase].length === 0 ||
        doc.phaseGates[phase].some(x => !validString(x)))
      add(errors, 'INVALID_PHASE_GATES',{phase});
  }
  const all = [...tasks.values()];
  const done = all.filter(t=>t.done === true).length;
  const coreDone = CORE_ELEVEN.filter(id=>tasks.get(id)?.done === true).length;
  const coreRemaining = CORE_ELEVEN
    .filter(id => tasks.get(id)?.done !== true)
    .map(id => ({id,title:tasks.get(id)?.title ?? 'Missing task'}));
  const currentOpen = all.filter(t=>t.phase === doc.currentPhase && t.done !== true);
  const deferredRelease = all.filter(t=>t.done===true && t.deferredRelease?.reviewRequired===true)
    .map(t=>({id:t.id,when:t.deferredRelease.when,items:t.deferredRelease.items.length,
      releaseCertified:t.deferredRelease.releaseCertified}));
  return {
    mode:'TRACKER_STRUCTURE_ONLY_NOT_DATABASE_ACCEPTANCE',
    activePhase:doc.currentPhase,
    activeWorkstream:doc.currentWorkstream??'ENGINEERING',
    counts:{total:all.length,done,notDone:all.length-done},
    core:{total:CORE_ELEVEN.length,done:coreDone,notDone:CORE_ELEVEN.length-coreDone},
    coreRemaining,
    currentPhaseOpen:currentOpen.map(t=>t.id),
    deferredRelease,
    security:securityProgress,
    securityClosure,
    readyForNextPhase:false, // Executed independent phase-gate signoff is separate.
    errors,
  };
}

export function inspectCheckout(root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')) {
  const file = path.join(root,'docs/tracker.json');
  return inspectTracker(JSON.parse(fs.readFileSync(file,'utf8')));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = process.argv[2] && !process.argv[2].startsWith('--')
      ? path.resolve(process.argv[2]) : undefined;
    const report = inspectCheckout(root);
    if (process.argv.includes('--security')||process.argv.includes('--security-json')) {
      if(process.argv.includes('--security-json'))console.log(JSON.stringify(report.security,null,2));
      else console.log(formatSecurityMarkdown(report.security));
      if(report.errors.length)process.exitCode=2;
    } else if (process.argv.includes('--security-next')) {
      const doc=JSON.parse(fs.readFileSync(path.join(root??path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),'docs/tracker.json'),'utf8'));
      console.log(formatSecurityClosureQueue(inspectSecurityClosureQueue(doc)));
      if(report.errors.length)process.exitCode=2;
    } else if (process.argv.includes('--closure-next')&&report.activeWorkstream==='SECURITY') {
      const doc=JSON.parse(fs.readFileSync(path.join(root??path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),'docs/tracker.json'),'utf8'));
      console.log(formatSecurityClosureQueue(inspectSecurityClosureQueue(doc)));
      if(report.errors.length)process.exitCode=2;
    } else if (process.argv.includes('--closure-next')) {
      const doc=JSON.parse(fs.readFileSync(path.join(root??path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),'docs/tracker.json'),'utf8'));
      const queue=inspectClosureFirst(doc);
      console.log('LMS vNext | CLOSURE FIRST | '+queue.accepted+'/'+queue.total+
        ' accepted | OPEN '+(queue.total-queue.accepted));
      console.log('Focus is advisory; task DONE requires exact-scope executed evidence.');
      for(const q of queue.priority){
        console.log(q.id+' | '+q.title+
          (q.blockedBy.length?' | BLOCKED BY '+q.blockedBy.join(', '):' | dependency ready'));
        console.log('  Exact next proof: '+q.nextGate);
      }
      console.log('Other OPEN tasks: '+(queue.otherOpen.join(', ')||'none'));
      console.log('Two no-closure passes max: record exact blocker, switch to independent OPEN work.');
      console.log('No exclusive assignments; shared migrations need serialized registration and PostgreSQL proof.');
      if(report.errors.length){console.error(JSON.stringify(report.errors));process.exitCode=2}
    } else if(process.argv.includes('--db19')){
      const doc=JSON.parse(fs.readFileSync(path.join(root??path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),'docs/tracker.json'),'utf8'));
      const board=inspectDb019WorkPackages(doc);
      console.log('DB-019 | work packages '+board.done+'/'+board.packages.length+
        ' done | '+board.picked+' picked | '+board.unpickedOpen+' unpicked/open');
      console.log('199 original source tables / 2829 fields partitioned (not runtime accepted).');
      for(const p of board.packages.filter(p=>!process.argv.includes('--unpicked')||
        (p.picked===false&&p.done===false))){
        console.log([p.id,p.domain??'GLOBAL',p.title,
          p.picked?'PICKED ('+p.pickedBy+')':'NOT PICKED',
          p.done?'DONE':'NOT DONE',
          p.sourceFieldCount+' fields'].join(' | '));
      }
      if(report.errors.length){console.error(JSON.stringify(report.errors));process.exitCode=2}
    } else if(process.argv.includes('--progress')){
      const doc=JSON.parse(fs.readFileSync(path.join(root??path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),'docs/tracker.json'),'utf8'));
      console.log(formatDatabaseProgress(doc,{detailed:true}));
      if(report.errors.length){console.error(JSON.stringify(report.errors));process.exitCode=2}
    } else if(process.argv.includes('--json')||process.argv.includes('--check')){
      console.log(JSON.stringify(report,null,2));
    } else if(process.argv.includes('--roadmap')){
      const doc=JSON.parse(fs.readFileSync(path.join(root??path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),'docs/tracker.json'),'utf8'));
      const stages=inspectExecution(doc);
      console.log('LMS vNext | SINGLE TRACKER / OPEN CONTRIBUTION');
      console.log('Current phase: '+doc.currentPhase+' | DB accepted '+report.counts.done+'/'+report.counts.total);
      console.log('Five global phases (one canonical execution plan):');
      for(const p of stages.globalPhases){
        console.log('  '+p.sequence+'. '+p.title+' | '+p.accepted+'/'+p.total+
          ' accepted | GLOBAL '+(p.gateCertified?'CERTIFIED':'NOT CERTIFIED')+
          (p.prerequisites.length?' | needs '+p.prerequisites.join(', '):''));
      }
      for(const stage of ['API','UI','DESIGN','RELEASE']){
        const p=stages.phases[stage];
        console.log(stage+': '+p.done+'/'+p.total+' accepted milestones (not global phase signoff)');
      }
      if(report.errors.length){console.error(JSON.stringify(report.errors));process.exitCode=2}
    } else if (process.argv.includes('--domains') || process.argv.includes('--packages')) {
      const groups = inspectDomainPackages(JSON.parse(fs.readFileSync(path.join(root ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),'docs/tracker.json'),'utf8')));
      console.log('LMS vNext | DATABASE DOMAIN PACKAGES (read-only; not phase acceptance)');
      for (const p of groups.packages) {
        console.log(p.label + ': DONE ' + p.done + '/' + p.total + ' | OPEN ' + p.notDone +
          (p.remainingIds.length ? ' | ' + p.remainingIds.join(', ') : ''));
      }
      if (groups.unassigned.length || groups.duplicates.length || groups.unknown.length) {
        console.error(JSON.stringify({unassigned:groups.unassigned,duplicates:groups.duplicates,unknown:groups.unknown}));
        process.exitCode=2;
      }
      if (report.errors.length) {console.error(JSON.stringify(report.errors));process.exitCode=2;}
      console.log('Global DATABASE phase: NOT CERTIFIED by package counts');
    } else if(report.activeWorkstream==='SECURITY') {
      const doc=JSON.parse(fs.readFileSync(path.join(root??path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),'docs/tracker.json'),'utf8'));
      console.log('CURRENT WORKSTREAM: SECURITY | Historical engineering phase: '+report.activePhase);
      console.log(formatSecurityMarkdown(report.security));
      console.log(formatSecurityClosureQueue(inspectSecurityClosureQueue(doc,{limit:5})));
      console.log('Engineering acceptance retained: '+report.counts.done+'/'+report.counts.total+
        ' tasks; this is NOT security certification.');
      if(report.errors.length){console.error(JSON.stringify(report.errors));process.exitCode=2}
    } else {
      console.log('LMS vNext | ' + report.activePhase);
      console.log('DONE ' + report.counts.done + '/' + report.counts.total +
        ' | NOT DONE ' + report.counts.notDone);
      const doc=JSON.parse(fs.readFileSync(path.join(root ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),'docs/tracker.json'),'utf8'));
      console.log(formatDatabaseProgress(doc));
      console.log('Original core: DONE ' + report.core.done +
        '/' + report.core.total + ' | NOT DONE ' + report.core.notDone);
      console.log('Original core remaining: ' +
        (report.coreRemaining.map(t => t.id).join(', ') || 'none'));
      console.log('Phase gate: NOT CERTIFIED by task counts');
      console.log('Tracker integrity: ' + (report.errors.length ? 'FAIL' : 'PASS'));
      if (report.errors.length) console.error(JSON.stringify(report.errors));
    }
    if (report.errors.length) process.exitCode=2;
  } catch (error) {
    console.error(error);
    process.exitCode=1;
  }
}
