import {randomUUID} from "node:crypto";
import {describe,it,expect} from "vitest";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {organizations,colleges,moduleAccessRules,activityEvents} from "@/db/schema";
import {OPTIONAL_MODULE_KEYS} from "@/modules/module-access/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {writeSuperAdminCollegeRule} from "@/modules/module-access/admin-college-rule-write";
import {getSuperAdminCollegeFeatureSnapshot} from "@/modules/module-access/admin-college-rule-read";
import {listCollegeFeatureHistory} from "@/modules/module-access/admin-college-rule-history-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"super",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null};
describe.skipIf(!enabled)("Super Admin audited college module write transaction in isolated PostgreSQL",()=>{
 it("supports SET, LOCK, idempotence, optimistic conflict, INHERIT and exact scoped audit",async()=>{
  const db=getDb(),orgId=randomUUID(),collegeId=randomUUID(),id=randomUUID().slice(0,10);
  await db.insert(organizations).values({id:orgId,name:"Feature Test Org "+id});
  try{
   await db.insert(colleges).values({id:collegeId,organizationId:orgId,name:"Feature Test College "+id,code:"FT"+id,status:"ACTIVE"});
   const globalLocks=await db.select({module:moduleAccessRules.module}).from(moduleAccessRules)
    .where(and(eq(moduleAccessRules.scopeType,"GLOBAL"),eq(moduleAccessRules.locked,true)));
   const moduleKey=OPTIONAL_MODULE_KEYS.find(key=>!globalLocks.some(lock=>lock.module===key));
   expect(moduleKey).toBeDefined();
   if(!moduleKey)return;
   expect((await getSuperAdminCollegeFeatureSnapshot(admin,collegeId))?.rules.find(rule=>rule.module===moduleKey)?.stored).toBeNull();
   const first=await writeSuperAdminCollegeRule(admin,collegeId,{action:"SET",module:moduleKey,enabled:false,locked:false,expected:null});
   expect(first).toMatchObject({enabled:false,locked:false,unchanged:false});
   const noop=await writeSuperAdminCollegeRule(admin,collegeId,{action:"SET",module:moduleKey,enabled:false,locked:false,expected:{enabled:false,locked:false}});
   expect(noop).toMatchObject({unchanged:true});
   await expect(writeSuperAdminCollegeRule(admin,collegeId,{action:"SET",module:moduleKey,enabled:true,locked:false,expected:null})).rejects.toMatchObject({code:"STALE_RULE"});
   const lock=await writeSuperAdminCollegeRule(admin,collegeId,{action:"SET",module:moduleKey,enabled:false,locked:true,expected:{enabled:false,locked:false}});
   expect(lock).toMatchObject({locked:true,unchanged:false});
   expect((await getSuperAdminCollegeFeatureSnapshot(admin,collegeId))?.rules.find(rule=>rule.module===moduleKey)?.stored).toEqual({enabled:false,locked:true});
   await expect(writeSuperAdminCollegeRule(admin,collegeId,{action:"INHERIT",module:moduleKey,expected:{enabled:false,locked:true}}))
    .rejects.toMatchObject({code:"LOCAL_LOCKED"});
   const unlock=await writeSuperAdminCollegeRule(admin,collegeId,{action:"SET",module:moduleKey,enabled:false,locked:false,expected:{enabled:false,locked:true}});
   expect(unlock).toMatchObject({enabled:false,locked:false,unchanged:false});
   const inherited=await writeSuperAdminCollegeRule(admin,collegeId,{action:"INHERIT",module:moduleKey,expected:{enabled:false,locked:false}});
   expect(inherited).toMatchObject({enabled:null,locked:false,unchanged:false});
   expect((await getSuperAdminCollegeFeatureSnapshot(admin,collegeId))?.rules.find(rule=>rule.module===moduleKey)?.stored).toBeNull();
   const history=await listCollegeFeatureHistory(admin,collegeId);
   expect(history?.items).toHaveLength(4);
   const events=await db.select({id:activityEvents.id}).from(activityEvents).where(and(
    eq(activityEvents.subjectId,collegeId),eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_MODULE_RULE_CHANGED)));
   expect(events).toHaveLength(4);
   await expect(getSuperAdminCollegeFeatureSnapshot({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}},collegeId)).rejects.toBeDefined();
  }finally{
   await db.delete(activityEvents).where(eq(activityEvents.subjectId,collegeId));
   await db.delete(moduleAccessRules).where(and(eq(moduleAccessRules.scopeType,"COLLEGE"),eq(moduleAccessRules.scopeId,collegeId)));
   await db.delete(colleges).where(eq(colleges.id,collegeId));
   await db.delete(organizations).where(eq(organizations.id,orgId));
  }
 });
});
