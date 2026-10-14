import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {listLearnerPlacementJobs} from "@/modules/placements/learner-job-service";
import {filterLearnerPlacementJobs} from "@/modules/placements/learner-jobs-browse-model";
import {readLearnerDriveUrl} from "@/modules/placements/learner-drive-url-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerDriveReadFixture,seedLearnerDriveReadFixture,cleanupLearnerDriveReadFixture,
  type LearnerDriveReadFixture} from "../support/learner-drive-read-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerDriveReadFixture|null=null;
beforeEach(async()=>{fixture=newLearnerDriveReadFixture();await seedLearnerDriveReadFixture(pool,fixture);},45000);
afterEach(async()=>{const owned=fixture;fixture=null;if(owned)await cleanupLearnerDriveReadFixture(pool,owned);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner URL query only filters actual authorized published drives",()=>{
  it("rehydrates search and sort over own persisted authorized roles",async()=>{
    const {learner,ids}=fixture!;
    const rows=await listLearnerPlacementJobs(learner.context,new Date("2026-10-14T00:00:00Z"));
    const snapshot=rows.filter(r=>r.job.id===ids.olderJob||r.job.id===ids.newerJob).map(r=>({
      ...r,job:{...r.job,publishedAt:r.job.publishedAt?.toISOString()??null,
        applicationDeadline:r.job.applicationDeadline?.toISOString()??null},
    }));
    expect(snapshot).toHaveLength(2);
    const state=readLearnerDriveUrl("q=Newer&sort=newest&page=1");
    const shown=filterLearnerPlacementJobs(snapshot,state.filters);
    expect(shown.map(r=>r.job.id)).toEqual([ids.newerJob]);
    expect(readLearnerDriveUrl("q=Older&sort=newest").filters.search).toBe("Older");
    expect(readLearnerDriveUrl("membershipId="+learner.ids.membership).filters.search).toBe("");
  },30000);
  it("never allows a forged, suspended, or wrong-role context to browse persisted drives",async()=>{
    const context=fixture!.learner.context;
    const actors:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of actors)await expect(listLearnerPlacementJobs(actor)).rejects.toBeDefined();
  },30000);
});
