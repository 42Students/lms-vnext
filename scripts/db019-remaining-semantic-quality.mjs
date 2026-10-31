#!/usr/bin/env node
// DB-019 independent source-quality audit for DB03/04/05/06/08/10.
// Source-level identity, decisions and explicitly unverified gaps only.
// It must NEVER certify PostgreSQL execution, runtime behavior or retirements.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const ORACLE="21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const required=s=>typeof s==="string" && s.trim().length>0;
const key=(table,col)=>required(table)&&required(col)?table+"."+col:null;
export const REMAINING_DOMAIN_FILES=Object.freeze({
  DB03:["db-pass4-columns-db03_groups_and_electives.json","database-parity-db03-79-field-crosswalk.json"],
  DB04:["db-pass4-columns-db04_profiles_and_verification.json","db04-field-crosswalk-proposals.json"],
  DB05:["db-pass4-columns-db05_courses_and_content.json","db05-chat06-source-semantic-review.json"],
  DB06:["db-pass4-columns-db06_assessments_and_attendance.json","database-parity-db06-field-reconciliation.json"],
  DB08:["db-pass4-columns-db08_placement_policy_and_outcomes.json","database-parity-db08-field-ledger.json"],
  DB10:["db-pass4-columns-db10_shared_operations.json","database-parity-db10-field-ledger.json"],
});
const floor={DB03:79,DB04:103,DB05:92,DB06:248,DB08:280,DB10:221};

/** Restrict even a SOURCE-ONLY proposal to the tables actually relevant to
 * its frozen source family. A syntactically valid column in an unrelated
 * placement domain must never pass the crosswalk audit as a candidate.
 */
export const DB08_SOURCE_TARGET_TABLES=Object.freeze({
  application_screening:["placement_application_screenings","placement_application_screening_history"],
  external_placement:["placement_external_offers"],
  interview:["placement_job_rounds","placement_interview_private_events"],
  job:["placement_jobs"],
  job_application:["placement_applications","placement_application_status_history",
    "placement_application_screenings","placement_application_private_artifacts","placement_offers"],
  job_application_status_history:["placement_application_status_history"],
  job_eligibility_override:["placement_eligibility_overrides"],
  job_offer:["placement_offers","placement_joining_outcomes","placement_offer_status_history"],
  job_preferences:["placement_candidate_preferences"],
  learner_saved_job:["placement_saved_jobs"],
  placement_batch:["placement_batch_lifecycles"],
  placement_debarment:["placement_debarments"],
  placement_eligibility:["placement_eligibility_decisions"],
  placement_eligibility_event:["placement_eligibility_events"],
  placement_registration:["placement_batch_registrations"],
  placement_season:["placement_seasons"],
  round_attendance:["placement_round_attendance"],
  round_result:["placement_round_results"],
});

/* Frozen historical-source scope: a mutable ledger flag cannot turn an
   active assessment table into a retirement candidate and hide its fields. */
export const DB06_FROZEN_HISTORICAL_CANDIDATES=Object.freeze({
  assigned_exam:19,attempted_question:13,exam:19,exam_faculty:9,
  exam_faculty_mapping:2,exam_monitoring:12,examinee:11,
  facial_recognition_result:7,question:10,question_option:10,
  quiz_attempt:8,selected_option:8,
});
const oracleOf=(domain,artifact)=>{
  if(domain==="DB03")return artifact.legacyOracleSha;
  if(domain==="DB05")return artifact.source?.legacyBackendSha;
  if(domain==="DB08")return artifact.capturedFrom?.legacyBackendSha;
  return artifact.legacyBackendSha || artifact.sourceSha;
};

