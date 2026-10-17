import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {listOwnNotifications} from "@/modules/activity/notification-service";
import {requirePersistedLearnerNotificationMembership}
 from "@/modules/activity/learner-notification-membership-service";
import {getOwnLearnerAssessmentBrowse} from "@/modules/placements/learner-assessment-browse-service";
import {resolveOwnAssessmentDeepLink} from "@/modules/placements/learner-assessment-deeplink-model";
import {learnerNotificationAssessmentAction} from "@/modules/activity/learner-notification-assessment-action-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerAssessmentBrowseFixture,seedLearnerAssessmentBrowseFixture,
cleanupLearnerAssessmentBrowseFixture,type LearnerAssessmentBrowseFixture}
from "../support/learner-assessment-browse-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let own:LearnerAssessmentBrowseFixture|null=null,notificationId:string|null=null;
beforeEach(async()=>{
 own=newLearnerAssessmentBrowseFixture();await seedLearnerAssessmentBrowseFixture(pool,own);
 const event=randomUUID();notificationId=randomUUID();
 await pool.query(
 "INSERT INTO activity_events(id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary) VALUES($1,$2,$3,$4,'PLACEMENTS','placements.assessment.test','APPLICATION',$5,'Assessment fixture')",
 [event,SEED_IDS.organization,own.drive.learner.ids.college,SEED_IDS.collegeAdminUser,own.applicationId]);
 await pool.query("INSERT INTO in_app_notifications(id,user_id,event_id,title,body,action_href) VALUES($1,$2,$3,'Assessment available','Open your own round',$4)",
 [notificationId,own.drive.learner.ids.user,event,
  "/learn/my-placements/assessments?applicationId="+own.applicationId+"&roundId="+own.roundId]);
},45000);
afterEach(async()=>{
 const f=own,n=notificationId;own=null;notificationId=null;
 if(n)await pool.query("DELETE FROM in_app_notifications WHERE id=$1",[n]);
 // Keep append-only activity_events. It belongs to the seeded admin actor.
 if(f)await cleanupLearnerAssessmentBrowseFixture(pool,f);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own persisted assessment notification context",()=>{
 it("points only to a real scoped learner assessment",async()=>{
  const f=own!,ctx=f.drive.learner.context;
  const membership=await requirePersistedLearnerNotificationMembership(ctx);
  const notifications=await listOwnNotifications(ctx,{collegeId:membership.collegeId});
  const item=notifications.find(row=>row.notification.id===notificationId);
  expect(item).toBeDefined();
  const action=learnerNotificationAssessmentAction(item?.notification.actionHref);
  expect(action?.label).toBe("Take Assessment");
  const rounds=(await getOwnLearnerAssessmentBrowse(ctx)).rounds;
  expect(resolveOwnAssessmentDeepLink(rounds,{
    applicationId:f.applicationId,roundId:f.roundId,
  })).toEqual({valid:true,key:f.applicationId+":"+f.roundId});
 },30000);
 it("denies forged college, suspension and wrong-role principals",async()=>{
  const ctx=own!.drive.learner.context;
  const denied:RequestContext[]=[
   {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
   {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
   {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
  ];
  for(const actor of denied)await expect(getOwnLearnerAssessmentBrowse(actor)).rejects.toBeDefined();
 },30000);
});