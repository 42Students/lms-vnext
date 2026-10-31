import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {REMAINING_DOMAIN_FILES,auditDb019Remaining,loadDb019Remaining} from
  "../scripts/db019-remaining-semantic-quality.mjs";
const read=name=>JSON.parse(fs.readFileSync(
  new URL("../docs/planning/"+name,import.meta.url),"utf8"));
const ledgers={},artifacts={};
for(const [domain,[source,review]] of Object.entries(REMAINING_DOMAIN_FILES)){
  ledgers[domain]=read(source);artifacts[domain]=read(review);
}
const db10Overlay=read("database-parity-db10-source-disposition-closure.json");
const cp=value=>structuredClone(value);
const audit=(a=ledgers,b=artifacts,c=db10Overlay)=>auditDb019Remaining(a,b,c);
const expects=(result,code)=>assert.ok(result.errors.some(x=>x.code===code),
  "expected "+code+": "+JSON.stringify(result.errors.slice(0,6)));

test("exact six-domain 1023-field source reconciliation is integrity-valid but not acceptance",()=>{
  const result=loadDb019Remaining();
  assert.equal(result.valid,true);
  assert.equal(result.sourceFields,1023);
  assert.equal(result.reviewed,1023);
  assert.equal(result.db10AdditionalExplicitSourceDispositions,77);
  assert.deepEqual(Object.fromEntries(Object.entries(result.domains)
    .map(([domain,scope])=>[domain,scope.sourceFields])),
    {DB03:79,DB04:103,DB05:92,DB06:248,DB08:280,DB10:221});
  assert.equal(result.domains.DB06.unapprovedRetirementCandidates,128);
  assert.equal(result.domains.DB08.unresolvedExactDecisions,280);
  assert.equal(result.domains.DB04.unresolvedExactDecisions,43);
  assert.equal(result.domains.DB04.unapprovedRetirementCandidates,33);
  assert.equal(result.postgresqlVerified,false);
  assert.equal(result.acceptanceReady,false);
});
test("DB03 forged live field proof fails",()=>{
  const changed=cp(artifacts);
  changed.DB03.fields[0].verification="DB_TESTED";
  expects(audit(ledgers,changed),"DB03_MISSING_OR_FALSE_FIELD_DISPOSITION");
});
test("DB04 source or retirement classification cannot vanish",()=>{
  const changed=cp(artifacts);
  changed.DB04.rows[0].activeOrRetired="";
  expects(audit(ledgers,changed),"DB04_MISSING_SOURCE_DISPOSITION");
});
test("DB05 excludes invented verified consumers and missing source IDs",()=>{
  const changed=cp(artifacts);
  changed.DB05.fields[0].producerConsumerVerification="VERIFIED";
  expects(audit(ledgers,changed),"DB05_MISSING_OR_FALSE_FIELD_REVIEW");
  const unknown=cp(artifacts);
  unknown.DB05.fields[0].source="invented_table.id";
  expects(audit(ledgers,unknown),"REVIEW_FIELD_UNKNOWN_DUPLICATE_OR_TYPE_DRIFT");
});
test("DB06 128 historical exam fields cannot be silently treated as approved retirement",()=>{
  const changed=cp(ledgers);
  changed.DB06.tables.find(t=>t.table==="assigned_exam").sourceDisposition="RETIRE_APPROVED";
  expects(audit(changed),"DB06_ACTIVE_FIELD_MISSING_OR_UNAPPROVED_RETIREMENT");
});
test("DB06 active source fields must retain individually reviewed decisions",()=>{
  const changed=cp(artifacts);
  changed.DB06.tables[0].fields[0].decision=null;
  expects(audit(ledgers,changed),"DB06_ACTIVE_FIELD_DISPOSITION_INVALID");
});
test("DB08 280 placement fields cannot self-promote from candidates to exact mappings",()=>{
  const promoted=cp(artifacts);
  promoted.DB08.tables[0].fields[0].status="MAPPED";
  expects(audit(ledgers,promoted),"DB08_UNSUPPORTED_EXACT_FIELD_MAPPING");
  const forged=cp(artifacts);
  forged.DB08.tables[0].fields[0].reviewDecision="MAPPED";
  expects(audit(ledgers,forged),"DB08_SOURCE_REVIEW_PROPOSAL_INVALID");
});

