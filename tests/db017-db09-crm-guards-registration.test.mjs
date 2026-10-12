import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source=readFileSync("drizzle/0045_db09_crm_scope_history_guards.sql","utf8");
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
const prev=JSON.parse(readFileSync("drizzle/meta/0044_snapshot.json","utf8"));
const next=JSON.parse(readFileSync("drizzle/meta/0045_snapshot.json","utf8"));
const functions=["db09_assert_lead_scoped_links","db09_assert_followup_owner_scope","db09_restrict_completed_followup_rewrite","db09_reject_lead_activity_rewrite","db09_assert_activity_actor_scope"];
const triggers=["db09_lead_scoped_links_guard","db09_followup_owner_scope_guard","db09_followup_terminal_guard","db09_lead_activity_immutable","db09_lead_activity_actor_scope_guard"];
test("DB017 migration journal/snapshot chain is additive and intact",()=>{
 assert.equal(journal.entries.find((row)=>row.tag==="0045_db09_crm_scope_history_guards")?.idx,45);
 assert.equal(next.prevId,prev.id);assert.notEqual(next.id,prev.id);
 assert.deepEqual(next.tables,prev.tables);assert.deepEqual(next.enums,prev.enums);
});
test("DB017 registers 5 distinct vetted functions and 5 triggers",()=>{
 for(const f of functions)assert.equal(source.split("CREATE FUNCTION "+f+"()").length-1,1,f);
 for(const t of triggers)assert.equal(source.split("CREATE TRIGGER "+t).length-1,1,t);
 assert.equal(source.split("--> statement-breakpoint").length-1,9);
});
test("DB017 enforces tenant and active-principal scopes",()=>{
 for(const needle of ["m.college_id = NEW.college_id","m.status = 'ACTIVE'","u.platform_status = 'ACTIVE'","r.company_id = v_profile_company","g.status = 'ACTIVE'","NEW.created_by_user_id IS NULL"]) assert.ok(source.includes(needle),needle);
});
test("DB017 makes activity append-only and completed followups terminal",()=>{
 for(const needle of ["BEFORE UPDATE OR DELETE ON placement_tpo_lead_activities","lead activity history is append-only","OLD.done_at IS NOT NULL","NEW.done_at IS NULL","NEW.due_at IS DISTINCT FROM OLD.due_at"])assert.ok(source.includes(needle),needle);
});
test("DB017 has no duplicate tables or destructive DDL",()=>{
 assert.doesNotMatch(source,/\\b(?:DROP TABLE|DROP COLUMN|CREATE TABLE)\\b/i);
});
