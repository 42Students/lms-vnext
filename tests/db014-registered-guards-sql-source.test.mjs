import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const sql=readFileSync("drizzle/0318_db014_cross_domain_event_guards.sql","utf8");
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));

test("DB014 0318 registered PLpgSQL functions have balanced, valid dollar quoted bodies",()=>{
 assert.ok(journal.entries.some(x=>x.tag==="0318_db014_cross_domain_event_guards"),"0318 registered guard must remain in immutable journal");
 assert.equal((sql.match(/CREATE OR REPLACE FUNCTION db14_/g)||[]).length,3);
 // Tagged SQL dollar delimiters must balance. Named tags are intentional:
 // the Drizzle migrator splits on "--> statement-breakpoint" and plain $
 // can be accidentally rewritten or reinterpreted by migration tooling.
 for(const tag of [
  "db14_activity_event_scope",
  "db14_notification_recipient_scope",
  "db14_group_member_event_scope",
 ]){
  assert.equal(sql.split("AS $" + tag + "$").length - 1,1,tag+" opening");
  assert.equal(sql.split("\n$" + tag + "$;").length - 1,1,tag+" terminator");
 }
 assert.doesNotMatch(sql,/^\$;$/m);
 assert.equal((sql.match(/CREATE TRIGGER db14_/g)||[]).length,3);
 for(const name of [
  "db14_activity_event_scope_guard",
  "db14_notification_recipient_scope_guard",
  "db14_group_member_event_scope_guard",
 ])assert.match(sql,new RegExp("CREATE TRIGGER "+name+"\\b"));
});
test("DB014 registration refuses existing rows without an audited source preflight",()=>{
 assert.match(sql,/LOCK TABLE activity_events,in_app_notifications,lms_group_member_events/);
 assert.match(sql,/EXISTS \(SELECT 1 FROM activity_events LIMIT 1\)/);
 assert.match(sql,/EXISTS \(SELECT 1 FROM in_app_notifications LIMIT 1\)/);
 assert.match(sql,/EXISTS \(SELECT 1 FROM lms_group_member_events LIMIT 1\)/);
 assert.match(sql,/ERRCODE='23514'/);
 assert.doesNotMatch(sql,/DISABLE TRIGGER|DROP CONSTRAINT|TRUNCATE/i);
});
