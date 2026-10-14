import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {learnerInterviewMobileSummary} from "@/modules/placements/learner-interview-mobile-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
  cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
  from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerCareerCalendarFixture|null=null;
beforeEach(async()=>{f=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,f);},45000);
afterEach(async()=>{const old=f;f=null;if(old)await cleanupLearnerCareerCalendarFixture(pool,old);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L16-019 mobile interview actions backed by own persisted round",()=>{
  it("summarizes authorized interview time with IST midnight correctly",async()=>{
    const own=f!,data=await getLearnerPlacementRequestWorkspace(own.drive.learner.context);
    const persisted=data.rounds.find(row=>row.roundId===own.roundId);
    expect(persisted).toBeDefined();
    const serialized=JSON.parse(JSON.stringify({
      scheduledAt:persisted!.scheduledAt,approvedScheduledAt:persisted!.exception?.scheduledAt??null,
    })) as {scheduledAt:string|null;approvedScheduledAt:string|null};
    const text=learnerInterviewMobileSummary(serialized);
    expect(text).toContain("17 Oct");
    expect(text).toContain("IST");
    expect(text).not.toContain("completed");
  },30000);
  it("denies forged college, suspended and wrong-role readers",async()=>{
    const ctx=f!.drive.learner.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
  },30000);
});
