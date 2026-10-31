import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const sql=readFileSync("drizzle/0328_db014_activity_identity_immutable.sql","utf8");
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
test("DB014 registered actor, tenant, event identity guard is fail-closed",()=>{
 assert.ok(journal.entries.some(e=>e.tag==="0328_db014_activity_identity_immutable"));
 assert.match(sql,/CREATE FUNCTION db14_activity_event_identity_immutable\(\)/);
 assert.match(sql,/CREATE TRIGGER db14_activity_event_identity_immutable_guard/);
 assert.match(sql,/BEFORE UPDATE OF/);
 assert.match(sql,/ON activity_events/);
 assert.match(sql,/USING ERRCODE='23514'/);
 for(const column of [
  "organization_id","college_id","actor_user_id","actor_membership_id",
  "module","event_type","subject_type","subject_id","dedupe_key",
  "occurred_at","actor_role_snapshot","actor_name_snapshot"
 ])assert.ok(sql.includes("NEW."+column+" IS DISTINCT FROM OLD."+column),
   "Audit identity not immutable: "+column);
 // Delivery state changes use metadata, not trusted identity.
 assert.doesNotMatch(sql,/NEW\.metadata IS DISTINCT FROM OLD\.metadata/);
 assert.doesNotMatch(sql,/BEFORE UPDATE OF[^;]*metadata/);
 assert.match(sql,/RETURN NEW;/);
});
