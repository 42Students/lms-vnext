import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
import {learnerApplicationLatestActivity} from "@/modules/placements/learner-applications-browse-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerAssessmentBrowseFixture,seedLearnerAssessmentBrowseFixture,cleanupLearnerAssessmentBrowseFixture,type LearnerAssessmentBrowseFixture} from "../support/learner-assessment-browse-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let own:LearnerAssessmentBrowseFixture;
beforeEach(async()=>{own=newLearnerAssessmentBrowseFixture();await seedLearnerAssessmentBrowseFixture(pool,own);},45000);
afterEach(async()=>{await cleanupLearnerAssessmentBrowseFixture(pool,own);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner application persisted recent activity",()=>{
 it("uses scoped submission as recorded activity when no withdrawal exists",async()=>{
  const journey=await getLearnerPlacementJourney(own.drive.learner.context);
  const row=journey.find(x=>x.applicationId===own.applicationId);
  expect(row).toBeDefined();
  expect(learnerApplicationLatestActivity({...row!,jobTitle:row!.job.title,companyName:row!.company.name})).toBeGreaterThan(0);
 },30000);
 it("rejects foreign-college, suspended and wrong-role journey access",async()=>{
  const ctx=own.drive.learner.context;
  const actors:RequestContext[]=[
    {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
    {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
  ];
  for(const actor of actors)await expect(getLearnerPlacementJourney(actor)).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[own.drive.learner.ids.membership]);
  try{await expect(getLearnerPlacementJourney(ctx)).rejects.toBeDefined();}
  finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[own.drive.learner.ids.membership]);}
 },30000);
});
