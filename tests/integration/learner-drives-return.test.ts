import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {listLearnerPlacementJobs} from "@/modules/placements/learner-job-service";
import {learnerJobDetailFromDrivesHref,learnerJobReturnToDrivesHref}
  from "@/modules/placements/learner-drives-return-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerDriveReadFixture,seedLearnerDriveReadFixture,
  cleanupLearnerDriveReadFixture,type LearnerDriveReadFixture}
  from "../support/learner-drive-read-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerDriveReadFixture|null=null;
beforeEach(async()=>{f=newLearnerDriveReadFixture();await seedLearnerDriveReadFixture(pool,f);},45000);
afterEach(async()=>{const own=f;f=null;if(own)await cleanupLearnerDriveReadFixture(pool,own);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L13-015 scoped published job return navigation",()=>{
  it("uses a persisted authorized job and restores only its prior browse filters",async()=>{
    const own=f!,rows=await listLearnerPlacementJobs(own.learner.context);
    expect(rows.map(r=>r.job.id)).toContain(own.ids.newerJob);
    const detail=learnerJobDetailFromDrivesHref(own.ids.newerJob,"q=engineer&page=2");
    const saved=new URL(detail!,"https://lms.invalid").searchParams.get("back");
    expect(learnerJobReturnToDrivesHref(saved)).toBe("/learn/my-placements/jobs?q=engineer&page=2");
  },30000);
  it("denies forged college, suspension and non-learner role",async()=>{
    const ctx=f!.learner.context;
    const denials:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denials)await expect(listLearnerPlacementJobs(actor)).rejects.toBeDefined();
  },30000);
});
