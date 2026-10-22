import {randomUUID} from "node:crypto";
import {and,eq,inArray} from "drizzle-orm";
import {describe,expect,it} from "vitest";
import {getDb} from "@/db/client";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {activityEvents} from "@/db/schema/activity";
import {inAppNotifications,membershipRoles} from "@/db/schema";
import {listSuperAdminBroadcastColleges,publishSuperAdminCollegeBroadcast} from "@/modules/announcements/super-admin-college-broadcast-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const admin:RequestContext={user:{id:SEED_IDS.superAdminUser,identityUid:"broadcast-integration",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null};
describe.skipIf(!enabled)("DB10 Super Admin announcement consent and transactional broadcast",()=>{
 it("publishes selected authorized colleges atomically with scoped Activity events",async()=>{
  const db=getDb(),title="Broadcast Test "+randomUUID().slice(0,9);
  // Build the exact audience AFTER the fixture grants are added, never infer
  // eligibility from an unverified seed membership or a forged reviewer list.
  const base={audienceMode:"SELECTED_COLLEGES" as const,
   title,message:"Disposable test announcement",scheduledAt:null,expiresAt:null,isPinned:false,publishConsent:true};
  const noticeIds:string[]=[];
  // Broadcast targets only colleges with an active TPO membership.
  const tpoRoleIds:string[]=[];
  for(const membershipId of [SEED_IDS.facultyCollegeAMembership,SEED_IDS.facultyCollegeBMembership]){
   const [inserted]=await db.insert(membershipRoles).values({membershipId,role:"TPO"})
    .onConflictDoNothing().returning({id:membershipRoles.id});
   if(inserted)tpoRoleIds.push(inserted.id);
  }
  try{
   const eligible=await listSuperAdminBroadcastColleges(admin);
   const selected=eligible.map(row=>row.id).filter(id=>id===SEED_IDS.collegeA||id===SEED_IDS.collegeB);
   expect(selected.length).toBeGreaterThan(0);
   const payload={...base,collegeIds:selected,reviewedCollegeIds:selected};
   await expect(publishSuperAdminCollegeBroadcast(admin,{...payload,publishConsent:false})).rejects.toBeDefined();
   await expect(publishSuperAdminCollegeBroadcast({...admin,user:{...admin.user,systemRoles:[]}},payload)).rejects.toBeDefined();
   await expect(publishSuperAdminCollegeBroadcast({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}},payload)).rejects.toBeDefined();
   const result=await publishSuperAdminCollegeBroadcast(admin,payload);
   noticeIds.push(...result.noticeIds);
   expect(result.count).toBe(selected.length);
   const found=await db.select({id:db10Announcements.id,collegeId:db10Announcements.collegeId}).from(db10Announcements).where(inArray(db10Announcements.id,noticeIds));
   expect(new Set(found.map(row=>row.collegeId))).toEqual(new Set(selected));
   const audits=await db.select({subjectId:activityEvents.subjectId}).from(activityEvents).where(inArray(activityEvents.subjectId,noticeIds));
   expect(audits).toHaveLength(selected.length);
  }finally{
   if(noticeIds.length){
    const events=await db.select({id:activityEvents.id}).from(activityEvents)
     .where(inArray(activityEvents.subjectId,noticeIds));
    if(events.length)await db.delete(inAppNotifications)
     .where(inArray(inAppNotifications.eventId,events.map(event=>event.id)));
    await db.delete(activityEvents).where(inArray(activityEvents.subjectId,noticeIds));
    await db.delete(db10Announcements).where(inArray(db10Announcements.id,noticeIds));
   }
   if(tpoRoleIds.length)await db.delete(membershipRoles).where(inArray(membershipRoles.id,tpoRoleIds));
  }
 });
});