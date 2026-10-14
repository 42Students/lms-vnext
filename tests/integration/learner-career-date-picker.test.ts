import { afterAll,afterEach,beforeEach,describe,expect,it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";
import { careerCalendarEvents,careerCalendarPeriod } from "@/modules/placements/learner-career-calendar-model";
import { parseLearnerCareerDate } from "@/modules/placements/learner-career-date-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
  cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture,
} from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture|null=null;
beforeEach(async()=>{fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);},45000);
afterEach(async()=>{const own=fixture;fixture=null;if(own)await cleanupLearnerCareerCalendarFixture(pool,own);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner career calendar direct date picker on persisted rounds",()=>{
  it("loads only own published job interview in an IST-selected date",async()=>{
    const current=fixture!;
    const rows=(await getLearnerPlacementRequestWorkspace(current.drive.learner.context)).rounds;
    const own=rows.filter(row=>row.roundId===current.roundId);
    expect(own).toHaveLength(1);
    const events=careerCalendarEvents(own.map(row=>({
      ...row,scheduledAt:row.scheduledAt?.toISOString()??null,
      exception:row.exception
        ? {scheduledAt:row.exception.scheduledAt.toISOString()} : null,
    })));
    const selected=careerCalendarPeriod(events,parseLearnerCareerDate("2026-10-17")!,"day");
    expect(selected.events.map(e=>e.roundId)).toEqual([current.roundId]);
  },30000);
  it("blocks forged college, suspended membership and wrong role",async()=>{
    const context=fixture!.drive.learner.context;
    const wrong:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of wrong)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
  },30000);
});
