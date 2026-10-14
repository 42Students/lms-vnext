import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getOwnLearnerAcademicSummary} from "@/modules/people/learner-academic-summary-service";
import {getOwnLearnerProfileWithRuntime} from "@/modules/people/runtime";
import {ownLearnerProfileReadiness} from "@/modules/people/learner-profile-readiness-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerPositiveFixture,seedLearnerPositiveFixture,cleanupLearnerPositiveFixture} from "../support/learner-positive-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Profile checklist requires disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:ReturnType<typeof newLearnerPositiveFixture>|null=null;
beforeEach(async()=>{
  fixture=newLearnerPositiveFixture();await seedLearnerPositiveFixture(pool,fixture);
},45000);
afterEach(async()=>{
  if(fixture){const owned=fixture;fixture=null;await cleanupLearnerPositiveFixture(pool,owned);}
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own learner profile checklist PostgreSQL reads",()=>{
  it("loads own active identity and saved profile without fabricating field coverage",async()=>{
    const academic=await getOwnLearnerAcademicSummary(fixture!.context);
    const data=await getOwnLearnerProfileWithRuntime(fixture!.context);
    expect(academic.enrollment).not.toBeNull();
    expect(data.person.membership.id).toBe(fixture!.ids.membership);
    const read=ownLearnerProfileReadiness(data.profile.profileDocument,{show:"all"});
    expect(read).toMatchObject({filled:0,total:16,missing:16});
  });
  it("denies forged-college, suspended, wrong-role and forged user identity",async()=>{
    const context=fixture!.context;
    const cases:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
      {...context,user:{...context.user,id:SEED_IDS.facultyUser}},
    ];
    for(const bad of cases) {
      await expect(getOwnLearnerAcademicSummary(bad)).rejects.toBeDefined();
    }
  });
});