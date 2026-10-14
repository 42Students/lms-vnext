import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerAssessmentBrowse} from "@/modules/placements/learner-assessment-browse-service";
import {learnerAssessmentPastReview} from "@/modules/placements/learner-assessment-past-review-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerAssessmentBrowseFixture,seedLearnerAssessmentBrowseFixture,cleanupLearnerAssessmentBrowseFixture,type LearnerAssessmentBrowseFixture} from "../support/learner-assessment-browse-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerAssessmentBrowseFixture;
beforeEach(async()=>{f=newLearnerAssessmentBrowseFixture();await seedLearnerAssessmentBrowseFixture(pool,f);},45000);
afterEach(async()=>{await cleanupLearnerAssessmentBrowseFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("past own persisted employer schedule",()=>{
 it("uses scheduled own TEST round instead of inventing a result",async()=>{
  const rows=(await getOwnLearnerAssessmentBrowse(f.drive.learner.context)).rounds
   .filter(x=>x.roundId===f.roundId).map(row=>({
    scheduledAt:row.scheduledAt?.toISOString()??null,
    exception:row.exception?{scheduledAt:row.exception.scheduledAt.toISOString()}:null,
   }));
  expect(learnerAssessmentPastReview(rows,Date.parse("2026-10-16T08:00:01Z")).count).toBe(1);
  expect(learnerAssessmentPastReview(rows,Date.parse("2026-10-16T08:00:00Z")).count).toBe(0);
 },30000);
 it("denies forged tenant, wrong role and persisted suspension",async()=>{
  const ctx=f.drive.learner.context;
  await expect(getOwnLearnerAssessmentBrowse({...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}})).rejects.toBeDefined();
  await expect(getOwnLearnerAssessmentBrowse({...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}})).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[f.drive.learner.ids.membership]);
  try{await expect(getOwnLearnerAssessmentBrowse(ctx)).rejects.toBeDefined();}
  finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[f.drive.learner.ids.membership]);}
 },30000);
});
