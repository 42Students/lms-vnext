import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerAssessmentBrowse} from "@/modules/placements/learner-assessment-browse-service";
import {learnerAssessmentLinkState} from "@/modules/placements/learner-assessment-link-state-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerAssessmentBrowseFixture,seedLearnerAssessmentBrowseFixture,cleanupLearnerAssessmentBrowseFixture,type LearnerAssessmentBrowseFixture} from "../support/learner-assessment-browse-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerAssessmentBrowseFixture;
beforeEach(async()=>{fixture=newLearnerAssessmentBrowseFixture();await seedLearnerAssessmentBrowseFixture(pool,fixture);},45000);
afterEach(async()=>{await cleanupLearnerAssessmentBrowseFixture(pool,fixture);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("scoped employer assessment link state",()=>{
 it("uses only real owned TEST round and its persisted URL",async()=>{
  await pool.query("UPDATE placement_job_rounds SET test_url=$1 WHERE id=$2",["https://exam.example.test/start",fixture.roundId]);
  const data=await getOwnLearnerAssessmentBrowse(fixture.drive.learner.context);
  const own=data.rounds.find(row=>row.roundId===fixture.roundId);
  expect(own).toBeDefined();
  expect(learnerAssessmentLinkState({testUrl:own!.testUrl})).toBe("READY");
 },30000);
 it("denies foreign-college, wrong-role and persisted suspension",async()=>{
  const ctx=fixture.drive.learner.context;
  await expect(getOwnLearnerAssessmentBrowse({...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}})).rejects.toBeDefined();
  await expect(getOwnLearnerAssessmentBrowse({...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}})).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[fixture.drive.learner.ids.membership]);
  try{await expect(getOwnLearnerAssessmentBrowse(ctx)).rejects.toBeDefined();}
  finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[fixture.drive.learner.ids.membership]);}
 },30000);
});
