import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {saveLearnerContentProgress} from "@/modules/courses/progress-service";
import {getLearnerCourseWorkspace} from "@/modules/courses/learner-course-service";
import {learnerRecentCourseActivity} from "@/modules/courses/learner-recent-course-activity-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,
  cleanupLearnerCourseWriteFixture,type LearnerCourseWriteFixture}
  from "../support/learner-course-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCourseWriteFixture|null=null;
beforeEach(async()=>{fixture=newLearnerCourseWriteFixture();await seedLearnerCourseWriteFixture(pool,fixture,{content:true});},45000);
afterEach(async()=>{const owned=fixture;fixture=null;if(owned)await cleanupLearnerCourseWriteFixture(pool,owned);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L2-016 recent course activity, own persisted completion",()=>{
  it("includes a just-recorded audited learner completion and never invents an update",async()=>{
    const {context,ids}=fixture!;
    const saved=await saveLearnerContentProgress(context,ids.content,{
      deliveryId:ids.delivery,completed:true,
    });
    expect(saved.status).toBe("COMPLETED");
    expect(saved.attempt).toBe(1);
    const workspace=await getLearnerCourseWorkspace(context,ids.delivery);
    const updates=learnerRecentCourseActivity(workspace.lessons,Date.now());
    expect(updates).toEqual(expect.arrayContaining([
      expect.objectContaining({id:ids.content,label:"Content completed"}),
    ]));
    const audit=await pool.query<{total:string}>(
      "SELECT count(*)::text AS total FROM activity_events WHERE dedupe_key=$1",
      ["learner-content:"+ids.membership+":"+ids.content+":attempt:"+saved.attempt+":completed"],
    );
    expect(audit.rows[0]?.total).toBe("1");
  },30000);
  it("denies forged-college, suspended, wrong-role and swapped user on the underlying write",async()=>{
    const {context,ids}=fixture!;
    const forged:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
      {...context,user:{...context.user,id:SEED_IDS.facultyUser}},
    ];
    for(const actor of forged)await expect(saveLearnerContentProgress(actor,ids.content,{
      deliveryId:ids.delivery,completed:true,
    })).rejects.toBeDefined();
    const rows=await pool.query("SELECT id FROM learner_content_progress WHERE lesson_content_id=$1",[ids.content]);
    expect(rows.rows).toHaveLength(0);
  },30000);
});
