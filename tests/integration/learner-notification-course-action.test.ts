import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {listLearnerCourseDeliveries} from "@/modules/courses/learner-course-service";
import {learnerNotificationCourseAction} from "@/modules/activity/learner-notification-course-action-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,cleanupLearnerCourseWriteFixture,type LearnerCourseWriteFixture} from "../support/learner-course-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCourseWriteFixture;
beforeEach(async()=>{fixture=newLearnerCourseWriteFixture();await seedLearnerCourseWriteFixture(pool,fixture);},45000);
afterEach(async()=>{await cleanupLearnerCourseWriteFixture(pool,fixture);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner course notification target",()=>{
 it("links to a real enrolled own course, removing forged tenant query",async()=>{
  const ctx=fixture.context;
  const courses=await listLearnerCourseDeliveries(ctx,{includeHistorical:true});
  expect(courses.some(c=>c.deliveryId===fixture.ids.delivery)).toBe(true);
  expect(learnerNotificationCourseAction("/learn/courses/"+fixture.ids.delivery+"?collegeId=other"))
    .toEqual({href:"/learn/courses/"+fixture.ids.delivery,label:"View course"});
 },30000);
 it("denies forged college, suspended membership and wrong role",async()=>{
  const ctx=fixture.context;
  const actors:RequestContext[]=[
    {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
    {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
  ];
  for(const actor of actors)await expect(listLearnerCourseDeliveries(actor,{includeHistorical:true})).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[fixture.ids.membership]);
  try{await expect(listLearnerCourseDeliveries(ctx,{includeHistorical:true})).rejects.toBeDefined();}
  finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[fixture.ids.membership]);}
 },30000);
});
