#!/usr/bin/env node
/**
 * Security coverage is stored ONLY in docs/tracker.json. The catalogue is a
 * requirements baseline, not a second source of execution statuses.
 * Metrics and release readiness are ALWAYS derived, never hand-entered.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
export const CATALOGUE_PATH="docs/security/control-catalog.md";
export const STATES=Object.freeze([
  "UNASSESSED","GAP_CONFIRMED","PARTIAL_EVIDENCE",
  "IMPLEMENTED_UNVERIFIED","VERIFIED","NOT_APPLICABLE",
]);
export const PROGRAMS=Object.freeze([
  ["SP-01","Identity, sessions and RBAC",[1,2,3,4,26]],
  ["SP-02","Tenant and resource isolation",[5,13,14]],
  ["SP-03","PostgreSQL RLS and integrity",[6,7]],
  ["SP-04","API and browser authorization",[8,12]],
  ["SP-05","Secrets, storage and privacy",[9,10,11,22]],
  ["SP-06","Integrations and background jobs",[15,16]],
  ["SP-07","Infrastructure and supply chain",[17,18]],
  ["SP-08","Detection, incidents and recovery",[19,20,21]],
  ["SP-09","Adversarial and independent testing",[23,24]],
  ["SP-10","Security governance",[25]],
]);

export function readCatalogue(file=path.join(ROOT,CATALOGUE_PATH)){
  return fs.readFileSync(file,"utf8");
}
export function extractControls(source){
  const rows=[],byId=new Map();
  for(const match of source.matchAll(/^- \*\*(SEC-(\d{2})-\d{3})\*\* — (.+)$/gm)){
    const [,id,domain,title]=match;
    const item={id,domain:Number(domain),title:title.trim()};
    rows.push(item);
    if(!byId.has(id))byId.set(id,item);
  }
  return {rows,byId};
}

const SHA=/^[a-f0-9]{40}$/;
const RUN_URL=/^https:\/\/github\.com\/42Students\/lms-vnext\/actions\/runs\/[0-9]+$/;
const REVIEW_URL=/^https:\/\/github\.com\/42Students\/lms-vnext\//;
const valid=value=>typeof value==="string"&&value.trim().length>0;
const fail=(errors,code,id)=>errors.push(id?{code,id}:{code});

export function inspectSecurityProgress(doc,catalogue=readCatalogue()){
  const errors=[];
  const {rows,byId}=extractControls(catalogue);
  const security=doc?.security;
  if(rows.length!==byId.size||rows.length===0)fail(errors,"SECURITY_CATALOGUE_DUPLICATE_OR_EMPTY");
  if(security?.schemaVersion!==1||security?.catalogue!==CATALOGUE_PATH||
     security?.authority!=="docs/tracker.json")fail(errors,"SECURITY_TRACKER_SCHEMA_INVALID");
  if(!security||!security.controls||typeof security.controls!=="object"||
     Array.isArray(security.controls))fail(errors,"SECURITY_CONTROLS_MISSING");
  const controls=security?.controls??{};
  for(const id of byId.keys())if(!Object.hasOwn(controls,id))fail(errors,"SECURITY_CONTROL_MISSING",id);
  for(const id of Object.keys(controls))if(!byId.has(id))fail(errors,"SECURITY_UNKNOWN_CONTROL",id);
  if(JSON.stringify(security?.programIds)!==JSON.stringify(PROGRAMS.map(p=>p[0])))
    fail(errors,"SECURITY_PROGRAM_REGISTRY_DRIFT");
  const assigned=PROGRAMS.flatMap(p=>p[2]);
  const domains=[...new Set(rows.map(r=>r.domain))].sort((a,b)=>a-b);
  if(assigned.length!==new Set(assigned).size||
     JSON.stringify([...assigned].sort((a,b)=>a-b))!==JSON.stringify(domains))
    fail(errors,"SECURITY_PROGRAM_COVERAGE_DRIFT");

  const counts=Object.fromEntries(STATES.map(state=>[state,0]));
  const perProgram=PROGRAMS.map(([id,title,domains])=>({
    id,title,domains:domains.map(n=>"SEC-"+String(n).padStart(2,"0")),
    total:0,verified:0,partial:0,implementedUnverified:0,unassessed:0,
    confirmedGaps:0,notApplicable:0,remaining:0,
  }));
  const programByDomain=new Map(PROGRAMS.flatMap((p,i)=>p[2].map(d=>[d,perProgram[i]])));
  const priority=[];
  for(const {id,domain,title} of rows){
    const item=controls[id];
    if(!item||typeof item!=="object"||Array.isArray(item))continue;
    if(!STATES.includes(item.state)){fail(errors,"SECURITY_INVALID_CONTROL_STATE",id);continue;}
    counts[item.state]++;
    const program=programByDomain.get(domain);
    if(!program){fail(errors,"SECURITY_UNASSIGNED_DOMAIN",id);continue;}
    program.total++;
    if(item.state==="VERIFIED")program.verified++;
    else if(item.state==="PARTIAL_EVIDENCE")program.partial++;
    else if(item.state==="IMPLEMENTED_UNVERIFIED")program.implementedUnverified++;
    else if(item.state==="GAP_CONFIRMED")program.confirmedGaps++;
    else if(item.state==="NOT_APPLICABLE")program.notApplicable++;
    else program.unassessed++;
    if(item.state!=="VERIFIED"&&item.state!=="NOT_APPLICABLE")program.remaining++;

    if(item.state==="UNASSESSED"){
      if(item.evidence?.length||item.closure||item.assessedAt||item.remainingChecks)
        fail(errors,"SECURITY_UNASSESSED_HAS_CLAIMS",id);
    }else{
      if(!Array.isArray(item.evidence)||!item.evidence.length||
         item.evidence.some(e=>!e||!SHA.test(e.commitSha??"")||!valid(e.scope)||
           !((e.type==="EXECUTED_SCOPED_TEST"&&RUN_URL.test(e.runUrl??""))||
             (e.type==="REPOSITORY_CONFIG_OBSERVED"&&
              e.sourceUrl==="https://api.github.com/repos/42Students/lms-vnext/branches/main"&&
              item.state==="GAP_CONFIRMED"))))
        fail(errors,"SECURITY_EVIDENCE_INVALID",id);
      if(!valid(item.assessedAt)||!/^\d{4}-\d{2}-\d{2}$/.test(item.assessedAt))
        fail(errors,"SECURITY_REVIEW_DATE_REQUIRED",id);
      if(!valid(item.nextProof))fail(errors,"SECURITY_NEXT_PROOF_REQUIRED",id);
      if(item.state==="IMPLEMENTED_UNVERIFIED"&&
         (!Array.isArray(item.remainingChecks)||!item.remainingChecks.length||
          item.remainingChecks.some(x=>!valid(x))))
        fail(errors,"SECURITY_IMPLEMENTED_WITHOUT_REMAINING_CHECKS",id);
      if(item.state==="VERIFIED"){
        const closure=item.closure;
        if(!closure||!valid(closure.reviewer)||!REVIEW_URL.test(closure.reviewUrl??"")||
           !SHA.test(closure.commitSha??"")||!valid(closure.acceptedAt)||
           closure.positiveAndNegativeVerified!==true||
           closure.deployedConfigurationReviewed!==true||
           !valid(closure.releaseEvidence)||
           !item.evidence.some(e=>e.commitSha===closure.commitSha))
          fail(errors,"SECURITY_VERIFIED_WITHOUT_INDEPENDENT_CLOSURE",id);
      }else if(item.closure)fail(errors,"SECURITY_OPEN_CONTROL_HAS_CLOSURE",id);
      if(item.state==="NOT_APPLICABLE"){
        const exception=item.exception;
        if(!exception||!valid(exception.reason)||!valid(exception.reviewer)||
           !REVIEW_URL.test(exception.reviewUrl??"")||!valid(exception.approvedAt)||
           !valid(exception.expiresAt))
          fail(errors,"SECURITY_UNAPPROVED_EXCLUSION",id);
      }else if(item.exception)fail(errors,"SECURITY_UNAUTHORIZED_EXCLUSION",id);
      priority.push({id,title,state:item.state,nextProof:item.nextProof});
    }
  }
  if(security&&security.controlCount!==rows.length)fail(errors,"SECURITY_DENOMINATOR_DRIFT");
  const counted=Object.values(counts).reduce((a,b)=>a+b,0);
  if(counted!==rows.length)fail(errors,"SECURITY_PROGRESS_COUNT_MISMATCH");
  const verified=counts.VERIFIED,excluded=counts.NOT_APPLICABLE;
  if(security?.releaseSignoff?.approved===true&&verified+excluded!==rows.length)
    fail(errors,"SECURITY_RELEASE_WITH_OPEN_CONTROLS");
  if(security?.releaseSignoff?.approved!==false&&security?.releaseSignoff?.approved!==true)
    fail(errors,"SECURITY_RELEASE_STATUS_INVALID");
  const remaining=rows.length-verified-excluded,assessed=rows.length-counts.UNASSESSED;
  return {
    mode:"SECURITY_EVIDENCE_TRACKING_NOT_PRODUCTION_CERTIFICATION",
    total:rows.length,verified,remaining,assessed,
    verifiedPercent:Number((100*verified/Math.max(1,rows.length)).toFixed(2)),
    assessedPercent:Number((100*assessed/Math.max(1,rows.length)).toFixed(2)),
    counts,perProgram,priority,errors,
    releaseReady:errors.length===0&&remaining===0&&security?.releaseSignoff?.approved===true,
  };
}

export function formatSecurityMarkdown(report){
  const lines=[
    "## Security control coverage — evidence based","",
    "**Verified:** "+report.verified+"/"+report.total+" ("+report.verifiedPercent+"%) · "+
      "**Remaining:** "+report.remaining+" · **Assessed:** "+report.assessed+"/"+report.total+
      " ("+report.assessedPercent+"%)","",
    "| State | Count |","|---|---:|",
    ...STATES.map(s=>"| "+s+" | "+report.counts[s]+" |"),"",
    "| Program | Verified | Partial | Unassessed | Remaining |",
    "|---|---:|---:|---:|---:|",
    ...report.perProgram.map(p=>"| "+p.id+" "+p.title+" | "+p.verified+"/"+p.total+
      " | "+p.partial+" | "+p.unassessed+" | "+p.remaining+" |"),"",
    "**Integrity:** "+(report.errors.length?"FAIL "+report.errors.map(e=>e.code).join(", "):"PASS"),"",
    "Catalogue coverage is not production security certification. Scoped tests cannot automatically close complete controls.",
  ];
  return lines.join("\n")+"\n";
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const doc=JSON.parse(fs.readFileSync(path.join(ROOT,"docs/tracker.json"),"utf8"));
    const report=inspectSecurityProgress(doc);
    if(process.argv.includes("--json"))console.log(JSON.stringify(report,null,2));
    else if(process.argv.includes("--markdown"))process.stdout.write(formatSecurityMarkdown(report));
    else{
      console.log("SECURITY VERIFIED "+report.verified+"/"+report.total+
        " | REMAINING "+report.remaining+" | ASSESSED "+report.assessed+
        " | UNASSESSED "+report.counts.UNASSESSED);
      console.log("INTEGRITY "+(report.errors.length?"FAIL":"PASS"));
      if(report.errors.length)console.error(JSON.stringify(report.errors));
    }
    if(report.errors.length||(process.argv.includes("--release")&&!report.releaseReady))
      process.exitCode=2;
  }catch(error){
    console.error("SECURITY_CONTROL_PROGRESS_UNAVAILABLE",error instanceof Error?error.name:"ERROR");
    process.exitCode=2;
  }
}
