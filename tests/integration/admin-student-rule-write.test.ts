import {describe,expect,it} from "vitest";
import {randomUUID} from "node:crypto";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,membershipRoles,moduleAccessRules,users} from "@/db/schema";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {getSuperAdminLearnerAccessTrace} from "@/modules/module-access/admin-trace-service";
import type {RequestContext} from "@/modules/identity/context";
import {writeSuperAdminStudentRule} from "@/modules/module-access/admin-student-rule-write";
import {SEED_IDS} from "../../scripts/db-seed-data";
const context:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"test",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null};
describe.skipIf(!process.env.TEST_DATABASE_URL)("Super Admin student rule write boundaries",()=>{
 it("rejects inherited write from non-Super-Admin actors",async()=>{
  await expect(writeSuperAdminStudentRule({...context,user:{...context.user,systemRoles:[]}},SEED_IDS.collegeA,SEED_IDS.learnerCollegeAMembership,{action:"INHERIT",module:"projects",expected:null})).rejects.toBeDefined();
 });
 it("does not permit non-Super-Admin actors",async()=>{
  await expect(writeSuperAdminStudentRule({...context,user:{...context.user,systemRoles:[]}},SEED_IDS.collegeA,SEED_IDS.learnerCollegeAMembership,{action:"SET",module:"projects",enabled:true,locked:false,expected:null})).rejects.toBeDefined();
 });
 it("does not permit locked writes to non-member modules",async()=>{
  await expect(writeSuperAdminStudentRule(context,SEED_IDS.collegeA,SEED_IDS.learnerCollegeAMembership,{action:"SET",module:"placements",enabled:false,locked:true,expected:null})).rejects.toBeDefined();
 });
 it("denies an unauthorized cross-college membership before any edit",async()=>{
  expect(await writeSuperAdminStudentRule(context,SEED_IDS.collegeB,SEED_IDS.learnerCollegeAMembership,{action:"SET",module:"projects",enabled:false,locked:false,expected:null})).toBeNull();
 });
 it("does not mutate unknown or foreign student membership",async()=>{
  expect(await writeSuperAdminStudentRule(context,SEED_IDS.collegeA,randomUUID(),{action:"SET",module:"projects",enabled:false,locked:false,expected:null})).toBeNull();
 });
 it("round-trips Set, Lock and Inherit with persisted audit and stale-write denial",async()=>{
  const db=getDb();
  const userId=randomUUID(),membershipId=randomUUID();
  const key="student-rule-verify-"+randomUUID();
  try{
   await db.insert(users).values({id:userId,identityUid:key,displayName:"Module Rule Test Learner"});
   await db.insert(collegeMemberships).values({id:membershipId,userId,collegeId:SEED_IDS.collegeA,status:"ACTIVE"});
   await db.insert(membershipRoles).values({membershipId,role:"LEARNER"});
   const before=await getSuperAdminLearnerAccessTrace(context,SEED_IDS.collegeA,{membershipId});
   expect(before?.selected).not.toBeNull();
   const module=before?.selected?.modules.some(row=>row.module==="projects"&&row.winnerLocked&&row.winnerLevel!=="MEMBERSHIP")
    ?"electives":"projects";
   const first=await writeSuperAdminStudentRule(context,SEED_IDS.collegeA,membershipId,
    {action:"SET",module,enabled:false,locked:false,expected:null});
   expect(first).toMatchObject({enabled:false,locked:false,unchanged:false});
   const stored=await db.select({enabled:moduleAccessRules.enabled,locked:moduleAccessRules.locked}).from(moduleAccessRules)
    .where(and(eq(moduleAccessRules.scopeType,"MEMBERSHIP"),eq(moduleAccessRules.scopeId,membershipId),eq(moduleAccessRules.module,module)));
   expect(stored).toEqual([{enabled:false,locked:false}]);
   await expect(writeSuperAdminStudentRule(context,SEED_IDS.collegeA,membershipId,
    {action:"SET",module,enabled:true,locked:false,expected:null})).rejects.toMatchObject({code:"STALE_RULE"});
   const locked=await writeSuperAdminStudentRule(context,SEED_IDS.collegeA,membershipId,
    {action:"SET",module,enabled:false,locked:true,expected:{enabled:false,locked:false}});
   expect(locked).toMatchObject({locked:true,unchanged:false});
   const noChange=await writeSuperAdminStudentRule(context,SEED_IDS.collegeA,membershipId,
    {action:"SET",module,enabled:false,locked:true,expected:{enabled:false,locked:true}});
   expect(noChange).toMatchObject({unchanged:true});
   const inherited=await writeSuperAdminStudentRule(context,SEED_IDS.collegeA,membershipId,
    {action:"INHERIT",module,expected:{enabled:false,locked:true}});
   expect(inherited).toMatchObject({enabled:null,unchanged:false});
   const audits=await db.select({id:activityEvents.id}).from(activityEvents)
    .where(and(eq(activityEvents.subjectId,membershipId),
      eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PLATFORM_STUDENT_MODULE_RULE_CHANGED)));
   expect(audits).toHaveLength(3);
  }finally{
   await db.delete(activityEvents).where(eq(activityEvents.subjectId,membershipId));
   await db.delete(moduleAccessRules).where(and(eq(moduleAccessRules.scopeType,"MEMBERSHIP"),eq(moduleAccessRules.scopeId,membershipId)));
   await db.delete(membershipRoles).where(eq(membershipRoles.membershipId,membershipId));
   await db.delete(collegeMemberships).where(eq(collegeMemberships.id,membershipId));
   await db.delete(users).where(eq(users.id,userId));
  }
 });

});