test("DB08 28 job_offer source-to-target proposals remain bounded and never claim runtime proof",()=>{
  const result=loadDb019Remaining();
  assert.equal(result.valid,true);
  assert.equal(result.domains.DB08.sourceProposalsNotRuntimeVerified,123);
  assert.equal(result.domains.DB08.unresolvedExactDecisions,280);
  assert.equal(result.domains.DB08.runtimeVerified,0);
  assert.equal(artifacts.DB08.tables.find(t=>t.legacyTable==="job_offer").fields.length,28);
  const schema=fs.readFileSync(new URL("../src/db/schema/placements.ts",import.meta.url),"utf8");
  const expected={
    placement_offers:["export const placementOffers = pgTable(","export const placementOfferStatusHistory = pgTable("],
    placement_offer_status_history:["export const placementOfferStatusHistory = pgTable(","export const placementInterviewPrivateEvents = pgTable("],
    placement_joining_outcomes:["export const placementJoiningOutcomes = pgTable(","export const placementJoiningHistory = pgTable("],
  };
  const blocks=Object.fromEntries(Object.entries(expected).map(([table,[start,end]])=>{
    const i=schema.indexOf(start),j=schema.indexOf(end,i+start.length);
    assert.ok(i>=0&&j>i,table+" typed schema missing");
    return [table,schema.slice(i,j)];
  }));
  for(const field of artifacts.DB08.tables.find(t=>t.legacyTable==="job_offer").fields){
    const d=field.reviewDecision;
    assert.equal(d.reviewStatus,"SOURCE_REVIEWED_PROPOSAL_NOT_VERIFIED");
    assert.equal(d.runtimeVerified,false);
    assert.equal(d.consumerVerified,false);
    assert.equal(d.retirementApproved,false);
    for(const target of d.targetRefs){
      const [table,col]=target.split(".");
      assert.ok(blocks[table]?.includes('("'+col+'"'),field.legacyColumn+": missing typed "+target);
    }
  }
  assert.equal(artifacts.DB08.gate.fieldsUnverified,280);
  assert.equal(artifacts.DB08.counts.verifiedFields,0);
});


test("DB08 10 historic application transition fields have bounded typed proposals and explicit unresolved semantics",()=>{
  const history=artifacts.DB08.tables.find(t=>t.legacyTable==="job_application_status_history");
  assert.equal(history.fields.length,10);
  const decisions=history.fields.map(x=>x.reviewDecision);
  assert.equal(decisions.filter(d=>d.classification==="EXPLICIT_RUNTIME_GAP").length,6);
  assert.equal(decisions.filter(d=>d.classification==="NEEDS_ENUM_CROSSWALK").length,2);
  assert.equal(decisions.filter(d=>d.classification==="PROPOSED_ACTIVE_FIELD_MAPPING").length,2);
  const schema=fs.readFileSync(new URL("../src/db/schema/placements.ts",import.meta.url),"utf8");
  const i=schema.indexOf("export const placementApplicationStatusHistory = pgTable(");
  const j=schema.indexOf("export const placementApplicationScreenings = pgTable(",i+10);
  assert.ok(i>=0&&j>i,"Registered application history typed table missing");
  const typed=schema.slice(i,j);
  for(const field of history.fields){
    const d=field.reviewDecision;
    assert.equal(field.status,"UNVERIFIED");
    assert.equal(d.reviewStatus,"SOURCE_REVIEWED_PROPOSAL_NOT_VERIFIED");
    assert.equal(d.runtimeVerified,false);
    assert.equal(d.consumerVerified,false);
    assert.equal(d.retirementApproved,false);
    assert.ok(d.sourceRationale.length>25);
    assert.ok(d.outstandingProof.length>25);
    for(const ref of d.targetRefs){
      const [table,col]=ref.split(".");
      assert.equal(table,"placement_application_status_history");
      assert.ok(typed.includes('("'+col+'"'),field.legacyColumn+": target missing "+ref);
    }
  }
  const decisionsBySource=Object.fromEntries(history.fields.map(x=>[x.legacyColumn,x.reviewDecision]));
  assert.equal(decisionsBySource["changed_by"].classification,"EXPLICIT_RUNTIME_GAP");
  assert.equal(decisionsBySource["is_deleted"].targetRefs.length,0);
  assert.equal(decisionsBySource["updated_at"].targetRefs.length,0);
  assert.equal(artifacts.DB08.counts.verifiedFields,0);
  assert.equal(artifacts.DB08.gate.fieldsUnverified,280);
});

