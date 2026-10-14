import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
import {ownApplicationInterviewLinks,
  type OwnApplicationInterviewRound} from "@/modules/placements/learner-application-interview-links-model";
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
describe("L14-019 exact own application interview route from persisted join",()=>{
 it("links only own shortlisted persisted interview to the exact round URL",async()=>{
  const f=fixture!,ctx=f.drive.learner.context;
  const [journey,workspace]=await Promise.all([
    getLearnerPlacementJourney(ctx),getLearnerPlacementRequestWorkspace(ctx),
  ]);
  const client=JSON.parse(JSON.stringify(workspace.rounds)) as OwnApplicationInterviewRound[];
  const links=ownApplicationInterviewLinks(client,"2026-10-14T00:00:00Z");
  expect(journey.some(row=>row.applicationId===f.applicationId)).toBe(true);
  expect(links.find(row=>row.applicationId===f.applicationId)?.href)
    .toBe("/learn/my-placements/interviews?applicationId="+f.applicationId+"&roundId="+f.roundId);
 },30000);
 it("denies forged college, suspended and wrong-role reads",async()=>{
  const ctx=fixture!.drive.learner.context;
  const denied:RequestContext[]=[
    {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
    {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
    {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
  ];
  for(const actor of denied){
    await expect(getLearnerPlacementJourney(actor)).rejects.toBeDefined();
    await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
  }
 },30000);
});
