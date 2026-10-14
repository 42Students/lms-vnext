import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerCourseWorkspace} from "@/modules/courses/learner-course-service";
import {learnerCoursePathPreview} from "@/modules/courses/learner-course-path-preview-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,
  cleanupLearnerCourseWriteFixture,type LearnerCourseWriteFixture}
  from "../support/learner-course-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCourseWriteFixture|null=null;
beforeEach(async()=>{fixture=newLearnerCourseWriteFixture();await seedLearnerCourseWriteFixture(pool,fixture,{content:true});},45000);
afterEach(async()=>{const f=fixture;fixture=null;if(f)await cleanupLearnerCourseWriteFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L2-007 own persisted course learning path summary",()=>{
  it("shows the real lesson with its published content without inventing authored takeaways",async()=>{
    const f=fixture!;
    const workspace=await getLearnerCourseWorkspace(f.context,f.ids.delivery);
    const preview=learnerCoursePathPreview(workspace.lessons);
    expect(preview.totalLessons).toBe(1);
    expect(preview.lessons[0]).toMatchObject({id:f.ids.lesson,total:1,completed:0,progress:0});
  },30000);
  it("denies forged college, suspended and wrong-role principals",async()=>{
    const f=fixture!,ctx=f.context;
    const bad:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of bad)await expect(getLearnerCourseWorkspace(actor,f.ids.delivery)).rejects.toBeDefined();
  },30000);
});
