import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import { learnerDriveAvailabilityCounts,filterLearnerPlacementJobs,
  DEFAULT_LEARNER_JOB_FILTERS } from "@/modules/placements/learner-jobs-browse-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  newLearnerDriveReadFixture,seedLearnerDriveReadFixture,cleanupLearnerDriveReadFixture,
  type LearnerDriveReadFixture,
} from "../support/learner-drive-read-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerDriveReadFixture|null=null;
beforeEach(async()=>{fixture=newLearnerDriveReadFixture();await seedLearnerDriveReadFixture(pool,fixture);},45000);
afterEach(async()=>{const f=fixture;fixture=null;if(f)await cleanupLearnerDriveReadFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner published drive grouping, own persisted college",()=>{
  it("marks published own roles as closed after their real stored deadlines",async()=>{
    const {learner,ids}=fixture!;
    const rows=await listLearnerPlacementJobs(learner.context,new Date("2026-10-20T00:00:00Z"));
    const own=JSON.parse(JSON.stringify(rows.filter(r=>r.job.id===ids.olderJob||r.job.id===ids.newerJob))) as unknown as Parameters<typeof learnerDriveAvailabilityCounts>[0][number][];
    expect(own).toHaveLength(2);
    expect(learnerDriveAvailabilityCounts(own)).toMatchObject({
      all:2,open:0,closed:2,
    });
    expect(filterLearnerPlacementJobs(own,{
      ...DEFAULT_LEARNER_JOB_FILTERS,availability:"closed",
    })).toHaveLength(2);
    expect(filterLearnerPlacementJobs(own,{
      ...DEFAULT_LEARNER_JOB_FILTERS,availability:"open",
    })).toHaveLength(0);
  },30000);
  it("requires own active learner membership for every read",async()=>{
    const context=fixture!.learner.context;
    const bad:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of bad)await expect(listLearnerPlacementJobs(actor)).rejects.toBeDefined();
  },30000);
});
