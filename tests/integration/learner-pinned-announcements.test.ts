import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {requirePersistedLearnerNotificationMembership} from "@/modules/activity/learner-notification-membership-service";
import {listOwnNotifications} from "@/modules/activity/notification-service";
import {learnerPinnedAnnouncementPreview} from "@/modules/activity/learner-pinned-announcements-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerPlacementWriteFixture,seedLearnerPlacementWriteFixture,cleanupLearnerPlacementWriteFixture,type LearnerPlacementWriteFixture} from "../support/learner-placement-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerPlacementWriteFixture,noticeId:string;
beforeEach(async()=>{
 f=newLearnerPlacementWriteFixture();await seedLearnerPlacementWriteFixture(pool,f);
 const eventId=randomUUID();noticeId=randomUUID();
 await pool.query("INSERT INTO activity_events(id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary) VALUES($1,$2,$3,$4,'PLACEMENTS','placements.notification.fixture','APPLICATION',$5,'Fixture')",
 [eventId,SEED_IDS.organization,f.ids.college,SEED_IDS.collegeAdminUser,f.ids.membership]);
 await pool.query("INSERT INTO in_app_notifications(id,user_id,event_id,title,body,action_href) VALUES($1,$2,$3,'Saved placement update','Owned message',NULL)",
 [noticeId,f.ids.user,eventId]);
},45000);
afterEach(async()=>{
 await pool.query("DELETE FROM in_app_notifications WHERE id=$1",[noticeId]);
 // Immutable activity event retained; its actor is seeded admin, avoid deleting referenced membership/user.
 await cleanupLearnerPlacementWriteFixture(pool,f);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("learner pinned notice never forged from own personal activity",()=>{
 it("persists an own personal record, not a college-pinned announcement",async()=>{
  const ctx=f.context,member=await requirePersistedLearnerNotificationMembership(ctx);
  const rows=await listOwnNotifications(ctx,{collegeId:member.collegeId});
  const found=rows.find(x=>x.notification.id===noticeId);
  expect(found).toBeDefined();
  expect(learnerPinnedAnnouncementPreview([{id:noticeId,title:found!.notification.title,createdAt:found!.notification.createdAt.toISOString(),pinned:true}])).toEqual([]);
 },30000);
 it("denies forged college, wrong role and persisted suspension",async()=>{
  const ctx=f.context;
  await expect(requirePersistedLearnerNotificationMembership({...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}})).rejects.toBeDefined();
  await expect(requirePersistedLearnerNotificationMembership({...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}})).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[f.ids.membership]);
  try{await expect(requirePersistedLearnerNotificationMembership(ctx)).rejects.toBeDefined();}
  finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[f.ids.membership]);}
 },30000);
});
