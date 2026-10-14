import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
import {learnerApplicationJourneyTimeline}
  from "@/modules/placements/learner-application-journey-timeline-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
  cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
  from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture|null=null;
beforeEach(async()=>{
  fixture=newLearnerCareerCalendarFixture();
  await seedLearnerCareerCalendarFixture(pool,fixture);
},45000);
afterEach(async()=>{
  const f=fixture;fixture=null;
  if(f)await cleanupLearnerCareerCalendarFixture(pool,f);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own application timeline from persisted journey",()=>{
  it("projects saved submission and screening times of the learner own application",async()=>{
    const f=fixture!;
    const own=(await getLearnerPlacementJourney(f.drive.learner.context))
      .find(x=>x.applicationId===f.applicationId);
    expect(own).toBeDefined();
    const timeline=learnerApplicationJourneyTimeline(own!);
    expect(timeline.some(x=>x.label==="Application submitted")).toBe(true);
    expect(timeline.some(x=>x.label==="Screening: shortlisted")).toBe(true);
    expect(timeline.every(x=>x.at instanceof Date)).toBe(true);
  },30000);
  it("denies foreign college, suspended and wrong-role principal",async()=>{
    const ctx=fixture!.drive.learner.context;
    const others:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of others)
      await expect(getLearnerPlacementJourney(actor)).rejects.toBeDefined();
  },30000);
});
