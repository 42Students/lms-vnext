import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import {
  DEFAULT_LEARNER_JOB_FILTERS, filterLearnerPlacementJobs,
} from "@/modules/placements/learner-jobs-browse-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  newLearnerDriveReadFixture, seedLearnerDriveReadFixture, cleanupLearnerDriveReadFixture,
  type LearnerDriveReadFixture,
} from "../support/learner-drive-read-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerDriveReadFixture|null=null;
beforeEach(async()=>{fixture=newLearnerDriveReadFixture();await seedLearnerDriveReadFixture(pool,fixture);},45000);
afterEach(async()=>{const old=fixture;fixture=null;if(old)await cleanupLearnerDriveReadFixture(pool,old);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("newest sort on own persisted drives",()=>{
  it("uses publishedAt and only own-college authorized roles",async()=>{
    const {learner,ids}=fixture!;
    const rows=await listLearnerPlacementJobs(learner.context,new Date("2026-10-14T00:00:00Z"));
    const selected=rows.filter(row=>row.job.id===ids.olderJob||row.job.id===ids.newerJob);
    expect(selected).toHaveLength(2);
    const ordered=filterLearnerPlacementJobs(selected.map(row=>({
      ...row,job:{...row.job,publishedAt:row.job.publishedAt?.toISOString()??null,
        applicationDeadline:row.job.applicationDeadline?.toISOString()??null},
    })),{...DEFAULT_LEARNER_JOB_FILTERS,sort:"newest"});
    expect(ordered.map(row=>row.job.id)).toEqual([ids.newerJob,ids.olderJob]);
  },30000);
  it("denies forged college, suspended membership and wrong role",async()=>{
    const context=fixture!.learner.context;
    const actors:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of actors)await expect(listLearnerPlacementJobs(actor)).rejects.toBeDefined();
  },30000);
});
