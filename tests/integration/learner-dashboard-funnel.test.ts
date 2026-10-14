import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
import {learnerPlacementApplicationFunnel} from "@/modules/placements/learner-dashboard-funnel-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerAssessmentBrowseFixture,seedLearnerAssessmentBrowseFixture,cleanupLearnerAssessmentBrowseFixture,type LearnerAssessmentBrowseFixture} from "../support/learner-assessment-browse-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerAssessmentBrowseFixture;
beforeEach(async()=>{f=newLearnerAssessmentBrowseFixture();await seedLearnerAssessmentBrowseFixture(pool,f);},45000);
afterEach(async()=>{await cleanupLearnerAssessmentBrowseFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("persisted learner placement funnel stages",()=>{
 it("uses only the own submitted and shortlisted fixture",async()=>{
  const rows=await getLearnerPlacementJourney(f.drive.learner.context);
  const funnel=learnerPlacementApplicationFunnel(rows);
  expect(funnel.total).toBe(1);
  expect(funnel.stages.find(x=>x.key==="shortlisted")?.count).toBe(1);
 },30000);
 it("denies foreign college, role and suspended learner access",async()=>{
  const ctx=f.drive.learner.context;
  await expect(getLearnerPlacementJourney({...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}})).rejects.toBeDefined();
  await expect(getLearnerPlacementJourney({...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}})).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[f.drive.learner.ids.membership]);
  try{await expect(getLearnerPlacementJourney(ctx)).rejects.toBeDefined();}
  finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[f.drive.learner.ids.membership]);}
 },30000);
});
