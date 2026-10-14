import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {markAllOwnLearnerNotificationsRead}
from "@/modules/activity/learner-notification-read-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,
cleanupLearnerCourseWriteFixture,type LearnerCourseWriteFixture}
from "../support/learner-course-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let own:LearnerCourseWriteFixture|null=null,noticeId:string|null=null;
beforeEach(async()=>{
  own=newLearnerCourseWriteFixture();await seedLearnerCourseWriteFixture(pool,own);
  noticeId=randomUUID();const eventId=randomUUID();
  await pool.query(
    "INSERT INTO activity_events(id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary) VALUES($1,$2,$3,$4,'COURSES','courses.notification.test','USER',$5,'Mark all fixture')",
    [eventId,SEED_IDS.organization,SEED_IDS.collegeA,SEED_IDS.collegeAdminUser,own.ids.user],
  );
  await pool.query(
    "INSERT INTO in_app_notifications(id,user_id,event_id,title,body) VALUES($1,$2,$3,'Own unread alert','Mark all personal')",
    [noticeId,own.ids.user,eventId],
  );
},45000);
afterEach(async()=>{
  const f=own;own=null;
  if(noticeId)await pool.query("DELETE FROM in_app_notifications WHERE id=$1",[noticeId]);
  noticeId=null;if(f)await cleanupLearnerCourseWriteFixture(pool,f);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner personal read-all acknowledgment at own college",()=>{
  it("sets a persisted readAt exactly once and retries are idempotent",async()=>{
    const ctx=own!.context;
    expect(await markAllOwnLearnerNotificationsRead(ctx)).toBe(1);
    expect(await markAllOwnLearnerNotificationsRead(ctx)).toBe(0);
    const row=await pool.query<{read_at:Date|null}>(
      "SELECT read_at FROM in_app_notifications WHERE id=$1",[noticeId]);
    expect(row.rows[0]?.read_at).toBeInstanceOf(Date);
  },30000);
  it("denies forged-college, suspended membership and wrong role",async()=>{
    const ctx=own!.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(markAllOwnLearnerNotificationsRead(actor)).rejects.toBeDefined();
  },30000);
});