test("DB08 15 historic round-result fields are reviewed with actor, candidate-privacy and lifecycle gaps retained",()=>{
  const table=artifacts.DB08.tables.find(t=>t.legacyTable==="round_result");
  assert.equal(table?.fields.length,15);
  const fieldMap=new Map(table.fields.map(x=>[x.legacyColumn,x]));
  assert.equal(table.fields.filter(x=>x.reviewDecision?.classification==="PROPOSED_ACTIVE_FIELD_MAPPING").length,10);
  assert.equal(table.fields.filter(x=>x.reviewDecision?.classification==="EXPLICIT_RUNTIME_GAP").length,2);
  assert.equal(table.fields.filter(x=>x.reviewDecision?.classification==="NEEDS_ENUM_CROSSWALK").length,3);
  assert.deepEqual(fieldMap.get("submitted_by_type")?.reviewDecision.targetRefs,[]);
  assert.deepEqual(fieldMap.get("superseded_by")?.reviewDecision.targetRefs,["placement_round_results.superseded_at"]);
  assert.ok(fieldMap.get("comment")?.reviewDecision.targetRefs.includes("placement_round_results.internal_comment"));
  assert.ok(fieldMap.get("comment")?.reviewDecision.targetRefs.includes("placement_round_results.candidate_message"));
  const schema=fs.readFileSync(new URL("../src/db/schema/placements.ts",import.meta.url),"utf8");
  const i=schema.indexOf("export const placementRoundResults = pgTable(");
  const j=schema.indexOf("export const placementOffers = pgTable(",i+10);
  assert.ok(i>=0&&j>i,"Current round-result source table missing");
  const block=schema.slice(i,j);
  for(const field of table.fields){
    const d=field.reviewDecision;
    assert.equal(field.status,"UNVERIFIED");
    assert.equal(d.reviewStatus,"SOURCE_REVIEWED_PROPOSAL_NOT_VERIFIED");
    assert.equal(d.runtimeVerified,false);
    assert.equal(d.consumerVerified,false);
    assert.equal(d.retirementApproved,false);
    assert.ok(d.sourceRationale.length>25);
    assert.ok(d.outstandingProof.length>25);
    for(const ref of d.targetRefs){
      const [tableName,col]=ref.split(".");
      assert.equal(tableName,"placement_round_results");
      assert.ok(block.includes('("'+col+'"'),field.legacyColumn+" target absent "+ref);
    }
  }
  assert.equal(artifacts.DB08.gate.fieldsUnverified,280);
  assert.equal(artifacts.DB08.counts.verifiedFields,0);
});

test("DB08 46 legacy job fields are individually source-reviewed but never falsely marked verified",()=>{
  const source=artifacts.DB08.tables.find(t=>t.legacyTable==="job");
  assert.equal(source.fields.length,46);
  const decisions=source.fields.map(x=>x.reviewDecision);
  assert.equal(decisions.filter(x=>x.classification==="PROPOSED_ACTIVE_FIELD_MAPPING").length,38);
  assert.equal(decisions.filter(x=>x.classification==="EXPLICIT_RUNTIME_GAP").length,8);
  const schema=fs.readFileSync(new URL("../src/db/schema/placements.ts",import.meta.url),"utf8");
  const begin=schema.indexOf("export const placementJobs = pgTable(");
  const end=schema.indexOf("export const placementJobRoleOptions = pgTable(",begin+10);
  assert.ok(begin>=0&&end>begin);
  const typed=schema.slice(begin,end);
  for(const field of source.fields){
    const d=field.reviewDecision;
    assert.equal(field.status,"UNVERIFIED");
    assert.equal(d.reviewStatus,"SOURCE_REVIEWED_PROPOSAL_NOT_VERIFIED");
    assert.equal(d.runtimeVerified,false);
    assert.equal(d.consumerVerified,false);
    assert.equal(d.retirementApproved,false);
    assert.ok(d.sourceRationale.length>25);
    assert.ok(d.outstandingProof.length>25);
    for(const ref of d.targetRefs){
      const [table,col]=ref.split(".");
      assert.equal(table,"placement_jobs");
      assert.ok(typed.includes('("'+col+'"'),field.legacyColumn+": missing source-typed "+ref);
    }
  }
  assert.equal(artifacts.DB08.counts.verifiedFields,0);
  assert.equal(artifacts.DB08.gate.fieldsUnverified,280);
});

