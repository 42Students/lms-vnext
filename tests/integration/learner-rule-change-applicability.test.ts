import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerPlacementRulesView}
  from "@/modules/placements/learner-placement-rules-service";
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
describe("L19-005 placement rule-change applicability from persisted own membership",()=>{
  it("counts own submitted placement application without manufacturing a rule version",async()=>{
    const result=await getOwnLearnerPlacementRulesView(f!.drive.learner.context,{from:"drives"});
    expect(result.back.href).toBe("/learn/my-placements/jobs");
    expect(result.ruleApplicability.submittedCount).toBe(1);
    expect(result.ruleApplicability.message).toContain("cannot determine");
    expect(result.ruleApplicability.message).not.toContain("effective from");
  },30000);
  it("denies foreign college, suspension and wrong role",async()=>{
    const ctx=f!.drive.learner.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)
      await expect(getOwnLearnerPlacementRulesView(actor,{})).rejects.toBeDefined();
  },30000);
});
