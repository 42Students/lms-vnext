import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  PROJECT_HISTORY_MIGRATIONS,
  auditProjectRegisteredHistory,
  loadProjectRegisteredHistory,
} from "../scripts/db019-project-registered-history.mjs";

const read = file => JSON.parse(fs.readFileSync(new URL("../"+file,import.meta.url),"utf8"));
const review = read("docs/planning/database-parity-db07-field-reconciliation.json");
const journal = read("drizzle/meta/_journal.json");
const sql = Object.fromEntries(PROJECT_HISTORY_MIGRATIONS.map(tag=>
  [tag,fs.readFileSync(new URL("../drizzle/"+tag+".sql",import.meta.url),"utf8")]));
const audit = (a=review,b=journal,c=sql) => auditProjectRegisteredHistory(a,b,c);
const cloned = x => structuredClone(x);
const has = (result,code) => assert.ok(
  result.errors.some(error=>error.code===code),JSON.stringify(result.errors.slice(0,4)));

test("all 51 previously staged DB07 history columns are proven present in journal SQL",()=>{
  const result=loadProjectRegisteredHistory();
  assert.equal(result.valid,true);
  assert.equal(result.registeredColumnMatches,51);
  assert.equal(result.historicallyStagedTables,4);
  assert.equal(result.legacySnapshotFields,12);
  assert.equal(result.missing.length,0);
  assert.equal(result.acceptanceReady,false);
  assert.equal(result.producerConsumerVerified,false);
  assert.equal(result.tenantRuntimeVerified,false);
});
test("missing registered journal entry invalidates all future physical checks",()=>{
  const changed=cloned(journal);
  changed.entries=changed.entries.filter(x=>x.tag!=="0196_lane15_project_change_history");
  has(audit(review,changed), "MIGRATION_MISSING_FROM_JOURNAL_OR_SQL");
});
test("missing required migration SQL fails closed",()=>{
  const changed={...sql};
  delete changed["0091_project_final_delivery"];
  has(audit(review,journal,changed),"MIGRATION_MISSING_FROM_JOURNAL_OR_SQL");
});
test("renamed/missing physical field is not certified through another table",()=>{
  const changed={...sql};
  changed["0218_project_meeting_member_delivery_history"]=
    changed["0218_project_meeting_member_delivery_history"]
      .replace("ADD COLUMN IF NOT EXISTS legacy_feedback text",
        "ADD COLUMN IF NOT EXISTS unrelated_field text");
  has(audit(review,journal,changed),"TARGET_COLUMN_NOT_IN_REGISTERED_MIGRATIONS");
});
test("missing project task comment kind migration cannot silently pass",()=>{
  const changed={...sql};
  changed["0130_project_task_comment_kinds"]=changed["0130_project_task_comment_kinds"]
    .replace(/ADD COLUMN "comment_kind"/,'ADD COLUMN "incorrect_kind"');
  has(audit(review,journal,changed),"TARGET_COLUMN_NOT_IN_REGISTERED_MIGRATIONS");
});
test("legacy review field rewrites require a deliberate new source reconciliation",()=>{
  const changed=cloned(review);
  const table=changed.tables.find(x=>x.legacyTable==="project_delivery_event");
  table.fields.find(x=>x.legacyField==="action").legacyField="forged_new_field";
  has(audit(changed),"HISTORIC_REVIEW_CENSUS_OR_CROSSWALK_DRIFT");
});
test("new field cannot be counted under historic staged source closure",()=>{
  const changed=cloned(review);
  changed.tables.find(x=>x.legacyTable==="project_task_comment").fields.push({
    legacyField:"invented",decision:"TARGET_GAP_ACTIVE_CONCEPT",
    targetRef:"project_task_comments.id",
  });
  has(audit(changed),"HISTORIC_REVIEW_CENSUS_OR_CROSSWALK_DRIFT");
});
test("source status is not promoted to verified by the structural audit",()=>{
  const result=audit();
  assert(result.reviewed.every(x=>x.scope==="REGISTERED_COLUMN_SOURCE_ONLY"||
    x.scope==="LEGACY_SNAPSHOT_COLUMN_ONLY"));
  assert(result.reviewed.some(x=>x.source==="project_delivery_event.actor_id" &&
    x.target==="project_delivery_events.legacy_actor_id" &&
    x.scope==="LEGACY_SNAPSHOT_COLUMN_ONLY"));
});