test("DB08 24 application fields preserve staff-private resume and assessment boundaries",()=>{
  const app=artifacts.DB08.tables.find(t=>t.legacyTable==="job_application");
  assert.equal(app.fields.length,24);
  assert.equal(app.fields.filter(x=>x.reviewDecision.classification==="EXPLICIT_RUNTIME_GAP").length,2);
  const schema=fs.readFileSync(new URL("../src/db/schema/placements.ts",import.meta.url),"utf8");
  const boundaries={"placement_applications":["export const placementApplications = pgTable(","export const placementApplicationPrivateArtifacts = pgTable("],"placement_application_private_artifacts":["export const placementApplicationPrivateArtifacts = pgTable(","export const placementLegacyApplicationStatusEvents = pgTable("],"placement_application_status_history":["export const placementApplicationStatusHistory = pgTable(","export const placementApplicationScreenings = pgTable("],"placement_application_screenings":["export const placementApplicationScreenings = pgTable(","export const placementOffers = pgTable("],"placement_offers":["export const placementOffers = pgTable(","export const placementOfferStatusHistory = pgTable("]};
  const blocks=Object.fromEntries(Object.entries(boundaries).map(([tn,[start,end]])=>{
    const i=schema.indexOf(start),j=schema.indexOf(end,i+start.length);
    assert.ok(i>=0&&j>i,"Missing table "+tn);return [tn,schema.slice(i,j)];
  }));
  for(const field of app.fields){
    const d=field.reviewDecision;
    assert.equal(field.status,"UNVERIFIED");
    assert.equal(d.reviewStatus,"SOURCE_REVIEWED_PROPOSAL_NOT_VERIFIED");
    assert.equal(d.runtimeVerified,false);
    assert.equal(d.consumerVerified,false);
    assert.equal(d.retirementApproved,false);
    assert.ok(d.sourceRationale.length>25);
    assert.ok(d.outstandingProof.length>25);
    for(const ref of d.targetRefs){
      const [tn,col]=ref.split(".");
      assert.ok(blocks[tn]?.includes('("'+col+'"'),
        field.legacyColumn+" absent typed candidate "+ref);
    }
  }
  const byName=Object.fromEntries(app.fields.map(x=>[x.legacyColumn,x.reviewDecision]));
  for(const col of ["resume_url","resume_history","internal_notes","assessment_url"]){
    assert.ok(byName[col].targetRefs.every(ref=>ref.startsWith("placement_application_private_artifacts.")),
      "Sensitive application data may never use broad public application columns: "+col);
  }
  assert.equal(artifacts.DB08.counts.verifiedFields,0);
  assert.equal(artifacts.DB08.gate.fieldsUnverified,280);
});
test("DB08 source proposals fail closed on forged target, false runtime proof, approval or oracle",()=>{
  const mutate=(fn)=>{
    const a=cp(artifacts);
    const offer=a.DB08.tables.find(t=>t.legacyTable==="job_offer").fields[0];
    fn(offer.reviewDecision);
    expects(audit(ledgers,a),"DB08_SOURCE_REVIEW_PROPOSAL_INVALID");
  };
  mutate(d=>{d.targetRefs=["hidden_admin.deleted_secret"];});
  mutate(d=>{d.runtimeVerified=true;});
  mutate(d=>{d.consumerVerified=true;});
  mutate(d=>{d.retirementApproved=true;});
  mutate(d=>{d.frozenLegacyOracleSha="wrong";});
  mutate(d=>{d.sourceRationale="";});
  mutate(d=>{d.outstandingProof="";});
  const fake=cp(artifacts);fake.DB08.tables[0].fields[0].reviewDecision={
    reviewStatus:"SOURCE_REVIEWED_PROPOSAL_NOT_VERIFIED",
    classification:"PROPOSED_ACTIVE_FIELD_MAPPING",targetRefs:["placement_offers.id"],
    sourceRationale:"fake",outstandingProof:"fake",
    frozenLegacyOracleSha:"21bad59d4dfaf2fa11fdeaf9353327ce105697d5",
    runtimeVerified:false,consumerVerified:false,retirementApproved:false,
  };
  expects(audit(ledgers,fake),"DB08_SOURCE_REVIEW_PROPOSAL_INVALID");
});
test("DB08 source type drift cannot be hidden by a plausible field name",()=>{
  const changed=cp(artifacts);
  changed.DB08.tables[0].fields[0].legacyType="wrong";
  expects(audit(ledgers,changed),"REVIEW_FIELD_UNKNOWN_DUPLICATE_OR_TYPE_DRIFT");
});
test("DB10 source family decisions require real persisted evidence before runtime promotion",()=>{
  const changed=cp(artifacts);
  changed.DB10.records[0].status="MAPPED";
  expects(audit(ledgers,changed),"DB10_UNSUPPORTED_FIELD_COMPLETION");
});
test("DB10 overlay cannot fabricate final retirement approval",()=>{
  const changed=cp(db10Overlay);
  changed.records[0].finalDispositionApproved=true;
  expects(audit(ledgers,artifacts,changed),"DB10_CLOSURE_OVERLAY_INVALID_OR_FALSE_APPROVAL");
});
test("missing domain is fail-closed rather than interpreted as zero field gaps",()=>{
  const changed=cp(artifacts);
  delete changed.DB06;
  expects(audit(ledgers,changed),"MISSING_DOMAIN_OR_ARTIFACT");
});

