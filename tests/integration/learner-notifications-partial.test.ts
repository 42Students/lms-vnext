import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {requirePersistedLearnerNotificationMembership}
 from "@/modules/activity/learner-notification-membership-service";
import {listOwnNotifications} from "@/modules/activity/notification-service";
import {learnerNotificationLoadStatus}
 from "@/modules/activity/learner-notifications-partial-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,
 cleanupLearnerCourseWriteFixture,type LearnerCourseWriteFixture}
 from "../support/learner-course-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let own:LearnerCourseWriteFixture|null=null;
let notificationId:string|null=null;
beforeEach(async()=>{
 own=newLearnerCourseWriteFixture();
 await seedLearnerCourseWriteFixture(pool,own);
 const eventId=randomUUID();
 notificationId=randomUUID();
 await pool.query(
  "INSERT INTO activity_events(id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary) VALUES($1,$2,$3,$4,'COURSES','courses.notification.test','USER',$5,'Notification fixture')",
  [eventId,SEED_IDS.organization,SEED_IDS.collegeA,SEED_IDS.collegeAdminUser,own.ids.user],
 );
 await pool.query(
  "INSERT INTO in_app_notifications(id,user_id,event_id,title,body) VALUES($1,$2,$3,'Personal course update','Read source is healthy')",
  [notificationId,own.ids.user,eventId],
 );
},45000);
afterEach(async()=>{
 const f=own,id=notificationId;own=null;notificationId=null;
 if(id)await pool.query("DELETE FROM in_app_notifications WHERE id=$1",[id]);
 // activity_events is append-only: intentionally retain the event, never delete it.
 if(f)await cleanupLearnerCourseWriteFixture(pool,f);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own personal notifications survive independent announcement failure",()=>{
 it("preserves personal persisted notification and marks source partial, not empty",async()=>{
  const f=own!;
  const member=await requirePersistedLearnerNotificationMembership(f.context);
  const rows=await listOwnNotifications(f.context,{collegeId:member.collegeId,limit:60});
  expect(rows.some(row=>row.notification.id===notificationId)).toBe(true);
  expect(learnerNotificationLoadStatus({
    announcementsEnabled:true,announcementsFailed:true,personalReady:true,
  }).state).toBe("PARTIAL");
 },30000);
 it("denies forged college, suspended membership and wrong-role context",async()=>{
  const ctx=own!.context;const denied:RequestContext[]=[
   {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
   {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
   {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
  ];
  for(const actor of denied)await expect(requirePersistedLearnerNotificationMembership(actor)).rejects.toBeDefined();
 },30000);
});