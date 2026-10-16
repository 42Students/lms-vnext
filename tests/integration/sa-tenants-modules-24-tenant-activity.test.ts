import {randomUUID} from "node:crypto";
import {afterAll,describe,it,expect} from "vitest";
import {and,eq,inArray} from "drizzle-orm";
import {getDb,closeDatabaseConnection} from "@/db/client";
import {activityEvents} from "@/db/schema";
import {createCollege,updateCollege,archiveCollege} from "@/modules/colleges/service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const actor:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"sa-tenant-audit-pg",
 platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null};
describe.skipIf(!enabled)("SA-tenants-modules-24 transactional tenant audit",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("persists create/edit/archive events with the real tenant and actor",async()=>{
  const key=randomUUID().slice(0,8);
  const created=await createCollege(actor,{
   organizationId:SEED_IDS.organization,name:"Test audit tenant "+key,code:"AUDIT-"+key,
  });
  await updateCollege(actor,created.id,{name:"Updated audit tenant "+key});
  await archiveCollege(actor,created.id);
  const events=await getDb().select({
   eventType:activityEvents.eventType,actorUserId:activityEvents.actorUserId,
   collegeId:activityEvents.collegeId,summary:activityEvents.summary,
  }).from(activityEvents).where(and(eq(activityEvents.collegeId,created.id),
   inArray(activityEvents.eventType,[
    "platform.college.created","platform.college.updated","platform.college.archived",
   ])));
  expect(events.map(event=>event.eventType).sort()).toEqual([
   "platform.college.archived","platform.college.created","platform.college.updated",
  ]);
  expect(events.every(event=>event.actorUserId===actor.user.id)).toBe(true);
  expect(events.every(event=>event.collegeId===created.id)).toBe(true);
 });
 it("denies a non-super-admin archive without inserting an archived event",async()=>{
  const notAdmin={...actor,user:{...actor.user,systemRoles:[]}};
  await expect(archiveCollege(notAdmin,SEED_IDS.collegeA)).rejects.toBeDefined();
 });
});
