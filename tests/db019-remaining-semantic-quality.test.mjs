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
  const changed=cp(artifacts);
  changed.DB08.tables[0].fields[0].reviewDecision="MAPPED";
  expects(audit(ledgers,changed),"DB08_UNSUPPORTED_EXACT_FIELD_MAPPING");
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
