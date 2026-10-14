import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {requirePersistedLearnerNotificationMembership}
  from "@/modules/activity/learner-notification-membership-service";
import {listOwnNotifications} from "@/modules/activity/notification-service";
import {filterLearnerInbox,learnerNotificationInboxQuerySchema}
  from "@/modules/activity/learner-notification-inbox-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,
cleanupLearnerCourseWriteFixture,type LearnerCourseWriteFixture}
  from "../support/learner-course-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let own:LearnerCourseWriteFixture|null=null,notificationId:string|null=null;
beforeEach(async()=>{
  own=newLearnerCourseWriteFixture();await seedLearnerCourseWriteFixture(pool,own);
  const eventId=randomUUID();notificationId=randomUUID();
  await pool.query(
    "INSERT INTO activity_events(id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary) VALUES($1,$2,$3,$4,'COURSES','courses.notification.test','USER',$5,'Own inbox URL fixture')",
    [eventId,SEED_IDS.organization,SEED_IDS.collegeA,SEED_IDS.collegeAdminUser,own.ids.user],
  );
  await pool.query(
    "INSERT INTO in_app_notifications(id,user_id,event_id,title,body) VALUES($1,$2,$3,'Own course announcement','Personal course notification body')",
    [notificationId,own.ids.user,eventId],
  );
},45000);
afterEach(async()=>{
  const f=own,id=notificationId;own=null;notificationId=null;
  if(id)await pool.query("DELETE FROM in_app_notifications WHERE id=$1",[id]);
  // The activity event is append-only; never remove it.
  if(f)await cleanupLearnerCourseWriteFixture(pool,f);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner own persisted notifications obey shareable filters",()=>{
  it("applies course search to authorized personal notifications only",async()=>{
    const ctx=own!.context;
    const membership=await requirePersistedLearnerNotificationMembership(ctx);
    const rows=await listOwnNotifications(ctx,{collegeId:membership.collegeId,limit:60});
    const serial=rows.map(row=>({title:row.notification.title,body:row.notification.body,
      module:row.event.module,readAt:row.notification.readAt?.toISOString()??null}));
    const filters=learnerNotificationInboxQuerySchema.parse({category:"course",q:"announcement",unread:"unread"});
    expect(filterLearnerInbox(serial,filters).some(x=>x.title==="Own course announcement")).toBe(true);
  },30000);
  it("denies forged college, suspended and wrong-role reads",async()=>{
    const ctx=own!.context;
    const invalid:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of invalid)await expect(requirePersistedLearnerNotificationMembership(actor)).rejects.toBeDefined();
  },30000);
});