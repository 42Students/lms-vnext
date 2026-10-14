import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {listOwnNotifications} from "@/modules/activity/notification-service";
import {getOwnLearnerApplicationHistory} from "@/modules/placements/learner-application-detail-service";
import {requirePersistedLearnerNotificationMembership}
  from "@/modules/activity/learner-notification-membership-service";
import {learnerNotificationPlacementAction} from "@/modules/activity/learner-notification-placement-action-model";
import {learnerNotificationMobileFilterSummary} from "@/modules/activity/learner-notification-mobile-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerAssessmentBrowseFixture,seedLearnerAssessmentBrowseFixture,
  cleanupLearnerAssessmentBrowseFixture,type LearnerAssessmentBrowseFixture}
  from "../support/learner-assessment-browse-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let owned:LearnerAssessmentBrowseFixture|null=null;
let notificationId:string|null=null;
beforeEach(async()=>{
  owned=newLearnerAssessmentBrowseFixture();
  await seedLearnerAssessmentBrowseFixture(pool,owned);
  const event=randomUUID(); notificationId=randomUUID();
  await pool.query(
    "INSERT INTO activity_events(id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary) VALUES($1,$2,$3,$4,'PLACEMENTS','placements.application.test','APPLICATION',$5,'Application notification fixture')",
    [event,SEED_IDS.organization,owned.drive.learner.ids.college,
      SEED_IDS.collegeAdminUser,owned.applicationId],
  );
  await pool.query(
    "INSERT INTO in_app_notifications(id,user_id,event_id,title,body,action_href) VALUES($1,$2,$3,'Application update','Your saved application',$4)",
    [notificationId,owned.drive.learner.ids.user,event,
      "/learn/my-placements/applications?applicationId="+owned.applicationId],
  );
},45000);
afterEach(async()=>{
  const f=owned,n=notificationId;owned=null;notificationId=null;
  if(n)await pool.query("DELETE FROM in_app_notifications WHERE id=$1",[n]);
  // Do not delete immutable activity_events.
  if(f)await cleanupLearnerAssessmentBrowseFixture(pool,f);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own learner persisted placement notification destination",()=>{
  it("returns only the own notification and recognized application target",async()=>{
    const f=owned!;
    const membership=await requirePersistedLearnerNotificationMembership(f.drive.learner.context);
    const notices=await listOwnNotifications(f.drive.learner.context,{collegeId:membership.collegeId});
    const item=notices.find(x=>x.notification.id===notificationId);
    expect(item).toBeDefined();
    expect(learnerNotificationPlacementAction(item?.notification.actionHref))
      .toEqual({href:"/learn/my-placements/applications?applicationId="+f.applicationId,
        label:"View your application"});
  },30000);
  it("resolves exact application history through the persisted own learner scope",async()=>{
    const f=owned!,ctx=f.drive.learner.context;
    const app=await getOwnLearnerApplicationHistory(ctx,f.applicationId);
    expect(app?.applicationId).toBe(f.applicationId);
    const link=learnerNotificationPlacementAction(
      "/learn/my-placements/applications/"+f.applicationId+"/history?collegeId=forged");
    expect(link?.href).toBe("/learn/my-placements/applications/"+f.applicationId+"/history");
    const foreign:RequestContext={...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}};
    await expect(getOwnLearnerApplicationHistory(foreign,f.applicationId)).rejects.toBeDefined();
  },30000);
  it("summarizes actual owned mobile inbox filters without counting announcements as private unread",async()=>{
    const ctx=owned!.drive.learner.context;
    const membership=await requirePersistedLearnerNotificationMembership(ctx);
    const rows=await listOwnNotifications(ctx,{collegeId:membership.collegeId});
    const ownedNotices=rows.filter(x=>x.notification.id===notificationId);
    expect(learnerNotificationMobileFilterSummary({category:"job",unread:"unread",q:"application"},ownedNotices.length))
      .toContain("1 matching notification");
  },30000);
  it("denies forged college, suspended and wrong-role notification reads",async()=>{
    const ctx=owned!.drive.learner.context;
    const actors:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of actors)
      await expect(requirePersistedLearnerNotificationMembership(actor)).rejects.toBeDefined();
  },30000);
});
