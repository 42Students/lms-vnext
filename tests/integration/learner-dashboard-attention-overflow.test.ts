import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {learnerPlacementDashboard} from "@/modules/placements/learner-dashboard-model";
import {learnerDashboardPartialState} from "@/modules/placements/learner-dashboard-partial-model";
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
describe("L11-015 own persisted dashboard attention total",()=>{
  it("counts only the real authorized upcoming interview",async()=>{
    const f=fixture!;
    const workspace=await getLearnerPlacementRequestWorkspace(f.drive.learner.context);
    const own=workspace.rounds.filter(row=>row.roundId===f.roundId);
    expect(own).toHaveLength(1);
    const snapshot=learnerPlacementDashboard({
      jobs:[],applications:[],offers:[],
      rounds:own.map(row=>({
        applicationId:row.applicationId,roundId:row.roundId,roundKind:row.roundKind,
        roundName:row.roundName,companyName:row.companyName,roleTitle:row.roleTitle,
        scheduledAt:row.scheduledAt,
        exception:row.exception?{scheduledAt:row.exception.scheduledAt}:null,
      })),
    },new Date("2026-10-14T00:00:00Z"));
    const view=learnerDashboardPartialState({
      jobs:true,journey:true,rounds:true,offers:true,preferences:true,academic:true,
    },snapshot);
    expect(view.attentionTotal).toBe(1);
    expect(view.attentionOverflow).toBe(0);
    expect(view.attention?.[0]?.roundId).toBe(f.roundId);
  },30000);
  it("denies forged college, suspended learner and wrong role",async()=>{
    const ctx=fixture!.drive.learner.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
  },30000);
});
