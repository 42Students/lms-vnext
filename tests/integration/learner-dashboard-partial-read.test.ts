import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {listLearnerPlacementJobs} from "@/modules/placements/learner-job-service";
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
afterEach(async()=>{const current=fixture;fixture=null;if(current)await cleanupLearnerCareerCalendarFixture(pool,current);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("partial placement dashboard from fresh own-college persisted rows",()=>{
  it("keeps successful own jobs and rounds when an independent source fails",async()=>{
    const ctx=fixture!.drive.learner.context;
    const [jobs,rounds]=await Promise.all([
      listLearnerPlacementJobs(ctx,new Date("2026-10-14T00:00:00Z")),
      getLearnerPlacementRequestWorkspace(ctx),
    ]);
    expect(jobs.length).toBeGreaterThan(0);
    expect(rounds.rounds.some(row=>row.roundId===fixture!.roundId)).toBe(true);
    const snapshot=learnerPlacementDashboard({
      jobs:jobs.map(row=>({jobId:row.job.id,canApply:row.canApply,deadlinePassed:row.deadlinePassed})),
      applications:[],rounds:rounds.rounds.map(row=>({
        applicationId:row.applicationId,roundId:row.roundId,roundKind:row.roundKind,
        roundName:row.roundName,companyName:row.companyName,roleTitle:row.roleTitle,
        scheduledAt:row.scheduledAt,exception:row.exception
          ? {scheduledAt:row.exception.scheduledAt}:null,
      })),offers:[],
    },new Date("2026-10-14T00:00:00Z"));
    const partial=learnerDashboardPartialState({
      jobs:true,journey:false,rounds:true,offers:false,preferences:true,academic:true,
    },snapshot);
    expect(partial.openJobs).toBeGreaterThan(0);
    expect(partial.applications).toBeNull();
    expect(partial.interviews).toBeGreaterThan(0);
    expect(partial.activeOffers).toBeNull();
  },30000);
  it("denies forged college, suspended membership and wrong role",async()=>{
    const ctx=fixture!.drive.learner.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)
      await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
  },30000);
});
