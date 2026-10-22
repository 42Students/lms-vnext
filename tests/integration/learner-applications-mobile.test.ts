import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
import {readLearnerApplicationUrl} from "@/modules/placements/learner-application-url-model";
import {learnerApplicationMobileSummary} from "@/modules/placements/learner-applications-mobile-model";
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
describe("L14-024 own persisted application on small screen",()=>{
it("shows authorized application with active bookmarked filters",async()=>{
const f=own!,data=await getLearnerPlacementJourney(f.drive.learner.context);
expect(data.some(row=>row.applicationId===f.applicationId)).toBe(true);
// "In progress" is the default view, so a bookmarked All view is the second facet.
const query=readLearnerApplicationUrl("q=role&view=all");
expect(learnerApplicationMobileSummary({search:query.q,view:query.view,
stage:query.stage,sort:query.sort})).toContain("2 active");
},30000);
it("denies forged college, suspended membership, wrong role",async()=>{
const ctx=own!.drive.learner.context,other:RequestContext[]=[
{...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
{...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
{...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
];
for(const actor of other)await expect(getLearnerPlacementJourney(actor)).rejects.toBeDefined();
},30000);
});