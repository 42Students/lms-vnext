#!/usr/bin/env node
// DATABASE-phase evidence hardening companion. READ ONLY. Never certifies a phase.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PHASE_SEQUENCE = Object.freeze(['DATABASE', 'API', 'UI', 'RELEASE']);
const sha = x => typeof x === 'string' && /^[a-f0-9]{40}$/i.test(x);
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
const instant = x => nonempty(x) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(x) && Number.isFinite(Date.parse(x));

// This is independent review evidence; use it *alongside* DB-065, not in place
// of that six-worker path/claim and dependency validator.
export function inspectTransitionEvidence({phaseState, workQueue}) {
  const issues=[];
  const push=(code,details={})=>issues.push({code,...details});
  const phase=phaseState?.currentPhase;
  const pos=PHASE_SEQUENCE.indexOf(phase);
  if(pos===-1)push('INVALID_PHASE');
  if(!Array.isArray(workQueue?.tasks)) {
    push('INVALID_TASK_LIST');
    return {mode:'READ_ONLY_NO_DATABASE_ACCEPTANCE',readyForNextPhase:false,issues};
  }
  if(workQueue.phase!==phase)push('QUEUE_PHASE_MISMATCH');
  for(const task of workQueue.tasks) {
    if(task.phase!==phase)push('TASK_OUTSIDE_GLOBAL_ACTIVE_PHASE',{task:task.id,taskPhase:task.phase});
    if(task.status==='RETIRED_APPROVED') {
      const a=task.retirementApproval;
      if(a?.approvedBy!=='USER' || !instant(a?.approvedAt) || !nonempty(a?.reason) || !nonempty(a?.approvalRef))
        push('RETIREMENT_WITHOUT_EXPLICIT_USER_APPROVAL',{task:task.id});
    }
    if(task.status==='DONE_VERIFIED') {
      if(!sha(task.completionCommitSha) || !instant(task.verifiedAt) ||
         !Array.isArray(task.verificationEvidence) ||
         !task.verificationEvidence.some(e=>
           e?.kind==='EXECUTED' && e.exitCode===0 &&
           Array.isArray(e.commands) && e.commands.length>0 && e.commands.every(nonempty)))
        push('VERIFICATION_WITHOUT_EXECUTED_COMMAND_EVIDENCE',{task:task.id});
    }
  }
  // Earlier waves may only be certified when there is a separate, explicit
  // executed passing attestation for *every* named required gate. Metadata,
  // source tests, task counts or a timestamp alone are insufficient.
  if(pos>0)for(const name of PHASE_SEQUENCE.slice(0,pos)) {
    const previous=phaseState?.phases?.[name];
    if(previous?.state!=='CERTIFIED' || !instant(previous.certifiedAt))
      push('PRIOR_PHASE_CERTIFICATION_ABSENT',{phase:name});
    const gates=previous?.requiredGates;
    if(!Array.isArray(gates) || gates.length===0 || gates.some(g=>!nonempty(g))) {
      push('PRIOR_PHASE_GATES_INVALID',{phase:name});continue;
    }
    for(const gate of gates) {
      const matches=(Array.isArray(previous.evidence)?previous.evidence:[]).filter(e=>e?.gate===gate);
      if(!matches.some(e=>e.kind==='EXECUTED' && e.result==='PASSED' && e.exitCode===0 &&
           sha(e.commitSha) && Array.isArray(e.commands) && e.commands.length>0 && e.commands.every(nonempty)))
        push('PRIOR_PHASE_GATE_WITHOUT_EXECUTED_PROOF',{phase:name,gate});
    }
  }
  // This companion NEVER grants phase promotion. Full migration and PostgreSQL
  // acceptance require independent environment proof and an explicit signoff.
  return {mode:'READ_ONLY_NO_DATABASE_ACCEPTANCE',activePhase:phase,
    readyForNextPhase:false,issues};
}

export function inspectCheckout(root) {
  const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  return inspectTransitionEvidence({phaseState:read('docs/coordination/phase-state.json'),
    workQueue:read('docs/coordination/work-queue.json')});
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const root=process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
    const result=inspectCheckout(root);console.log(JSON.stringify(result,null,2));
    if(result.issues.length)process.exitCode=2;
  } catch(e) { console.error(e);process.exitCode=1; }
}
