import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerCourseWorkspace} from "@/modules/courses/learner-course-service";
import {learnerCourseOverviewJumps} from "@/modules/courses/learner-course-overview-mobile-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,
  cleanupLearnerCourseWriteFixture,type LearnerCourseWriteFixture}
  from "../support/learner-course-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCourseWriteFixture|null=null;
beforeEach(async()=>{fixture=newLearnerCourseWriteFixture();await seedLearnerCourseWriteFixture(pool,fixture,{content:true});},45000);
afterEach(async()=>{const own=fixture;fixture=null;if(own)await cleanupLearnerCourseWriteFixture(pool,own);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L2-022 mobile overview links from own published course",()=>{
  it("builds in-page jump links only for sections backed by own published data",async()=>{
    const {context,ids}=fixture!;
    const workspace=await getLearnerCourseWorkspace(context,ids.delivery);
    const jumps=learnerCourseOverviewJumps({
      hasPublishedPath:workspace.learningPath!==null,hasUpdates:false,
    });
    expect(jumps.map(x=>x.label)).toEqual(["About","Learning path","Next step","Progress"]);
    expect(workspace.lessons[0]?.id).toBe(ids.lesson);
  },30000);
  it("denies forged college, suspended status, wrong role before own course data",async()=>{
    const {context,ids}=fixture!;
    const denied:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getLearnerCourseWorkspace(actor,ids.delivery)).rejects.toBeDefined();
  },30000);
});
