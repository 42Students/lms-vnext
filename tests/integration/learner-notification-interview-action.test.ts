import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {resolveOwnInterviewDeepLink} from "@/modules/placements/learner-interview-deeplink-model";
import {learnerNotificationPlacementAction} from "@/modules/activity/learner-notification-placement-action-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture} from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture;
beforeEach(async()=>{fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);},45000);
afterEach(async()=>{await cleanupLearnerCareerCalendarFixture(pool,fixture);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner interview notification exact persisted destination",()=>{
 it("accepts only the current owned interview and never a forged round",async()=>{
  const ctx=fixture.drive.learner.context;
  const workspace=await getLearnerPlacementRequestWorkspace(ctx);
  const action=learnerNotificationPlacementAction(
   "/learn/my-placements/interviews?applicationId="+fixture.applicationId+"&roundId="+fixture.roundId+"&collegeId=foreign");
  expect(action?.label).toBe("View interview details");
  expect(resolveOwnInterviewDeepLink(workspace.rounds, {
   applicationId:fixture.applicationId,roundId:fixture.roundId
  })).toEqual({valid:true,key:fixture.applicationId+":"+fixture.roundId});
  expect(resolveOwnInterviewDeepLink(workspace.rounds, {
   applicationId:fixture.applicationId,roundId:SEED_IDS.collegeB
  })).toEqual({valid:false});
 },30000);
 it("denies foreign-college, suspended, and wrong-role source reads",async()=>{
   const ctx=fixture.drive.learner.context;
   const actors:RequestContext[]=[
    {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
    {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
   ];
   for(const actor of actors)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
   await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[fixture.drive.learner.ids.membership]);
   try{await expect(getLearnerPlacementRequestWorkspace(ctx)).rejects.toBeDefined();}
   finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[fixture.drive.learner.ids.membership]);}
 },30000);
});