test("DB06 cannot hide an active table by changing its retirement tag",()=>{
  const source=cp(ledgers),review=cp(artifacts);
  source.DB06.tables.find(x=>x.table==="attend").sourceDisposition="RETIREMENT_CANDIDATE_NOT_APPROVED";
  review.DB06.tables=review.DB06.tables.filter(x=>x.legacyTable!=="attend");
  expects(audit(source,review),"DB06_FROZEN_TABLE_DISPOSITION_DRIFT");
});
test("DB06 historical retirement candidate census is immutable",()=>{
  const source=cp(ledgers);
  source.DB06.tables.find(x=>x.table==="assigned_exam").rows.pop();
  expects(audit(source),"DB06_FROZEN_HISTORICAL_CENSUS_DRIFT");
});
test("DB08 lineage cannot lose risk, nullability or source origin",()=>{
  const a=cp(artifacts);a.DB08.tables[0].fields[0].riskFlags=[];
  expects(audit(ledgers,a),"DB08_SOURCE_LINEAGE_METADATA_DRIFT");
  const b=cp(artifacts);b.DB08.tables[0].fields[0].legacyNullable="NULL_ALLOWED";
  expects(audit(ledgers,b),"DB08_SOURCE_LINEAGE_METADATA_DRIFT");
  const c=cp(artifacts);c.DB08.tables[0].fields[0].sourceEvidence="forged";
  expects(audit(ledgers,c),"DB08_SOURCE_LINEAGE_METADATA_DRIFT");
});
test("DB08 exact name candidates must be well-formed and nonduplicate",()=>{
  const a=cp(artifacts);a.DB08.tables[0].fields[0].exactNameCandidatesOnly.push("invented target");
  expects(audit(ledgers,a),"DB08_INVALID_EXACT_NAME_CANDIDATES");
  const b=cp(artifacts),c=b.DB08.tables[0].fields[0].exactNameCandidatesOnly;
  c.push(c[0]);expects(audit(ledgers,b),"DB08_INVALID_EXACT_NAME_CANDIDATES");
});
test("DB10 source decision and review evidence cannot disappear",()=>{
  const a=cp(artifacts);a.DB10.records[0].sourceDisposition="";
  expects(audit(ledgers,a),"DB10_UNSUPPORTED_FIELD_COMPLETION");
  const b=cp(artifacts);b.DB10.records[0].familyReviewEvidence="";
  expects(audit(ledgers,b),"DB10_UNSUPPORTED_FIELD_COMPLETION");
});
