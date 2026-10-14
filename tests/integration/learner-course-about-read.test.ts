import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerCourseWorkspace,listLearnerCourseDeliveries}
  from "@/modules/courses/learner-course-service";
import {learnerCourseAboutSource} from "@/modules/courses/learner-course-about-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,
  cleanupLearnerCourseWriteFixture,type LearnerCourseWriteFixture}
  from "../support/learner-course-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCourseWriteFixture|null=null;
beforeEach(async()=>{
  fixture=newLearnerCourseWriteFixture();
  await seedLearnerCourseWriteFixture(pool,fixture,{content:true});
  await pool.query("UPDATE courses SET description=$2 WHERE id=$1",
    [fixture.ids.course,"Own persisted catalogue description"]);
},45000);
afterEach(async()=>{const f=fixture;fixture=null;if(f)await cleanupLearnerCourseWriteFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L2-006 own course About source",()=>{
  it("shows authorized persisted course description, code and enrollment context",async()=>{
    const f=fixture!;
    const [workspace,deliveries]=await Promise.all([
      getLearnerCourseWorkspace(f.context,f.ids.delivery),
      listLearnerCourseDeliveries(f.context,{includeHistorical:true}),
    ]);
    const own=deliveries.find(d=>d.deliveryId===f.ids.delivery);
    expect(own?.courseDescription).toBe("Own persisted catalogue description");
    expect(own?.courseCode).toContain("LCW-L-");
    expect(learnerCourseAboutSource({
      safeBodyHtml:null,courseDescription:own?.courseDescription??null,
      learningPathDescription:workspace.learningPath?.description??null,
    }).source).toBe("CATALOGUE");
  },30000);
  it("does not read forged college, suspended or wrong-role membership",async()=>{
    const f=fixture!,ctx=f.context;
    const actors:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of actors)await expect(getLearnerCourseWorkspace(actor,f.ids.delivery)).rejects.toBeDefined();
  },30000);
});
