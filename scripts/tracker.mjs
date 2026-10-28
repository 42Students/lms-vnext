#!/usr/bin/env node
/**
 * Sole current LMS vNext task tracker. Read-only: does not run database checks,
 * certify a phase or mutate task decisions. Historical six-chat coordination
 * files are not inputs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PHASES = Object.freeze(['DATABASE', 'API', 'UI', 'RELEASE']);
export const CORE_ELEVEN = Object.freeze([
  'DB-002', 'DB-003', 'DB-004', 'DB-005', 'DB-007', 'DB-008',
  'DB-012', 'DB-017', 'DB-019', 'DB-020', 'DB-030',
]);
export const DATABASE_DOMAIN_PACKAGES = Object.freeze([
  {
    "label": "FOUNDATION / GLOBAL",
    "taskIds": [
      "DB-001",
      "DB-002",
      "DB-003",
      "DB-004",
      "DB-014",
      "DB-015",
      "DB-017",
      "DB-018",
      "DB-019",
      "DB-020",
      "DB-025",
      "DB-027",
      "DB-028",
      "DB-048",
      "DB-051",
      "DB-055",
      "DB-058",
      "DB-065",
      "DB-076"
    ]
  },
  {
    "label": "DB02 Academic",
    "taskIds": [
      "DB-005"
    ]
  },
  {
    "label": "DB03 Groups",
    "taskIds": [
      "DB-006",
      "DB-026"
    ]
  },
  {
    "label": "DB04 Profiles",
    "taskIds": [
      "DB-007",
      "DB-016",
      "DB-077",
      "DB-080",
      "DB-081"
    ]
  },
  {
    "label": "DB05 Courses",
    "taskIds": [
      "DB-008",
      "DB-078"
    ]
  },
  {
    "label": "DB06 Assessment",
    "taskIds": [
      "DB-009",
      "DB-030",
      "DB-035",
      "DB-038",
      "DB-041",
      "DB-042",
      "DB-044",
      "DB-045",
      "DB-052",
      "DB-053"
    ]
  },
  {
    "label": "DB07 Projects",
    "taskIds": [
      "DB-010",
      "DB-068",
      "DB-070",
      "DB-071",
      "DB-073",
      "DB-074",
      "DB-075"
    ]
  },
  {
    "label": "DB08 Placement",
    "taskIds": [
      "DB-011",
      "DB-021",
      "DB-029",
      "DB-054",
      "DB-066",
      "DB-069",
      "DB-072"
    ]
  },
  {
    "label": "DB09 CRM",
    "taskIds": [
      "DB-012",
      "DB-032",
      "DB-034",
      "DB-036",
      "DB-047",
      "DB-056",
      "DB-057",
      "DB-059",
      "DB-060",
      "DB-061",
      "DB-062",
      "DB-063",
      "DB-064",
      "DB-079"
    ]
  },
  {
    "label": "DB10 Operations",
    "taskIds": [
      "DB-013",
      "DB-022",
      "DB-023",
      "DB-024",
      "DB-031",
      "DB-033",
      "DB-037",
      "DB-039",
      "DB-040",
      "DB-043",
      "DB-046",
      "DB-049",
      "DB-050",
      "DB-067"
    ]
  }
]);

/** Read-only execution grouping, never an alternative task state or phase gate. */
export function inspectDomainPackages(doc) {
  const tasks = new Map((doc?.tasks ?? []).filter(t => t.phase === 'DATABASE').map(t => [t.id,t]));
  const seen = new Set();
  const duplicates = [];
  const unknown = [];
  const packages = DATABASE_DOMAIN_PACKAGES.map(p => {
    const actual = p.taskIds.map(id => {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
      if (!tasks.has(id)) unknown.push(id);
      return tasks.get(id);
    });
    const done = actual.filter(t => t?.done === true).length;
    return {label:p.label,done,total:p.taskIds.length,notDone:p.taskIds.length - done,
      remainingIds:p.taskIds.filter(id => tasks.get(id)?.done !== true)};
  });
  const unassigned = [...tasks.keys()].filter(id => !seen.has(id));
  return {packages,unassigned,duplicates,unknown,readyForNextPhase:false};
}

const SHA = /^[a-f0-9]{40}$/i;
const validString = x => typeof x === 'string' && x.trim().length > 0;
const validDate = x => validString(x) && Number.isFinite(Date.parse(x));
const add = (errors, code, data = {}) => errors.push({code, ...data});

export function inspectTracker(doc) {
  const errors = [];
  if (!doc || doc.schemaVersion !== 1) add(errors, 'INVALID_TRACKER_VERSION');
  if (doc?.project !== '42Students/lms-vnext' || doc?.branch !== 'main')
    add(errors, 'INVALID_REPOSITORY_IDENTITY');
  if (!PHASES.includes(doc?.currentPhase)) add(errors, 'INVALID_CURRENT_PHASE');
  if (JSON.stringify(doc?.phaseOrder) !== JSON.stringify(PHASES))
    add(errors, 'INVALID_PHASE_ORDER');
  if (!Array.isArray(doc?.tasks)) {
    add(errors, 'INVALID_TASKS');
    return {mode:'TRACKER_STRUCTURE_ONLY_NOT_DATABASE_ACCEPTANCE',errors,readyForNextPhase:false};
  }
  const tasks = new Map();
  for (const t of doc.tasks) {
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
    counts:{total:all.length,done,notDone:all.length-done},
    core:{total:CORE_ELEVEN.length,done:coreDone,notDone:CORE_ELEVEN.length-coreDone},
    coreRemaining,
    currentPhaseOpen:currentOpen.map(t=>t.id),
    deferredRelease,
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
    if (process.argv.includes('--json') || process.argv.includes('--check')) {
      console.log(JSON.stringify(report,null,2));
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
    } else {
      console.log('LMS vNext | ' + report.activePhase);
      console.log('DONE ' + report.counts.done + '/' + report.counts.total +
        ' | NOT DONE ' + report.counts.notDone);
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
