import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const sql=readFileSync("drizzle/0046_db09_recruiter_grant_company_integrity.sql","utf8");
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
const a=JSON.parse(readFileSync("drizzle/meta/0045_snapshot.json","utf8"));
const b=JSON.parse(readFileSync("drizzle/meta/0046_snapshot.json","utf8"));
test("0046 registered after 0045 and snapshot remains structurally unchanged",()=>{
 assert.equal(journal.entries.at(-1).tag,"0046_db09_recruiter_grant_company_integrity");
 assert.equal(b.prevId,a.id);assert.notEqual(b.id,a.id);assert.deepEqual(b.tables,a.tables);assert.deepEqual(b.enums,a.enums);
});
test("0046 exact three guard functions and triggers, independently split",()=>{
 const fns=["db09_assert_grant_same_company","db09_reject_recruiter_profile_company_reassign","db09_reject_granted_relationship_company_reassign"];const triggers=["db09_recruiter_grant_company_guard","db09_recruiter_profile_company_guard","db09_granted_relationship_company_guard"];
 for(const name of fns)assert.equal(sql.split("CREATE FUNCTION "+name+"(").length-1,1,name);
 for(const name of triggers)assert.equal(sql.split("CREATE TRIGGER "+name).length-1,1,name);
 assert.equal(sql.split("--> statement-breakpoint").length-1,5);
});
test("0046 locks both company parents and rejects cross-company grants",()=>{
 for(const x of ["v_profile_company <> v_relationship_company","FROM placement_recruiter_profiles p","FROM placement_company_relationships r","FOR SHARE","db09_grant_company_consistent","NEW.company_id IS DISTINCT FROM OLD.company_id","db09_relationship_grant_company_immutable","db09_recruiter_profile_grant_company_immutable"])assert.ok(sql.includes(x),x);
});
test("0046 no destructive DDL and no duplicated parent table creation",()=>{assert.doesNotMatch(sql,/\\b(DROP TABLE|CREATE TABLE|TRUNCATE)\\b/i)});
