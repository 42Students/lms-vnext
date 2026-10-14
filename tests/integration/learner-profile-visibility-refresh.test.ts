import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerProfileWithRuntime} from "@/modules/people/runtime";
import {getOwnLearnerAcademicSummary} from "@/modules/people/learner-academic-summary-service";
import {learnerProfileReconcile} from "@/modules/people/learner-profile-refresh-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,
cleanupLearnerCourseWriteFixture,type LearnerCourseWriteFixture}
 from "../support/learner-course-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let own:LearnerCourseWriteFixture|null=null;
beforeEach(async()=>{
 own=newLearnerCourseWriteFixture();await seedLearnerCourseWriteFixture(pool,own);
 await pool.query("INSERT INTO learner_profiles(membership_id,profile_document) VALUES($1,$2::jsonb)",
 [own.ids.membership,JSON.stringify({headline:"Original saved headline"})]);
},45000);
afterEach(async()=>{
 const f=own;own=null;
 if(f){await pool.query("DELETE FROM learner_profiles WHERE membership_id=$1",[f.ids.membership]);
 await cleanupLearnerCourseWriteFixture(pool,f);}
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("fresh enrolled learner profile refresh",()=>{
 it("reconciles only persisted newer own-profile fields after independent update",async()=>{
  const ctx=own!.context;
  const initial=(await getOwnLearnerProfileWithRuntime(ctx)).profile.profileDocument;
  await pool.query("UPDATE learner_profiles SET profile_document=jsonb_set(profile_document,'{headline}',to_jsonb($2::text),true) WHERE membership_id=$1",
  [own!.ids.membership,"Updated elsewhere"]);
  const updated=(await getOwnLearnerProfileWithRuntime(ctx)).profile.profileDocument;
  expect(learnerProfileReconcile(initial,initial,updated).headline).toBe("Updated elsewhere");
  expect(learnerProfileReconcile({...initial,headline:"Draft edit"},initial,updated).headline).toBe("Draft edit");
 },30000);
 it("denies forged college, suspended membership and wrong learner role via profile page scoped identity gate",async()=>{
  const ctx=own!.context;const denied:RequestContext[]=[
   {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
   {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
   {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
  ];
  for(const actor of denied)await expect(getOwnLearnerAcademicSummary(actor)).rejects.toBeDefined();
 },30000);
});