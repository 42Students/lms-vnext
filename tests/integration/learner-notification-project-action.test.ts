import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {requirePersistedLearnerNotificationMembership} from "@/modules/activity/learner-notification-membership-service";
import {learnerNotificationProjectAction} from "@/modules/activity/learner-notification-project-action-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,cleanupLearnerCourseWriteFixture,type LearnerCourseWriteFixture} from "../support/learner-course-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCourseWriteFixture;
beforeEach(async()=>{fixture=newLearnerCourseWriteFixture();await seedLearnerCourseWriteFixture(pool,fixture);},45000);
afterEach(async()=>{await cleanupLearnerCourseWriteFixture(pool,fixture);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("project notification source actor",()=>{
 it("accepts an owned persisted learner and strips forged selectors",async()=>{
  const ctx=fixture.context;
  expect((await requirePersistedLearnerNotificationMembership(ctx)).id).toBe(fixture.ids.membership);
  expect(learnerNotificationProjectAction(
    "/learn/projects/"+fixture.ids.course+"?tab=board&collegeId=forged"
  )).toEqual({href:"/learn/projects/"+fixture.ids.course+"?tab=board",label:"View project board"});
  // A UUID in a notification is not evidence of access to any project instance.
 },30000);
 it("denies suspended, foreign college and wrong-role notification actors",async()=>{
  const ctx=fixture.context;
  const invalid:RequestContext[]=[
    {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
    {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
  ];
  for(const actor of invalid)await expect(requirePersistedLearnerNotificationMembership(actor)).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[fixture.ids.membership]);
  try{await expect(requirePersistedLearnerNotificationMembership(ctx)).rejects.toBeDefined();}
  finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[fixture.ids.membership]);}
 },30000);
});