export function auditDb019Remaining(ledgers,artifacts,db10Overlay=null) {
  const errors=[];
  const fail=(code,field=null)=>errors.push({code,...(field===null?{}:{field})});
  if(!ledgers||!artifacts||typeof ledgers!=="object"||typeof artifacts!=="object")
    return {valid:false,errors:[{code:"INVALID_INPUT"}],sourceOnly:true,acceptanceReady:false};
  const byDomain={};
  let total=0, sourceReview=0;
  for(const domain of Object.keys(REMAINING_DOMAIN_FILES)){
    const ledger=ledgers[domain],artifact=artifacts[domain];
    if(!ledger||!Array.isArray(ledger.tables)||!artifact){
      fail("MISSING_DOMAIN_OR_ARTIFACT",domain);continue;
    }
    if(ledger.sourceSha!==ORACLE || oracleOf(domain,artifact)!==ORACLE)
      fail("FROZEN_ORACLE_SHA_DRIFT",domain);
    const source=new Map();
    for(const t of ledger.tables)for(const row of t.rows||[]){
      const id=key(row?.legacyTable,row?.legacyColumn);
      if(!id || row.legacyTable!==t.table || source.has(id))
        fail("SOURCE_DUPLICATE_OR_INVALID",id||t.table);
      else source.set(id,row);
    }
    if(source.size!==floor[domain] || ledger.counts?.fields!==floor[domain])
      fail("DOMAIN_DENOMINATOR_DRIFT",domain);
    const review=new Map();
    let proposal=0, undecided=0, retirement=0, active=0, historic=0;
    const add=(id,row,type,validate)=>{
      const original=source.get(id);
      if(!id||!original||review.has(id)||type!==original.sourceType){
        fail("REVIEW_FIELD_UNKNOWN_DUPLICATE_OR_TYPE_DRIFT",id);return;
      }
      review.set(id,row);
      validate(original);
    };
    if(domain==="DB03") {
      for(const row of artifact.fields||[])add(row?.legacyColumn,row,row?.legacyType,()=>{
        if(!required(row.kind)||!Array.isArray(row.target)||!row.target.length||
          row.verification!=="UNVERIFIED"||row.postgresTestProof!=null||
          row.serviceWriteProof!=null||row.serviceReadProof!=null)
          fail("DB03_MISSING_OR_FALSE_FIELD_DISPOSITION",row.legacyColumn);
        proposal++;
        if(row.requiredDecision===true)undecided++;
      });
    } else if(domain==="DB04") {
      for(const row of artifact.rows||[])add(key(row?.legacyTable,row?.legacyColumn),
        row,row?.legacyType,()=>{
        if(!required(row.activeOrRetired)||!required(row.proposedTarget)||
          !["UNVERIFIED","SOURCE_DISPOSITION_ONLY_UNVERIFIED"].includes(row.semanticVerification))
          fail("DB04_MISSING_SOURCE_DISPOSITION",key(row.legacyTable,row.legacyColumn));
        if(row.activeOrRetired==="UNDECIDED")undecided++;
        else if(row.activeOrRetired.startsWith("HISTORICAL_"))retirement++;
        else if(row.activeOrRetired==="ACTIVE_SOURCE_CONFIRMED")active++;
        else fail("DB04_UNKNOWN_SOURCE_CLASSIFICATION",key(row.legacyTable,row.legacyColumn));
      });
    } else if(domain==="DB05") {
      for(const row of artifact.fields||[])add(row?.source,row,row?.sourceType,()=>{
        if(!["UNREGISTERED_DRAFT","SOURCE_CANDIDATE",
          "REMODELED_NEEDS_PROOF","MISSING_OR_UNPROVEN"].includes(row.classification) ||
          !required(row.targetProposal)||row.semanticVerification!=="NOT_VERIFIED" ||
          row.runtimeDatabaseVerification!=="NOT_RUN" ||
          !["NOT_VERIFIED","LEGACY_CONSUMER_SOURCE_CONFIRMED_VNEXT_SERVICE_NOT_ADAPTED"].includes(row.producerConsumerVerification))
          fail("DB05_MISSING_OR_FALSE_FIELD_REVIEW",row.source);
        if(row.classification==="MISSING_OR_UNPROVEN" ||
          row.classification==="REMODELED_NEEDS_PROOF")undecided++;
        proposal++;
      });
    } else if(domain==="DB06") {
      const tableStates=new Map(ledger.tables.map(t=>[t.table,t.sourceDisposition]));
      for(const table of ledger.tables){
        const historical=Object.hasOwn(DB06_FROZEN_HISTORICAL_CANDIDATES,table.table);
        const expected=historical?"RETIREMENT_CANDIDATE_NOT_APPROVED":"ACTIVE_SOURCE_CONTRACT";
        if(table.sourceDisposition!==expected ||
           (historical && table.rows?.length!==DB06_FROZEN_HISTORICAL_CANDIDATES[table.table]))
          fail("DB06_FROZEN_TABLE_DISPOSITION_DRIFT",table.table);
      }
      for(const [name,count] of Object.entries(DB06_FROZEN_HISTORICAL_CANDIDATES)){
        const matching=ledger.tables.filter(t=>t.table===name && t.rows?.length===count);
        if(matching.length!==1)fail("DB06_FROZEN_HISTORICAL_CENSUS_DRIFT",name);
      }
      for(const table of artifact.tables||[])for(const row of table.fields||[]){
        const id=key(table.legacyTable,row.legacyField);
        add(id,row,row.sourceType,()=>{
          if(tableStates.get(table.legacyTable)!=="ACTIVE_SOURCE_CONTRACT" ||
             !required(row.decision)||!required(row.reason) ||
             row.runtimeVerified!==false || row.semanticVerified===true)
            fail("DB06_ACTIVE_FIELD_DISPOSITION_INVALID",id);
          active++;
          if(/TARGET_GAP/.test(row.decision))undecided++;
        });
      }
      for(const [id] of source)if(!review.has(id)){
        const name=id.slice(0,id.lastIndexOf("."));
        if(tableStates.get(name)!=="RETIREMENT_CANDIDATE_NOT_APPROVED")
          fail("DB06_ACTIVE_FIELD_MISSING_OR_UNAPPROVED_RETIREMENT",id);
        else{historic++;retirement++;review.set(id,{historical:true});}
      }
    } else if(domain==="DB08") {
      for(const table of artifact.tables||[])for(const row of table.fields||[]){
        const id=key(table.legacyTable,row.legacyColumn);
        add(id,row,row.legacyType,(original)=>{
          if(row.status!=="UNVERIFIED"||
             row.verifiedMapping!==null||row.dbTestEvidence!==null||
             row.producerConsumerEvidence!==null||
             !Array.isArray(row.exactNameCandidatesOnly))
            fail("DB08_UNSUPPORTED_EXACT_FIELD_MAPPING",id);
          // A source-level proposal is NOT a runtime mapping or an approved
          // retirement.  The real PG/provider/tenant gates remain mandatory.
          if(row.reviewDecision!==null){
            const decision=row.reviewDecision;
            const classifications=[
              "EXPLICIT_RUNTIME_GAP","NEEDS_ENUM_CROSSWALK",
              "PROPOSED_ACTIVE_FIELD_MAPPING",
            ];
            if(!Object.hasOwn(DB08_SOURCE_TARGET_TABLES,table.legacyTable)||
               !decision||typeof decision!=="object"||
               decision.reviewStatus!=="SOURCE_REVIEWED_PROPOSAL_NOT_VERIFIED"||
               !classifications.includes(decision.classification)||
               !Array.isArray(decision.targetRefs)||
               (decision.classification==="PROPOSED_ACTIVE_FIELD_MAPPING" &&
                 decision.targetRefs.length===0)||
               decision.targetRefs.some(ref=>{
                 const parts=/^(placement_[a-z_]+)[.]([a-z_]+)$/.exec(ref);
                 return !parts||!DB08_SOURCE_TARGET_TABLES[table.legacyTable].includes(parts[1]);
               })||
               new Set(decision.targetRefs).size!==decision.targetRefs.length||
               !required(decision.sourceRationale)||
               !required(decision.outstandingProof)||
               decision.frozenLegacyOracleSha!==ORACLE||
               decision.runtimeVerified!==false||
               decision.consumerVerified!==false||
               decision.retirementApproved!==false)
              fail("DB08_SOURCE_REVIEW_PROPOSAL_INVALID",id);
            else proposal++;
          }
          if(row.legacyNullable!==original.nullable ||
             row.legacyDefault!==original.defaultValue ||
             row.sourceEvidence!==original.sourceEvidence ||
             JSON.stringify(row.riskFlags)!==JSON.stringify(original.riskFlags))
            fail("DB08_SOURCE_LINEAGE_METADATA_DRIFT",id);
          if(Array.isArray(row.exactNameCandidatesOnly) && (
             row.exactNameCandidatesOnly.some(candidate=>
               typeof candidate!=="string" ||
               !/^[a-z_][a-z_0-9]*[.][a-z_][a-z_0-9]*$/i.test(candidate)) ||
             new Set(row.exactNameCandidatesOnly).size!==row.exactNameCandidatesOnly.length))
            fail("DB08_INVALID_EXACT_NAME_CANDIDATES",id);
          undecided++;
        });
      }
    } else if(domain==="DB10") {
      for(const row of artifact.records||[])add(
        key(row.legacyTable,row.legacyColumn),row,row.legacyType,()=>{
        if(!required(row.familyDisposition) || !required(row.sourceDisposition) ||
           !required(row.sourceDispositionState) || !required(row.familyReviewEvidence) ||
           row.status!=="UNMAPPED" ||
           !Array.isArray(row.validationEvidence) ||
           row.validationEvidence.length!==0 ||
           row.verifiedLegacySha!==null)
          fail("DB10_UNSUPPORTED_FIELD_COMPLETION",key(row.legacyTable,row.legacyColumn));
        proposal++;
      });
    }
    for(const id of source.keys())if(!review.has(id))fail("UNREVIEWED_SOURCE_FIELD",id);
    if(review.size!==floor[domain])fail("DOMAIN_REVIEW_DENOMINATOR_DRIFT",domain);
    byDomain[domain]={sourceFields:source.size,reviewed:review.size,
      sourceProposalsNotRuntimeVerified:proposal,explicitActiveSourceFields:active,
      unresolvedExactDecisions:undecided,unapprovedRetirementCandidates:retirement,
      historicalNotRetired:historic,runtimeVerified:0};
    total+=source.size;sourceReview+=review.size;
  }
  if(total!==1023||sourceReview!==1023)fail("REMAINING_GLOBAL_SOURCE_REVIEW_DENOMINATOR");
  let closure77=0;
  if(db10Overlay!==null){
    if(db10Overlay.legacyBackendSha!==ORACLE ||
       !Array.isArray(db10Overlay.records) || db10Overlay.records.length!==77)
      fail("DB10_CLOSURE_OVERLAY_UNPINNED_OR_INCOMPLETE");
    const sourceKeys=new Set((artifacts.DB10?.records||[]).map(r=>key(r.legacyTable,r.legacyColumn)));
    const seen=new Set();
    for(const row of db10Overlay.records||[]){
      const id=key(row?.legacyTable,row?.legacyColumn);
      if(!id||!sourceKeys.has(id)||seen.has(id)||!required(row.sourceDisposition)||
         !required(row.sourceDispositionRationale)||
         row.finalDispositionApproved!==false||row.runtimeVerified!==false)
        fail("DB10_CLOSURE_OVERLAY_INVALID_OR_FALSE_APPROVAL",id);
      else closure77++;
      seen.add(id);
    }
  }
  return {valid:errors.length===0,errors,sourceOnly:true,
    acceptanceReady:false,postgresqlVerified:false,producerConsumerVerified:false,
    sourceFields:total,reviewed:sourceReview,domains:byDomain,
    db10AdditionalExplicitSourceDispositions:closure77,
    missingFinalDecisionGates:[
      "DB04 undecided and unapproved historical retirements",
      "DB06 historical exam/proctoring candidate retirements",
      "DB08 280 individual exact field decisions, currently candidate-only",
      "DB05 unregistered/remodeled active course and lesson concepts",
      "DB10 221 source-only dispositions, zero field-level runtime checks",
      "DB03 79 source proposals not automatically equivalent to runtime mappings",
    ]};
}

export function loadDb019Remaining(root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..")){
  const read=name=>JSON.parse(fs.readFileSync(path.join(root,"docs/planning",name),"utf8"));
  const ledgers={},artifacts={};
  for(const [domain,[ledger,review]] of Object.entries(REMAINING_DOMAIN_FILES)){
    ledgers[domain]=read(ledger);artifacts[domain]=read(review);
  }
  return auditDb019Remaining(ledgers,artifacts,
    read("database-parity-db10-source-disposition-closure.json"));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const report=loadDb019Remaining();console.log(JSON.stringify(report,null,2));
    if(!report.valid||process.argv.includes("--require-complete"))process.exitCode=2;
  }catch(error){console.error(error);process.exitCode=1;}
}
