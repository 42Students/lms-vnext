import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
import {learnerApplicationStageCounts} from "@/modules/placements/learner-application-stage-chips-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture} from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture|null=null;
beforeEach(async()=>{fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);},45000);
afterEach(async()=>{const f=fixture;fixture=null;if(f)await cleanupLearnerCareerCalendarFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own-college persisted application stage chips",()=>{
 it("shows only own shortlisted application without an invented count",async()=>{
  const f=fixture!;
  const rows=await getLearnerPlacementJourney(f.drive.learner.context);
  const own=rows.filter(row=>row.applicationId===f.applicationId);
  expect(learnerApplicationStageCounts(own.map(row=>({
    applicationId:row.applicationId,companyName:row.company.name,jobTitle:row.job.title,
    applicationStatus:row.applicationStatus,submittedAt:row.submittedAt,
    withdrawnAt:row.withdrawnAt,screening:row.screening,results:row.results,
  })))).toEqual([
   {stage:"all",count:1},{stage:"SHORTLISTED",count:1},
  ]);
 },30000);
 it("rejects forged college, suspension, wrong role",async()=>{
  const ctx=fixture!.drive.learner.context;
  const invalid:RequestContext[]=[
   {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
   {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
   {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
  ];
  for(const actor of invalid)await expect(getLearnerPlacementJourney(actor)).rejects.toBeDefined();
 },30000);
});