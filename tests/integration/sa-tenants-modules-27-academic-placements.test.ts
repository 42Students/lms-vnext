import {describe,it,expect,afterAll} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {readDescendantRule,writeDescendantRule} from "@/modules/module-access/admin-descendant-rule-write";
import {AuthorizationError} from "@/modules/permissions/policy";
import {ZodError} from "zod";
import {SEED_IDS} from "../../scripts/db-seed-data";
import type {RequestContext} from "@/modules/identity/context";
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"sa-descendant-pg",platformStatus:"ACTIVE",
 systemRoles:["SUPER_ADMIN"]},membership:null};
describe.skipIf(!process.env.TEST_DATABASE_URL)("SA-tenants-modules-27 academic policy Postgres scope",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("reads owned department rules, denies a forged selected tenant",async()=>{
  const result=await readDescendantRule(admin,SEED_IDS.collegeA,"DEPARTMENT",SEED_IDS.departmentA,"placements");
  expect(result?.scopeId).toBe(SEED_IDS.departmentA);
  await expect(readDescendantRule({...admin,adminScope:{
   organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB,
  }},SEED_IDS.collegeA,"DEPARTMENT",SEED_IDS.departmentA,"placements")).rejects.toBeDefined();
  const foreign=await readDescendantRule(admin,SEED_IDS.collegeB,"DEPARTMENT",SEED_IDS.departmentA,"placements");
  expect(foreign).toBeNull();
 });
 it("rejects mutation to foreign academic node before any write",async()=>{
  // The new college-wide placement policy rejects descendant writes before
  // resolving any scope. Other descendant modules still return a masked null
  // for foreign-college nodes, and never write a foreign rule.
  await expect(writeDescendantRule(admin,SEED_IDS.collegeB,{
   scopeType:"DEPARTMENT",scopeId:SEED_IDS.departmentA,module:"placements",
   action:"SET",enabled:true,locked:false,expected:null,
  })).rejects.toBeInstanceOf(ZodError);
  await expect(writeDescendantRule(admin,SEED_IDS.collegeB,{
   scopeType:"DEPARTMENT",scopeId:SEED_IDS.departmentA,module:"projects",
   action:"SET",enabled:true,locked:false,expected:null,
  })).resolves.toBeNull();
  await expect(writeDescendantRule({...admin,user:{...admin.user,systemRoles:[]}},
   SEED_IDS.collegeA,{
    scopeType:"DEPARTMENT",scopeId:SEED_IDS.departmentA,module:"projects",
    action:"SET",enabled:true,locked:false,expected:null,
   })).rejects.toBeInstanceOf(AuthorizationError);
 });
});
