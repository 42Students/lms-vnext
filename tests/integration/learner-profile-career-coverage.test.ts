import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerProfileWithRuntime} from "@/modules/people/runtime";
import {getOwnLearnerAcademicSummary} from "@/modules/people/learner-academic-summary-service";
import {learnerProfileChecklist} from "@/modules/people/learner-profile-checklist";
import {learnerProfileCareerCoverage} from "@/modules/people/learner-profile-career-coverage-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,
cleanupLearnerCourseWriteFixture,type LearnerCourseWriteFixture}
from "../support/learner-course-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCourseWriteFixture|null=null;
beforeEach(async()=>{
  fixture=newLearnerCourseWriteFixture();
  await seedLearnerCourseWriteFixture(pool,fixture);
  await pool.query("INSERT INTO learner_profiles(membership_id,profile_document) VALUES($1,$2::jsonb)",[
    fixture.ids.membership,JSON.stringify({headline:"Own persisted profile"}),
  ]);
},45000);
afterEach(async()=>{
  const f=fixture;fixture=null;if(!f)return;
  await pool.query("DELETE FROM learner_profiles WHERE membership_id=$1",[f.ids.membership]);
  await cleanupLearnerCourseWriteFixture(pool,f);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("non-sensitive profile completion on a fresh learner",()=>{
  it("counts saved own fields, not optional identity or unverifiable eligibility",async()=>{
    const f=fixture!;
    const own=await getOwnLearnerProfileWithRuntime(f.context);
    expect(own.profile.profileDocument.headline).toBe("Own persisted profile");
    const result=learnerProfileCareerCoverage(learnerProfileChecklist(own.profile.profileDocument));
    expect(result).toMatchObject({completed:1,total:15,percentage:0});
    expect(result.next?.section).toBe("personal-details");
  },30000);
  it("denies forged college, suspended and wrong-role membership",async()=>{
    const ctx=fixture!.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getOwnLearnerAcademicSummary(actor)).rejects.toBeDefined();
  },30000);
});
