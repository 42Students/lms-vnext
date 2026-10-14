import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {listLearnerPlacementJobs} from "@/modules/placements/learner-job-service";
import {filterLearnerPlacementJobs,DEFAULT_LEARNER_JOB_FILTERS}
  from "@/modules/placements/learner-jobs-browse-model";
import {learnerDrivesEmptyState} from "@/modules/placements/learner-drives-empty-state-model";
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
describe("L12-021 authorized learner Drives empty and filtered states",()=>{
  it("uses own persisted published roles to distinguish an empty search from no jobs",async()=>{
    const result=await listLearnerPlacementJobs(owned!.learner.context,new Date("2026-10-14T00:00:00Z"));
    const rows=JSON.parse(JSON.stringify(result)) as Array<{
      job:{id:string;title:string;description:string;applicationDeadline:string|null;publishedAt?:string|null};
      company:{name:string};roleOption:{id:string;title:string;employmentType:string;locations:string[];
        minimumAnnualCtcInr:number|null;maximumAnnualCtcInr:number|null};
      canApply:boolean;deadlinePassed:boolean;
    }>;
    expect(rows.length).toBeGreaterThan(0);
    const filters={...DEFAULT_LEARNER_JOB_FILTERS,search:"no-such-company-"+owned!.ids.company};
    const visible=filterLearnerPlacementJobs(rows,filters);
    expect(visible).toHaveLength(0);
    expect(learnerDrivesEmptyState(rows.length,visible.length,filters))
      .toMatchObject({kind:"FILTERED_OUT",showReset:true});
  },30000);
  it("denies forged-college, suspended and wrong-role readers",async()=>{
    const ctx=owned!.learner.context;
    const deny:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of deny)await expect(listLearnerPlacementJobs(actor)).rejects.toBeDefined();
  },30000);
});