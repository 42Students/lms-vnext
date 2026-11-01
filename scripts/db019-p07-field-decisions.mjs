#!/usr/bin/env node
// P07 source decisions are necessary but never sufficient for PG17 semantic signoff.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

export const FROZEN_LEGACY_SHA="21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const TABLES=Object.freeze({
  elective_offering:{count:12,target:"elective_offerings",module:"electives"},
  elective_slot:{count:15,target:"elective_slots",module:"electives"},
  lms_group:{count:20,target:"lms_groups",module:"groups"},
  lms_group_member:{count:13,target:"lms_group_members",module:"groups"},
  lms_group_member_event:{count:11,target:"lms_group_member_events",module:"groups"},
  lms_group_rule:{count:8,target:"lms_group_rules",module:"groups"},
});
const CLASSES=new Set([
  "NORMALIZED_ACTIVE_SCHEMA_FIELD","REDESIGNED_BACKED_CLASS_SCOPE",
  "REDESIGNED_SOFT_DELETE","DERIVED_UNIQUE_CONSTRAINT",
  "PERSISTED_UNTRUSTED_HISTORIC_ROLE_SNAPSHOT",
  "RESOLVED_AUTHENTICATED_UUID_IDENTITY",
]);
const isString=x=>typeof x==="string" && x.trim().length>0;
export function auditP07({inventory,crosswalk,decisions,groupsSchema,electivesSchema}) {
  const errors=[];
  const fail=(code,id)=>errors.push({code,...(id?{id}:{})});
  if(inventory?.sourceSha!==FROZEN_LEGACY_SHA||
      crosswalk?.legacyOracleSha!==FROZEN_LEGACY_SHA ||
      decisions?.sourceSha!==FROZEN_LEGACY_SHA)fail("P07_FROZEN_SHA_DRIFT");
  const src=new Map();
  for(const [name,shape] of Object.entries(TABLES)){
    const original=(inventory?.tables||[]).filter(t=>t.table===name);
    if(original.length!==1||original[0]?.rows?.length!==shape.count){
      fail("P07_SOURCE_TABLE_COUNT_DRIFT",name);continue;
    }
    for(const r of original[0].rows){
      const id=name+"."+r.legacyColumn;
      if(src.has(id))fail("P07_DUPLICATE_SOURCE_FIELD",id);
      src.set(id,r);
    }
  }
  const proposals=new Map();
  for(const row of crosswalk?.fields||[]){
    if(proposals.has(row.legacyColumn))fail("P07_DUPLICATE_CROSSWALK_FIELD",row.legacyColumn);
    proposals.set(row.legacyColumn,row);
  }
  if(src.size!==79 || proposals.size!==79 || decisions?.fieldDecisions?.length!==79 ||
    decisions?.sourceFieldCount!==79||decisions?.sourceTableCount!==6)
    fail("P07_FIELD_DENOMINATOR_DRIFT");
  const seen=new Set();
  for(const row of decisions?.fieldDecisions||[]){
    const id=row.sourceField; const original=src.get(id),candidate=proposals.get(id);
    if(!isString(id)||seen.has(id)){fail("P07_DUPLICATE_OR_INVALID_DECISION",id);continue;}
    seen.add(id);
    if(!original||!candidate||row.legacySqlType!==candidate.legacyType ||
       row.legacyMigrationSource!==candidate.legacySource ||
       row.proposedKind!==candidate.kind ||
       !CLASSES.has(row.decision)||
       !isString(row.sourceRationale)||!isString(row.tenantBoundary)||
       !isString(row.producerPath)||!isString(row.consumerPath)||
       row.sourceReviewed!==true||
       row.physicalTargetVerified!==false||
       row.producerConsumerVerified!==false||
       row.runtimeVerified!==false ||
       !Array.isArray(row.targetRefs)||!row.targetRefs.length)
      fail("P07_MISSING_DECISION_OR_FORGED_PROOF",id);
    const tableName=id?.split(".")[0];
    const shape=TABLES[tableName];
    const module=shape==="undefined"?null:shape?.module;
    if(!module || !row.producerPath.startsWith("src/modules/"+(module==="electives"?"electives/":"groups/"))||
       !row.consumerPath.startsWith("src/modules/"+(module==="electives"?"electives/":"groups/")))
      fail("P07_PRODUCER_CONSUMER_SCOPE_DRIFT",id);
    const expected= {
      DIRECT_SOURCE_NAME_MATCH:"NORMALIZED_ACTIVE_SCHEMA_FIELD",
      SEMANTIC_REDESIGN:"REDESIGNED_BACKED_CLASS_SCOPE",
      SOFT_DELETE_TIMESTAMP:"REDESIGNED_SOFT_DELETE",
      DERIVED_UNIQUE_INDEX:"DERIVED_UNIQUE_CONSTRAINT",
      HISTORICAL_SNAPSHOT_PERSISTED:"PERSISTED_UNTRUSTED_HISTORIC_ROLE_SNAPSHOT",
      IDENTITY_REDESIGN:"RESOLVED_AUTHENTICATED_UUID_IDENTITY",
    }[candidate?.kind];
    if(row.decision!==expected)fail("P07_SOURCE_MEANING_CHANGED",id);
    // The source backing class is redesigned into a modern delivery AND an
    // optional group-backed offering; a copy of the old numeric ID is insufficient.
    if(id==="elective_offering.backed_class_id" && (
      row.targetRefs.length!==2||
      !row.targetRefs.includes("elective_offerings.backed_delivery_id") ||
      !row.targetRefs.includes("elective_offerings.backed_class_offering_id")))
      fail("P07_BACKED_CLASS_REDESIGN_INCOMPLETE",id);
    // The active_course_key field was a generated partial-uniqueness aid.
    if(id==="elective_offering.active_course_key"){
      if(row.targetRefs.length!==1||
         row.targetRefs[0]!=="elective_offerings_slot_active_course_uq"||
         !/uniqueIndex\("elective_offerings_slot_active_course_uq"\)/.test(electivesSchema)||
         !electivesSchema.includes('\\"status\\" = \'ACTIVE\' AND \\"deleted_at\\" IS NULL'))
        fail("P07_ACTIVE_COURSE_UNIQUENESS_NOT_GROUNDED",id);
      continue;
    }
    for(const ref of row.targetRefs){
      const [target,column,...extra]=String(ref).split(".");
      if(extra.length || target!==shape?.target){
        fail("P07_CROSS_DOMAIN_TARGET_FORGED",id);continue;
      }
      const schema=shape.module==="electives"?electivesSchema:groupsSchema;
      const opening=new RegExp("pgTable\\(\\s*[\"']"+target+"[\"']");
      const match=opening.exec(schema);
      if(!match){fail("P07_TYPED_TABLE_MISSING",id);continue;}
      const next=schema.indexOf("export const ",match.index+match[0].length);
      const section=schema.slice(match.index,next<0?undefined:next);
      const physical=new RegExp('(?:uuid|integer|bigint|varchar|boolean|jsonb|timestamp|text)\\([\"\']'+column+'[\"\']');
      if(!physical.test(section))fail("P07_TYPED_COLUMN_MISSING",id);
    }
  }
  for(const id of src.keys())if(!seen.has(id))fail("P07_SOURCE_FIELD_NOT_DISPOSITIONED",id);
  return {valid:errors.length===0,sourceFields:src.size,decisions:seen.size,
    sourceOnly:true,registeredPostgresExecuted:false,packageAccepted:false,errors};
}
export function auditP07Checkout(root){
  const read=p=>fs.readFileSync(path.join(root,p),"utf8");
  return auditP07({
    inventory:JSON.parse(read("docs/planning/db-pass4-columns-db03_groups_and_electives.json")),
    crosswalk:JSON.parse(read("docs/planning/database-parity-db03-79-field-crosswalk.json")),
    decisions:JSON.parse(read("docs/planning/db019-p07-group-elective-field-decisions.json")),
    groupsSchema:read("src/db/schema/groups.ts"),
    electivesSchema:read("src/db/schema/electives.ts"),
  });
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=auditP07Checkout(path.resolve(process.argv[2]||"."));
 console.log(JSON.stringify(result,null,2));
 if(!result.valid)process.exitCode=2;
}
