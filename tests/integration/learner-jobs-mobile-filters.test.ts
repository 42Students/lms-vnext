import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {listLearnerPlacementJobs} from "@/modules/placements/learner-job-service";
import {readLearnerDriveUrl} from "@/modules/placements/learner-drive-url-model";
import {learnerJobsMobileFilterLabel} from "@/modules/placements/learner-jobs-mobile-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerDriveReadFixture,seedLearnerDriveReadFixture,
cleanupLearnerDriveReadFixture,type LearnerDriveReadFixture} from "../support/learner-drive-read-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let own:LearnerDriveReadFixture|null=null;
beforeEach(async()=>{own=newLearnerDriveReadFixture();await seedLearnerDriveReadFixture(pool,own);},45000);
afterEach(async()=>{const f=own;own=null;if(f)await cleanupLearnerDriveReadFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L12-022 own persisted drives with mobile saved filters",()=>{
it("uses own published rows, restores filter disclosure without hidden identity",async()=>{
const f=own!;const rows=await listLearnerPlacementJobs(f.learner.context,new Date("2026-10-14T00:00:00Z"));
expect(rows.some(r=>r.job.id===f.ids.olderJob)).toBe(true);
expect(learnerJobsMobileFilterLabel(readLearnerDriveUrl("q=engineer&eligible=1").filters))
.toContain("2 active");
},30000);
it("denies forged-college, suspended and wrong-role actor",async()=>{
const ctx=own!.learner.context;const actors:RequestContext[]=[
{...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
{...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
{...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
];
for(const actor of actors)await expect(listLearnerPlacementJobs(actor)).rejects.toBeDefined();
},30000);
});