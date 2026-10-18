import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";

const src=()=>readFileSync("src/modules/people/college-import-history-service.ts","utf8");
const college="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const active:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"m",collegeId:college,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};

describe("College Admin student import history tenant and expiry controls",()=>{
 it("COL-people-history-ACTOR-01 reads only 20 per page in a transaction locked to persisted admin rights",()=>{
  const s=src();
  expect(s).toContain('z.coerce.number().int().min(1).max(500).parse(raw??1)');
  const tx=s.indexOf("getDb().transaction(async tx=>");
  const actor=s.indexOf('assertPersistedPlatformPermission(tx,ctx,"people.manage"');
  const select=s.indexOf("return tx.select({");
  expect(tx).toBeGreaterThan(-1);
  expect(actor).toBeGreaterThan(tx);
  expect(select).toBeGreaterThan(actor);
  expect(s).toContain("eq(activityEvents.collegeId,member.collegeId)");
  expect(s).toContain('eq(activityEvents.eventType,"IDENTITY_COLLEGE_STUDENT_CSV_IMPORT")');
  expect(s).toContain(".limit(21).offset((page-1)*20)");
  expect(s).toContain("hasNext:rows.length>20");
 });

 it("COL-people-history-ACCESS-01 expired or foreign admins cannot view another college's import receipts",()=>{
  expect(can(active,"people.manage",{collegeId:college,organizationId:org})).toBe(true);
  const target={collegeId:"22222222-2222-4222-8222-222222222222",organizationId:org};
  expect(can(active,"people.manage",target)).toBe(false);
  for(const disabled of [
   {...active,user:{...active.user,platformStatus:"DISABLED" as const}},
   {...active,membership:{...active.membership!,status:"SUSPENDED" as const}},
   {...active,membership:{...active.membership!,roles:["FACULTY" as const]}},
  ])expect(can(disabled,"people.manage",{collegeId:college,organizationId:org})).toBe(false);
 });
});
