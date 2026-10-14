import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
import {learnerApplicationAttention} from "@/modules/placements/learner-application-attention-model";
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
describe("L14-008 own-college persisted application attention",()=>{
 it("shows own real shortlisted application with scoped detail link",async()=>{
  const f=fixture!;
  const result=await getLearnerPlacementJourney(f.drive.learner.context);
  const serial=JSON.parse(JSON.stringify(result)) as Array<{
    applicationId:string;applicationStatus:string;withdrawnAt:string|null;
    job:{title:string};company:{name:string};screening:{status:string};
  }>;
  const attention=learnerApplicationAttention(serial.map(row=>({
    applicationId:row.applicationId,applicationStatus:row.applicationStatus,
    withdrawnAt:row.withdrawnAt?new Date(row.withdrawnAt):null,
    companyName:row.company.name,jobTitle:row.job.title,
    screening:{status:row.screening.status},
  })));
  expect(attention.rows.some(row=>row.id===f.applicationId &&
    row.detail==="Screening shortlisted")).toBe(true);
 },30000);
 it("denies forged-college, suspended membership and wrong-role identity",async()=>{
  const ctx=fixture!.drive.learner.context;
  const denied:RequestContext[]=[
    {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
    {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
    {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
  ];
  for(const actor of denied)await expect(getLearnerPlacementJourney(actor)).rejects.toBeDefined();
 },30000);
});