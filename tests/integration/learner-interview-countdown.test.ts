import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {learnerInterviewCountdown} from "@/modules/placements/learner-interview-countdown-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture|null=null;
beforeEach(async()=>{fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);},45000);
afterEach(async()=>{const f=fixture;fixture=null;if(f)await cleanupLearnerCareerCalendarFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L16-005 owned interview timing",()=>{
it("shows countdown from persisted scheduled instant after JSON serialization",async()=>{
const f=fixture!,workspace=await getLearnerPlacementRequestWorkspace(f.drive.learner.context);
const persisted=workspace.rounds.find(row=>row.roundId===f.roundId);
expect(persisted).toBeDefined();
const row=JSON.parse(JSON.stringify(persisted)) as {
scheduledAt:string|null;durationMinutes?:number|null;};
expect(learnerInterviewCountdown(row,Date.parse("2026-10-16T18:00:00Z")).phase).toBe("UPCOMING");
expect(learnerInterviewCountdown(row,Date.parse("2026-10-18T18:00:00Z")).phase).toBe("PAST");
},30000);
it("denies forged college, suspended membership and wrong role",async()=>{
const ctx=fixture!.drive.learner.context;const denied:RequestContext[]=[
{...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
{...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
{...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
];
for(const actor of denied)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
},30000);
});