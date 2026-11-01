import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const src=read("docs/planning/db-pass4-columns-db10_shared_operations.json");
const preliminary=read("docs/planning/db019-p30-skills-field-review.json");
const actual=read("docs/planning/db019-p30-skill-field-decisions.json");
const names=new Set(["skills","skill_synonyms","skill_usage"]);
const id=r=>r.sourceField;

function audit(ledger=actual) {
  const errors=[],source=new Map();
  if(ledger.sourceSha!==src.sourceSha||ledger.sourceSha!==preliminary.sourceSha)
    errors.push("ORACLE_DRIFT");
  for(const table of src.tables.filter(t=>names.has(t.table)))
    for(const row of table.rows) {
      const key=table.table+"."+row.legacyColumn;
      if(source.has(key))errors.push("DUPLICATE_SOURCE:"+key);
      source.set(key,row);
    }
  const reviews=new Map(preliminary.fields.map(f=>[f.sourceTable+"."+f.sourceColumn,f]));
  const seen=new Set();
  if(ledger.sourceFieldCount!==15||ledger.fieldDecisions?.length!==15||
     source.size!==15||reviews.size!==15)errors.push("15_FIELD_COUNT_DRIFT");
  for(const field of ledger.fieldDecisions||[]) {
    if(seen.has(id(field)))errors.push("DUPLICATE:"+id(field));
    seen.add(id(field));
    const original=reviews.get(id(field));
    if(!source.has(id(field))||!original||original.sourceDefinition!==field.sourceDefinition||
       original.risk!==field.sourceRisk ||
       !field.engineeringDecision || !field.sourceRationale ||
       !field.producerPath || !field.consumerPath ||
       field.sourceReviewed!==true || field.runtimeVerified!==false ||
       field.fieldGlobalSignoff!==false)errors.push("FALSE_OR_INCOMPLETE_DECISION:"+id(field));
    if(!Array.isArray(field.targetRefs)||!field.targetRefs.length ||
       field.targetRefs.some(t=>! /^(skills|skill_synonyms|skill_usage)\.[a-z_]+$/.test(t)))
      errors.push("INVALID_REGISTERED_TARGET:"+id(field));
    const sourceRefs=original?.proposedTarget?.split(" + ").map(s=>s.trim())||[];
    if(JSON.stringify(field.targetRefs)!==JSON.stringify(sourceRefs))
      errors.push("TARGET_CHANGED_WITHOUT_REVIEW:"+id(field));
  }
  for(const key of source.keys())if(!seen.has(key))errors.push("MISSING_SOURCE:"+key);
  if(ledger.globalP31SignoffOpen!==true||ledger.noLegacyDataImport!==true)
    errors.push("FALSE_GLOBAL_SIGNOFF");
  return errors;
}

test("DB19-P30 exactly 15 source decisions, UUID redesign and independent counter source coverage",()=>{
  assert.deepEqual(audit(),[]);
  assert.equal(actual.fieldDecisions.filter(x=>x.sourceField.endsWith(".usage_count")).length,2);
  assert.notEqual(actual.fieldDecisions.find(x=>x.sourceField==="skill_usage.usage_count").engineeringDecision,
    actual.fieldDecisions.find(x=>x.sourceField==="skills.usage_count").engineeringDecision);
});
test("DB19-P30 fail-closed source mutation: no silent rename, duplicate or fabricated global approval",()=>{
  const changed=structuredClone(actual);
  changed.fieldDecisions[0].sourceField=changed.fieldDecisions[1].sourceField;
  assert.ok(audit(changed).some(x=>x.startsWith("DUPLICATE")));
  const status=structuredClone(actual);
  status.fieldDecisions[1].runtimeVerified=true;
  assert.ok(audit(status).some(x=>x.startsWith("FALSE_OR_INCOMPLETE_DECISION")));
  const signed=structuredClone(actual);signed.globalP31SignoffOpen=false;
  assert.ok(audit(signed).includes("FALSE_GLOBAL_SIGNOFF"));
  const invented=structuredClone(actual);
  invented.fieldDecisions[0].targetRefs=["skills.private_import_password"];
  assert.ok(audit(invented).includes("TARGET_CHANGED_WITHOUT_REVIEW"));
});
