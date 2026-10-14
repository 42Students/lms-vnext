import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
import {learnerApplicationCardActivity} from "@/modules/placements/learner-application-card-activity-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerAssessmentBrowseFixture,seedLearnerAssessmentBrowseFixture,cleanupLearnerAssessmentBrowseFixture,type LearnerAssessmentBrowseFixture} from "../support/learner-assessment-browse-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerAssessmentBrowseFixture;
beforeEach(async()=>{f=newLearnerAssessmentBrowseFixture();await seedLearnerAssessmentBrowseFixture(pool,f);},45000);
afterEach(async()=>{await cleanupLearnerAssessmentBrowseFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("application card from own scoped real status history",()=>{
 it("links only own application history",async()=>{
  const rows=await getLearnerPlacementJourney(f.drive.learner.context);
  const row=rows.find(x=>x.applicationId===f.applicationId)!;
  const summary=learnerApplicationCardActivity({...row,jobTitle:row.job.title,companyName:row.company.name});
  expect(summary.historyHref).toBe("/learn/my-placements/applications/"+f.applicationId+"/history");
  expect(summary.at.getTime()).toBeGreaterThan(0);
 },30000);
 it("denies forged college, wrong role and suspended learner",async()=>{
  const ctx=f.drive.learner.context;
  await expect(getLearnerPlacementJourney({...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}})).rejects.toBeDefined();
  await expect(getLearnerPlacementJourney({...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}})).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[f.drive.learner.ids.membership]);
  try{await expect(getLearnerPlacementJourney(ctx)).rejects.toBeDefined();}
  finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[f.drive.learner.ids.membership]);}
 },30000);
});
