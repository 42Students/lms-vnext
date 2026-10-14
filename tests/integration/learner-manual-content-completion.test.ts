import { randomUUID } from "node:crypto";
import { beforeEach, afterEach, afterAll, describe, it, expect } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { saveLearnerContentProgress, getLearnerContentProgress } from "@/modules/courses/progress-service";
import { getLearnerCourseWorkspace } from "@/modules/courses/learner-course-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
if (!process.env.TEST_DATABASE_URL) throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]}};
const ids={course:randomUUID(),offering:randomUUID(),delivery:randomUUID(),path:randomUUID(),lesson:randomUUID(),content:randomUUID()};
let prepared=false;
beforeEach(async()=>{
  const owned=await pool.query<{section_id:string;academic_period_id:string;cohort_id:string}>([
    "SELECT se.section_id,se.academic_period_id,e.cohort_id FROM learner_program_enrollments e",
    "JOIN section_enrollments se ON se.learner_enrollment_id=e.id",
    "WHERE e.membership_id=$1 AND e.status='ACTIVE' AND se.status='ACTIVE' LIMIT 1",
  ].join(" "),[SEED_IDS.learnerCollegeAMembership]);
  if(owned.rows.length!==1)throw new Error("Seed learner requires an active Section enrollment");
  const section=owned.rows[0]!;prepared=true;
  const suffix=ids.course.slice(0,8);
  await pool.query("INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",[ids.course,SEED_IDS.departmentA,"Complete "+suffix,"L5PROG-"+suffix]);
  await pool.query("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",[ids.offering,ids.course,section.cohort_id,section.academic_period_id]);
  await pool.query("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)",[ids.delivery,ids.offering,section.section_id]);
  await pool.query("INSERT INTO course_learning_paths(id,offering_id,title,status) VALUES($1,$2,$3,'PUBLISHED')",[ids.path,ids.offering,"Path "+suffix]);
  await pool.query("INSERT INTO course_lessons(id,learning_path_id,name,sequence) VALUES($1,$2,$3,0)",[ids.lesson,ids.path,"Lesson "+suffix]);
  await pool.query("INSERT INTO lesson_contents(id,lesson_id,content_type,title,notes,sequence,status,created_by_user_id) VALUES($1,$2,'RESOURCE',$3,'Text resource',0,'PUBLISHED',$4)",[ids.content,ids.lesson,"Resource "+suffix,SEED_IDS.collegeAdminUser]);
},45000);
afterEach(async()=>{if(!prepared)return;
  // Immutable activity_events are deliberately never deleted or updated.
  await pool.query("DELETE FROM learner_content_progress WHERE lesson_content_id=$1",[ids.content]);
  await pool.query("DELETE FROM lesson_contents WHERE id=$1",[ids.content]);
  await pool.query("DELETE FROM course_lessons WHERE id=$1",[ids.lesson]);
  await pool.query("DELETE FROM course_learning_paths WHERE id=$1",[ids.path]);
  await pool.query("DELETE FROM course_section_deliveries WHERE id=$1",[ids.delivery]);
  await pool.query("DELETE FROM course_offerings WHERE id=$1",[ids.offering]);
  await pool.query("DELETE FROM courses WHERE id=$1",[ids.course]);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner manual content completion on PostgreSQL",()=>{
  it("persists first completion once and makes course workspace progress reflect it",async()=>{
    const first=await saveLearnerContentProgress(learner,ids.content,{deliveryId:ids.delivery,completed:true});
    expect(first.status).toBe("COMPLETED");
    const again=await saveLearnerContentProgress(learner,ids.content,{deliveryId:ids.delivery,completed:true});
    expect(again.completedAt?.getTime()).toBe(first.completedAt?.getTime());
    const read=await getLearnerContentProgress(learner,ids.content,ids.delivery);
    expect(read.status).toBe("COMPLETED");
    const workspace=await getLearnerCourseWorkspace(learner,ids.delivery);
    expect(workspace.lessons.flatMap(lesson=>lesson.contents).find(row=>row.id===ids.content)?.progress.status).toBe("COMPLETED");
    const audits=await pool.query<{total:string}>("SELECT count(*)::text AS total FROM activity_events WHERE dedupe_key=$1",
      ["learner-content:"+SEED_IDS.learnerCollegeAMembership+":"+ids.content+":completed"]);
    expect(audits.rows[0]?.total).toBe("1");
  },30000);
  it("denies forged college, suspended membership, wrong role and forged actor without mutation",async()=>{
    const base=learner;const denied:RequestContext[]=[
      {...base,membership:{...base.membership!,collegeId:SEED_IDS.collegeB}},
      {...base,membership:{...base.membership!,status:"SUSPENDED"}},
      {...base,membership:{...base.membership!,roles:["FACULTY"]}},
      {...base,user:{...base.user,id:SEED_IDS.facultyUser}},
    ];
    for(const context of denied) await expect(saveLearnerContentProgress(context,ids.content,
      {deliveryId:ids.delivery,completed:true})).rejects.toBeDefined();
    const persisted=await pool.query("SELECT id FROM learner_content_progress WHERE lesson_content_id=$1",[ids.content]);
    expect(persisted.rows).toHaveLength(0);
  });
});