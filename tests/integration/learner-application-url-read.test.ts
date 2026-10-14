import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
import {readLearnerApplicationUrl} from "@/modules/placements/learner-application-url-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let own:LearnerCareerCalendarFixture|null=null;
beforeEach(async()=>{own=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,own);},45000);
afterEach(async()=>{const f=own;own=null;if(f)await cleanupLearnerCareerCalendarFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own application URL cannot select another learner",()=>{
it("returns persisted member-owned application despite caller filter",async()=>{
const f=own!;const rows=await getLearnerPlacementJourney(f.drive.learner.context);
const query=readLearnerApplicationUrl("view=progress&applicationId="+f.applicationId);
expect(rows.rows.some(row=>row.applicationId===query.applicationId)).toBe(true);
},30000);
it("denies forged college, suspended account, wrong role",async()=>{
const ctx=own!.drive.learner.context;
const denied:RequestContext[]=[
{...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
{...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
{...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
];
for(const actor of denied)await expect(getLearnerPlacementJourney(actor)).rejects.toBeDefined();
},30000);
});