import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
import {listLearnerPlacementJobs} from "@/modules/placements/learner-job-service";
import {ownApplicationJobHref} from "@/modules/placements/learner-application-job-link-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
  cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
  from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerCareerCalendarFixture|null=null;
beforeEach(async()=>{f=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,f);},45000);
afterEach(async()=>{const own=f;f=null;if(own)await cleanupLearnerCareerCalendarFixture(pool,own);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L14-020 own application links to its exact published job",()=>{
  it("resolves application-owned job from persisted same-college read",async()=>{
    const own=f!;
    const journey=await getLearnerPlacementJourney(own.drive.learner.context);
    const app=journey.find(row=>row.applicationId===own.applicationId);
    expect(app?.job.id).toBe(own.drive.ids.newerJob);
    const href=ownApplicationJobHref(app?.job.id);
    expect(href).toBe("/learn/my-placements/jobs/"+own.drive.ids.newerJob);
    const visible=await listLearnerPlacementJobs(own.drive.learner.context);
    expect(visible.some(row=>href?.endsWith(row.job.id))).toBe(true);
  },30000);
  it("denies forged college, suspended and wrong-role contexts",async()=>{
    const context=f!.drive.learner.context;
    const invalid:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of invalid)await expect(getLearnerPlacementJourney(actor)).rejects.toBeDefined();
  },30000);
});
