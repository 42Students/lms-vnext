import {describe,it,expect} from "vitest";
import {and,eq} from "drizzle-orm";
import {activityEvents} from "@/db/schema/activity";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {getDb} from "@/db/client";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {createAnnouncement,deleteAnnouncement,listAnnouncementsForAdmin,restoreAnnouncement,updateAnnouncement} from "@/modules/announcements/service";
import {announcementHistoryCsv} from "@/modules/announcements/admin-csv-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const admin:RequestContext={
 user:{id:SEED_IDS.superAdminUser,identityUid:"db10-announcements-integration",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,
};
describe.skipIf(!enabled)("DB10 announcements registered schema lifecycle (disposable PostgreSQL)",()=>{
 it("persists, edits, resolves version conflicts, soft-deletes and restores within Super Admin scope",async()=>{
  const db=getDb();
  let id:string|undefined;
  try{
   const created=await createAnnouncement(admin,{
    receiverType:"COLLEGE",receiverId:SEED_IDS.collegeA,title:"DB10 integration notice",message:"Scoped test notice",
    scheduledAt:null,expiresAt:null,isPinned:false,publishConsent:true,
   });
   id=created.id;
   expect(created.collegeId).toBe(SEED_IDS.collegeA);
   const receipts=await db.select({id:activityEvents.id,metadata:activityEvents.metadata}).from(activityEvents)
     .where(and(eq(activityEvents.subjectId,created.id),
       eq(activityEvents.subjectType,"announcement"),
       eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_ANNOUNCEMENT_PUBLISHED)));
   expect(receipts).toHaveLength(1);
   expect(receipts[0]?.metadata).toMatchObject({noticeId:created.id,receiverType:"COLLEGE"});
   expect(JSON.stringify(receipts[0]?.metadata)).not.toContain("Scoped test notice");
   const filtered=await listAnnouncementsForAdmin({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}},{
    q:"DB10 integration",receiverType:"COLLEGE",visibility:"LIVE",limit:50,
   });
   expect(filtered.items.map(item=>item.id)).toContain(id);
   expect(announcementHistoryCsv(filtered.items,Date.now())).toContain("DB10 integration notice");
   const excluded=await listAnnouncementsForAdmin({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}},{
    q:"DB10 integration",receiverType:"FACULTY",limit:50,
   });
   expect(excluded.items.map(item=>item.id)).not.toContain(id);
   const notScheduled=await listAnnouncementsForAdmin({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}},{
    q:"DB10 integration",visibility:"SCHEDULED",limit:50,
   });
   expect(notScheduled.items.map(item=>item.id)).not.toContain(id);
   const own=await listAnnouncementsForAdmin({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}}, {limit:100});
   expect(own.items.map(item=>item.id)).toContain(id);
   const foreign=await listAnnouncementsForAdmin({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}}, {limit:100});
   expect(foreign.items.map(item=>item.id)).not.toContain(id);
   const updated=await updateAnnouncement(admin,id,{expectedVersion:created.version,title:"DB10 revised notice",publishConsent:true});
   expect(updated.version).toBe(created.version+1);
   await expect(updateAnnouncement(admin,id,{expectedVersion:created.version,title:"Stale",publishConsent:true}))
    .rejects.toMatchObject({code:"STALE_VERSION"});
   const deleted=await deleteAnnouncement(admin,id,{expectedVersion:updated.version});
   expect(deleted.deletedAt).not.toBeNull();
   const deletedOnly=await listAnnouncementsForAdmin({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}}, {q:"DB10 revised",visibility:"DELETED",limit:50});
   expect(deletedOnly.items.map(item=>item.id)).toContain(id);
   expect((await listAnnouncementsForAdmin({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}},{limit:100})).items.map(item=>item.id)).not.toContain(id);
   await expect(deleteAnnouncement(admin,id,{expectedVersion:updated.version})).resolves.toMatchObject({id,version:deleted.version,deletedAt:deleted.deletedAt});
   const restored=await restoreAnnouncement(admin,id,{expectedVersion:deleted.version});
   expect(restored.deletedAt).toBeNull();
   await expect(restoreAnnouncement(admin,id,{expectedVersion:deleted.version})).resolves.toMatchObject({id,version:restored.version,deletedAt:null});
   await expect(listAnnouncementsForAdmin({...admin,user:{...admin.user,platformStatus:"DISABLED"}},{}))
    .rejects.toMatchObject({code:"FORBIDDEN"});
   await expect(listAnnouncementsForAdmin({...admin,user:{...admin.user,systemRoles:[]}},{}))
    .rejects.toMatchObject({code:"FORBIDDEN"});
  }finally{
   if(id){
    await db.delete(activityEvents).where(and(eq(activityEvents.subjectId,id),eq(activityEvents.subjectType,"announcement")));
    await db.delete(db10Announcements).where(eq(db10Announcements.id,id));
   }
  }
 });
});
