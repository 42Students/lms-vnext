import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const sql=readFileSync("drizzle/0329_db014_group_history_actor_grants.sql","utf8");
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
test("DB014 group actor-role guard is registered, role-scoped and lock-backed",()=>{
 assert.ok(journal.entries.some(e=>e.tag==="0329_db014_group_history_actor_grants"));
 assert.match(sql,/CREATE TRIGGER db14_group_history_actor_grant_guard/);
 assert.match(sql,/BEFORE INSERT OR UPDATE OF/);
 assert.match(sql,/ON lms_group_member_events/);
 for(const fragment of ["system_roles","membership_roles","college_memberships",
  "platform_status","cm.status","owner_kind","group_college",
  "FOR SHARE OF u,sr","FOR SHARE OF u,cm,mr","NEW.actor_type='SYSTEM'",
  "NEW.actor_type='SUPER_ADMIN'","NEW.actor_user_id IS NULL"])
   assert.ok(sql.includes(fragment),"missing actor role guard "+fragment);
 assert.match(sql,/USING ERRCODE='23514'/);
 assert.match(sql,/RETURN NEW;/);
});
