import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getLearnerPlacementJourneyWithActivity} from "@/modules/placements/learner-recent-placement-activity-service";
import {listLearnerPlacementJobs} from "@/modules/placements/learner-job-service";
import {learnerPlacementDashboard} from "@/modules/placements/learner-dashboard-model";
import {learnerPlacementOnboardingSteps} from "@/modules/placements/learner-onboarding-steps-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerDriveReadFixture,seedLearnerDriveReadFixture,cleanupLearnerDriveReadFixture,type LearnerDriveReadFixture} from "../support/learner-drive-read-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerDriveReadFixture;
beforeEach(async()=>{fixture=newLearnerDriveReadFixture();await seedLearnerDriveReadFixture(pool,fixture);},45000);
afterEach(async()=>{await cleanupLearnerDriveReadFixture(pool,fixture);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("learner placements onboarding from persisted scoped history",()=>{
  it("offers onboarding when its own fresh learner has published drives but zero applications",async()=>{
    const context=fixture.learner.context;
    const [jobs,journey]=await Promise.all([listLearnerPlacementJobs(context),getLearnerPlacementJourneyWithActivity(context)]);
    expect(journey.rows).toHaveLength(0);
    const dashboard=learnerPlacementDashboard({
      jobs:jobs.map(row=>({jobId:row.job.id,deadlinePassed:row.deadlinePassed,canApply:row.canApply})),
      applications:journey.rows.map(row=>({applicationId:row.applicationId,applicationStatus:row.applicationStatus,screeningStatus:row.screening.status})),
      rounds:[],offers:[],
    },new Date("2026-10-14T00:00:00Z"));
    expect(dashboard.firstRun).toBe(true);
    expect(learnerPlacementOnboardingSteps(dashboard.firstRun,true)).toHaveLength(3);
  },30000);
  it("denies foreign college, suspended own membership and wrong role",async()=>{
    const context=fixture.learner.context;
    const foreign:RequestContext={...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}};
    const wrong:RequestContext={...context,membership:{...context.membership!,roles:["TPO"]}};
    await expect(getLearnerPlacementJourneyWithActivity(foreign)).rejects.toBeDefined();
    await expect(getLearnerPlacementJourneyWithActivity(wrong)).rejects.toBeDefined();
    await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[fixture.learner.ids.membership]);
    try{await expect(getLearnerPlacementJourneyWithActivity(context)).rejects.toBeDefined();}
    finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[fixture.learner.ids.membership]);}
  },30000);
});
