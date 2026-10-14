import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerAssessmentOverview} from "@/modules/courses/learner-assessment-service";
import {learnerAssignmentMobileState} from "@/modules/courses/learner-assignment-mobile-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerMobileAssessmentFixture,seedLearnerMobileAssessmentFixture,
  cleanupLearnerMobileAssessmentFixture,type LearnerMobileAssessmentFixture}
  from "../support/learner-mobile-assessment-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerMobileAssessmentFixture|null=null;
beforeEach(async()=>{fixture=newLearnerMobileAssessmentFixture();await seedLearnerMobileAssessmentFixture(pool,fixture);},45000);
afterEach(async()=>{const f=fixture;fixture=null;if(f)await cleanupLearnerMobileAssessmentFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L6-023 own persisted mobile assignment overview",()=>{
  it("renders private newly published assignment without a fabricated submission",async()=>{
    const f=fixture!;
    const overview=await getLearnerAssessmentOverview(f.course.context);
    const own=overview.assignments.find(row=>row.id===f.assignmentId);
    expect(own).toBeDefined();
    // Server Date -> client ISO serialization, as done by the real route.
    const serialized=JSON.parse(JSON.stringify(own)) as {
      submissionId:string|null;gradePublished:boolean;dueAt:string|null;submittedAt:string|null;
    };
    expect(learnerAssignmentMobileState({
      submissionId:serialized.submissionId,
      gradePublished:serialized.gradePublished,
      dueAt:serialized.dueAt,
      submittedAt:serialized.submittedAt,
    },Date.now()).label).toBe("Not submitted");
  },30000);
  it("rejects forged college, suspended membership and wrong role",async()=>{
    const ctx=fixture!.course.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getLearnerAssessmentOverview(actor)).rejects.toBeDefined();
  },30000);
});
