import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {auditP07,auditP07Checkout} from "../scripts/db019-p07-field-decisions.mjs";

const read=p=>fs.readFileSync(p,"utf8");
const fixtures={
 inventory:JSON.parse(read("docs/planning/db-pass4-columns-db03_groups_and_electives.json")),
 crosswalk:JSON.parse(read("docs/planning/database-parity-db03-79-field-crosswalk.json")),
 decisions:JSON.parse(read("docs/planning/db019-p07-group-elective-field-decisions.json")),
 groupsSchema:read("src/db/schema/groups.ts"),
 electivesSchema:read("src/db/schema/electives.ts"),
};
const evaluate=overrides=>auditP07({...fixtures,...overrides});
const has=(x,code)=>x.errors.some(e=>e.code===code);
test("P07 79 frozen fields have individually reviewable typed schema decisions, never false runtime claims",()=>{
 const result=auditP07Checkout(".");
 assert.deepEqual(result.errors,[]);
 assert.equal(result.sourceFields,79);
 assert.equal(result.decisions,79);
 assert.equal(result.valid,true);
 assert.equal(result.sourceOnly,true);
 assert.equal(result.registeredPostgresExecuted,false);
 assert.equal(result.packageAccepted,false);
});
test("P07 catches invented runtime evidence, missing fields and duplicate source IDs",()=>{
 const decisions=structuredClone(fixtures.decisions);
 decisions.fieldDecisions[0].runtimeVerified=true;
 assert.ok(has(evaluate({decisions}),"P07_MISSING_DECISION_OR_FORGED_PROOF"));
 const changed=structuredClone(fixtures.decisions);
 changed.fieldDecisions.pop();
 assert.ok(has(evaluate({decisions:changed}),"P07_FIELD_DENOMINATOR_DRIFT"));
 const repeated=structuredClone(fixtures.decisions);
 repeated.fieldDecisions[1].sourceField=repeated.fieldDecisions[0].sourceField;
 assert.ok(has(evaluate({decisions:repeated}),"P07_DUPLICATE_OR_INVALID_DECISION"));
});
test("P07 rejects a forged historical actor membership grant or lost class binding",()=>{
 const decisions=structuredClone(fixtures.decisions);
 const actor=decisions.fieldDecisions.find(x=>x.sourceField==="lms_group_member_event.actor_id");
 actor.decision="NORMALIZED_ACTIVE_SCHEMA_FIELD";
 assert.ok(has(evaluate({decisions}),"P07_SOURCE_MEANING_CHANGED"));
 const changed=structuredClone(fixtures.decisions);
 const backed=changed.fieldDecisions.find(x=>x.sourceField==="elective_offering.backed_class_id");
 backed.targetRefs=["elective_offerings.backed_delivery_id"];
 assert.ok(has(evaluate({decisions:changed}),"P07_BACKED_CLASS_REDESIGN_INCOMPLETE"));
});
test("P07 catches missing registered active uniqueness and non-existent physical columns",()=>{
 assert.ok(has(evaluate({
  electivesSchema:fixtures.electivesSchema.replace('elective_offerings_slot_active_course_uq','unregistered_index_name'),
 }),"P07_ACTIVE_COURSE_UNIQUENESS_NOT_GROUNDED"));
 const decisions=structuredClone(fixtures.decisions);
 decisions.fieldDecisions.find(x=>x.sourceField==="lms_group.capacity").targetRefs=["lms_groups.nonexistent"];
 assert.ok(has(evaluate({decisions}),"P07_TYPED_COLUMN_MISSING"));
});
test("P07 refuses a changed legacy oracle while preserving six source table ownership boundaries",()=>{
 const crosswalk=structuredClone(fixtures.crosswalk);crosswalk.legacyOracleSha="0".repeat(40);
 assert.ok(has(evaluate({crosswalk}),"P07_FROZEN_SHA_DRIFT"));
 const decisions=structuredClone(fixtures.decisions);
 decisions.fieldDecisions.find(x=>x.sourceField==="lms_group.name").targetRefs=["elective_slots.name"];
 assert.ok(has(evaluate({decisions}),"P07_CROSS_DOMAIN_TARGET_FORGED"));
});
