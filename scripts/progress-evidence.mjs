/**
 * Read-only, non-certifying engineering progress projection.
 * All task labels and evidence anchors live in docs/tracker.json.
 * Percentages are unweighted heuristic equivalents, NOT task signoff.
 */
export const DATABASE_PROGRESS_RUBRIC = Object.freeze({
  discovery: Object.freeze({NOT_ASSESSED:0, PARTIAL_INVENTORY:0.5, SOURCE_REVIEWED:0.9, ACCEPTED_BY_CANONICAL_DONE:1}),
  implementation: Object.freeze({GATE_PENDING:0.1, SOURCE_STAGED:0.35, CODE_PARTIAL:0.55, INTEGRATED_PARTIAL:0.8, ACCEPTED_BY_CANONICAL_DONE:1}),
  verification: Object.freeze({NOT_RUN:0, STAGED_NOT_VERIFIED:0.05, SOURCE_OR_STATIC_CHECKS:0.2, SCOPED_POSTGRES_PASS:0.65, ACCEPTED_BY_CANONICAL_DONE:1}),
});
const urlAllowed = url => typeof url==='string' && /^https:\/\/github\.com\/42Students\/lms-vnext\/actions\/runs\/[0-9]+(?:\/job\/[0-9]+)?$/.test(url);
const amount=(value)=>Math.round(value*10)/10;
const fail=(errors,code,id)=>errors.push({code,...(id?{id}:{})});
export function inspectDatabaseProgress(doc) {
  const tasks=(doc?.tasks??[]).filter(t=>t.phase==='DATABASE');
  const config=doc?.execution?.databaseProgress;
  const errors=[];
  if(!config || config.version!==1 || !Array.isArray(config.items)) {
    fail(errors,'MISSING_DATABASE_PROGRESS_MODEL');
    return {mode:'NON_CERTIFYING_ESTIMATE',errors,measurements:null,items:[]};
  }
  const byId=new Map(),seen=new Set();
  for(const row of config.items) {
    if(!row || typeof row.id!=='string' || seen.has(row.id)) {
      fail(errors,'DUPLICATE_DATABASE_PROGRESS_ID',row?.id);continue;
    }
    seen.add(row.id);byId.set(row.id,row);
    for(const metric of ['discovery','implementation','verification']) {
      if(!Object.hasOwn(DATABASE_PROGRESS_RUBRIC[metric],row[metric]))
        fail(errors,'INVALID_DATABASE_PROGRESS_LABEL',row.id);
    }
    if(['discovery','implementation','verification'].some(m=>row[m]==='ACCEPTED_BY_CANONICAL_DONE') &&
      doc.tasks.find(t=>t.id===row.id)?.done!==true)fail(errors,'PROGRESS_MUST_NOT_DECLARE_ACCEPTANCE',row.id);
    if(row.basis !== undefined && (row.basis?.source!=='RETIRED_2026_10_12_QUEUE' ||
      row.basis?.taskId!==row.id)) fail(errors,'INVALID_PROGRESS_SOURCE_BASIS',row.id);
    if(row.verification==='SCOPED_POSTGRES_PASS' &&
      (!Array.isArray(row.runs)||row.runs.length===0||row.runs.some(r=>
        !urlAllowed(r.url)||!['WORKFLOW_PASSED','SCOPED_PASS_OVERALL_FAIL'].includes(r.scope))))
      fail(errors,'UNSUPPORTED_POSTGRES_PROGRESS_CLAIM',row.id);
  }
  for(const task of tasks) {
    if(!byId.has(task.id))fail(errors,'MISSING_DATABASE_PROGRESS_TASK',task.id);
  }
  for(const id of byId.keys()) {
    if(!tasks.some(t=>t.id===id))fail(errors,'ORPHAN_DATABASE_PROGRESS_TASK',id);
  }
  const summaries={discovery:0,implementation:0,verification:0,accepted:0};
  const items=tasks.map(t=>{
    const row=byId.get(t.id);
    const accepted=t.done===true;
    const scores=Object.fromEntries(['discovery','implementation','verification'].map(metric=>
      [metric,accepted?1:(DATABASE_PROGRESS_RUBRIC[metric][row?.[metric]]??0)]));
    for(const metric of ['discovery','implementation','verification'])summaries[metric]+=scores[metric];
    if(accepted)summaries.accepted++;
    return {id:t.id,done:accepted,labels:accepted?
      {discovery:'ACCEPTED',implementation:'ACCEPTED',verification:'ACCEPTED'}:
      {discovery:row?.discovery??'MISSING',implementation:row?.implementation??'MISSING',
        verification:row?.verification??'MISSING'},
      scores,runs:row?.runs??[],basis:row?.basis??null};
  });
  const total=tasks.length;
  const measurements=Object.fromEntries(Object.entries(summaries).map(([key,value])=>
    [key,{equivalentTasks:amount(value),total,percent:total?amount(value/total*100):0}]));
  return {mode:'NON_CERTIFYING_ESTIMATE',notPhaseReadiness:true,equalWeightPerTask:true,
    sourceNotice:config.sourceNotice,measurements,items,errors};
}
export function formatDatabaseProgress(doc,opts={}) {
  const r=inspectDatabaseProgress(doc);
  if(r.errors.length)throw new Error('Invalid database progress model: '+JSON.stringify(r.errors));
  const m=r.measurements;
  const compact=['discovery','implementation','verification','accepted']
    .map(key=>key+' '+m[key].percent.toFixed(1)+'%').join(' | ');
  if(!opts.detailed)return 'DATABASE evidence-weighted heuristic | '+compact+
    ' | NOT phase certification';
  const only=opts.laneId && doc.execution.lanes.find(l=>l.id===opts.laneId);
  const ids=only?new Set(only.dbTaskIds):null;
  const lines=['DATABASE evidence-weighted heuristic | '+compact,
    'Equal task weights; source/staging/PG scopes scored by a declared rubric, not hours or done status.',
    'Retired work queue only anchors historical source notes; PASSING scope != global acceptance.',
    'Official DONE '+m.accepted.equivalentTasks+'/'+m.accepted.total+'; global phase remains independently gated.',
    'ID     Discovery            Implementation           Verification                Accepted  Evidence'];
  for(const item of r.items.filter(x=>!ids||ids.has(x.id))){
    lines.push(item.id.padEnd(7)+item.labels.discovery.padEnd(21)+
      item.labels.implementation.padEnd(25)+item.labels.verification.padEnd(28)+
      String(item.done).padEnd(10)+(item.runs.map(x=>x.scope).join(',')||
        (item.basis?.source??'NONE')));
  }
  return lines.join('\n');
}
