import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerAssessmentOverview} from "@/modules/courses/learner-assessment-service";
import {learnerQuizMobileState} from "@/modules/courses/learner-quiz-mobile-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerMobileAssessmentFixture,seedLearnerMobileAssessmentFixture,
  cleanupLearnerMobileAssessmentFixture,type LearnerMobileAssessmentFixture}
  from "../support/learner-mobile-assessment-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerMobileAssessmentFixture|null=null;
beforeEach(async()=>{fixture=newLearnerMobileAssessmentFixture();await seedLearnerMobileAssessmentFixture(pool,fixture);},45000);
afterEach(async()=>{const own=fixture;fixture=null;if(own)await cleanupLearnerMobileAssessmentFixture(pool,own);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L7-018 mobile quiz from own published PostgreSQL rows",()=>{
  it("counts persisted own attempts without fabricating results",async()=>{
    const own=fixture!;
    const data=await getLearnerAssessmentOverview(own.course.context);
    const match=data.quizzes.find(row=>row.id===own.quizId);
    expect(match).toBeDefined();
    const serialized=JSON.parse(JSON.stringify(match)) as {
      status:"PUBLISHED"|"CLOSED";resultsPublished:boolean;
      attemptsUsed:number;attemptsRemaining:number;maxAttempts:number;dueAt:string|null;
    };
    expect(learnerQuizMobileState(serialized,data.snapshotNowMs))
      .toMatchObject({label:"Ready to attempt",detail:"2 of 2 attempts remaining"});
  },30000);
  it("blocks forged college, suspended learner and non-learner reads",async()=>{
    const ctx=fixture!.course.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getLearnerAssessmentOverview(actor)).rejects.toBeDefined();
  },30000);
});
