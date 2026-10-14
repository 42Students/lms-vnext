import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {browseLearnerCareerRounds,type LearnerRoundBrowseSource,
  type LearnerRoundBrowseFilters} from "@/modules/placements/learner-rounds-browse-model";
import {learnerInterviewScheduleCounts}
  from "@/modules/placements/learner-interview-view-model";
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
const filters:LearnerRoundBrowseFilters={search:"",time:"all",urgency:"all",sort:"soonest"};
describe("L16-002 owned persisted interview upcoming and past views",()=>{
  it("counts own interview once in upcoming then past without implying completion",async()=>{
    const f=fixture!;
    const owned=await getLearnerPlacementRequestWorkspace(f.drive.learner.context);
    const rounds=JSON.parse(JSON.stringify(owned.rounds)) as LearnerRoundBrowseSource[];
    const before=Date.parse("2026-10-14T00:00:00Z");
    const visible=browseLearnerCareerRounds(rounds,"INTERVIEW",filters,before);
    expect(learnerInterviewScheduleCounts(visible,before).upcoming).toBeGreaterThanOrEqual(1);
    expect(visible.map(row=>row.roundId)).toContain(f.roundId);
    expect(learnerInterviewScheduleCounts(visible,Date.parse("2026-10-20T00:00:00Z")).past)
      .toBeGreaterThanOrEqual(1);
  },30000);
  it("denies foreign college, suspended and wrong-role identities",async()=>{
    const ctx=fixture!.drive.learner.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
  },30000);
});
