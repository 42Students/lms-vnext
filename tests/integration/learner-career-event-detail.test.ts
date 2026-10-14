import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {careerCalendarEvents} from "@/modules/placements/learner-career-calendar-model";
import {findOwnCareerCalendarEvent,learnerCareerCalendarEventTarget}
  from "@/modules/placements/learner-career-event-detail-model";
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
describe("career calendar event detail, persisted scoped own learner",()=>{
  it("opens only a real persisted owned event with an exact interview deep link",async()=>{
    const f=fixture!;
    const rows=(await getLearnerPlacementRequestWorkspace(f.drive.learner.context)).rounds;
    const events=careerCalendarEvents(rows.map(row=>({
      ...row,scheduledAt:row.scheduledAt?.toISOString()??null,
      exception:row.exception?{scheduledAt:row.exception.scheduledAt.toISOString()}:null,
    })));
    const detail=findOwnCareerCalendarEvent(events,f.applicationId+":"+f.roundId);
    expect(detail?.roundId).toBe(f.roundId);
    expect(learnerCareerCalendarEventTarget(detail!)).toContain("roundId="+f.roundId);
    expect(findOwnCareerCalendarEvent(events,randomUUID()+":"+f.roundId)).toBeNull();
  },30000);
  it("denies foreign-college, suspended, wrong-role requests",async()=>{
    const ctx=fixture!.drive.learner.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
  },30000);
});
