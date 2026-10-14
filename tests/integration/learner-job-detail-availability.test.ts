import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import type {LearnerPlacementJobItem} from "@/components/placements/learner-placement-jobs";
import {closeDatabaseConnection} from "@/db/client";
import {listLearnerPlacementJobs} from "@/modules/placements/learner-job-service";
import {learnerJobAvailabilityBanner} from "@/modules/placements/learner-job-availability-banner-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerDriveReadFixture,seedLearnerDriveReadFixture,
  cleanupLearnerDriveReadFixture,type LearnerDriveReadFixture}
  from "../support/learner-drive-read-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let owned:LearnerDriveReadFixture|null=null;
beforeEach(async()=>{owned=newLearnerDriveReadFixture();await seedLearnerDriveReadFixture(pool,owned);},45000);
afterEach(async()=>{const f=owned;owned=null;if(f)await cleanupLearnerDriveReadFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L13-012 real published drive blocked after deadline",()=>{
  it("shows a closed-state notice from persisted authorized deadline",async()=>{
    const f=owned!;
    const result=await listLearnerPlacementJobs(f.learner.context,new Date("2026-10-20T00:00:00Z"));
    const selected=JSON.parse(JSON.stringify(result.filter(row=>row.job.id===f.ids.olderJob))) as LearnerPlacementJobItem[];
    expect(selected).toHaveLength(1);
    expect(selected[0]?.deadlinePassed).toBe(true);
    expect(learnerJobAvailabilityBanner(selected)?.kind).toBe("CLOSED");
  },30000);
  it("denies forged college, suspended and wrong-role readers",async()=>{
    const ctx=owned!.learner.context;
    const actors:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of actors)await expect(listLearnerPlacementJobs(actor)).rejects.toBeDefined();
  },30000);
});