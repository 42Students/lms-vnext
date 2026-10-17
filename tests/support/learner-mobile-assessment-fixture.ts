import {randomUUID} from "node:crypto";
import type {Pool} from "pg";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCourseWriteFixture,seedLearnerCourseWriteFixture,
  cleanupLearnerCourseWriteFixture} from "./learner-course-write-fixture";

/** Fresh, private learner and academic hierarchy for each assessment read test. */
export function newLearnerMobileAssessmentFixture(){
  return {course:newLearnerCourseWriteFixture(),assignmentId:randomUUID(),quizId:randomUUID()};
}
export type LearnerMobileAssessmentFixture=ReturnType<typeof newLearnerMobileAssessmentFixture>;
export async function seedLearnerMobileAssessmentFixture(pool:Pool,f:LearnerMobileAssessmentFixture){
  await seedLearnerCourseWriteFixture(pool,f.course,{content:true});
  await pool.query(
    "INSERT INTO course_assignments(id,lesson_id,title,description,max_points,sequence,status,created_by_user_id,due_at) VALUES($1,$2,$3,'Owned instructions',10,1,'PUBLISHED',$4,'2099-01-01T00:00:00Z')",
    [f.assignmentId,f.course.ids.lesson,"Mobile assignment "+f.assignmentId,SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    "INSERT INTO course_quizzes(id,lesson_id,title,total_points,sequence,max_attempts,status,created_by_user_id,due_at) VALUES($1,$2,$3,10,2,2,'PUBLISHED',$4,'2099-01-01T00:00:00Z')",
    [f.quizId,f.course.ids.lesson,"Mobile quiz "+f.quizId,SEED_IDS.collegeAdminUser],
  );
}
export async function cleanupLearnerMobileAssessmentFixture(pool:Pool,f:LearnerMobileAssessmentFixture){
  // Never remove append-only audit rows or evidence.
  try {
    await pool.query("DELETE FROM course_quizzes WHERE id=$1",[f.quizId]);
    await pool.query("DELETE FROM course_assignments WHERE id=$1",[f.assignmentId]);
  } finally {
    await cleanupLearnerCourseWriteFixture(pool,f.course);
  }
}
