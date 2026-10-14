import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {careerCalendarEvents,careerCalendarPeriod} from "@/modules/placements/learner-career-calendar-model";
import {learnerMobileCareerAgenda} from "@/modules/placements/learner-mobile-career-agenda-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
  cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
  from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture|null=null;
beforeEach(async()=>{fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);},45000);
afterEach(async()=>{const old=fixture;fixture=null;if(old)await cleanupLearnerCareerCalendarFixture(pool,old);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own persisted learner career calendar mobile agenda",()=>{
  it("groups own career events on IST dates in selected month",async()=>{
    const f=fixture!;
    const rows=(await getLearnerPlacementRequestWorkspace(f.drive.learner.context)).rounds;
    const events=careerCalendarEvents(rows.map(row=>({
      ...row,scheduledAt:row.scheduledAt?.toISOString()??null,
      exception:row.exception?{scheduledAt:row.exception.scheduledAt.toISOString()}:null,
    })));
    const month=careerCalendarPeriod(events,"2026-10-17","month");
    const days=learnerMobileCareerAgenda(month.events);
    expect(days.some(day=>day.dayKey==="2026-10-17" &&
      day.events.some(event=>event.roundId===f.roundId))).toBe(true);
  },30000);
  it("rejects forged, suspended and wrong-role learner contexts",async()=>{
    const context=fixture!.drive.learner.context;
    const actors:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of actors)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
  },30000);
});
