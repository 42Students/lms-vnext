import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerCourseWorkspace} from "@/modules/courses/learner-course-service";
import {learnerRoadmapMobileOutline} from "@/modules/courses/learner-roadmap-mobile-model";
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
describe("L3-032 mobile lesson index reads only own persisted path",()=>{
  it("lists authorized published lessons in ordered mobile index",async()=>{
    const f=fixture!;
    const workspace=await getLearnerCourseWorkspace(f.context,f.ids.delivery);
    const outline=learnerRoadmapMobileOutline(workspace.lessons.map(lesson=>({
      id:lesson.id,name:lesson.name,sequence:lesson.sequence,visibleCount:lesson.items.length,
    })),"all");
    expect(outline).toHaveLength(1);
    expect(outline[0]).toMatchObject({id:f.ids.lesson,count:1});
  },30000);
  it("denies forged college, suspended account and wrong role",async()=>{
    const f=fixture!,ctx=f.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getLearnerCourseWorkspace(actor,f.ids.delivery)).rejects.toBeDefined();
  },30000);
});
