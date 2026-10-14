import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";
/** In-test disposable PostgreSQL fixture. Never deletes immutable history. */
export async function makeChat6AssessmentLesson(pool: Pool) {
  const s = randomUUID().slice(0, 10);
  const dep = await pool.query<{id:string}>("insert into departments (college_id,name) values ($1,$2) returning id",
    [SEED_IDS.collegeA, "Assessment Dept " + s]);
  const program = await pool.query<{id:string}>(
    "insert into programs (department_id,name,code,duration_terms) values ($1,$2,$3,8) returning id",
    [dep.rows[0]!.id, "Assessment Program " + s, "AP" + s]);
  const period = await pool.query<{id:string}>(
    "insert into academic_periods (college_id,name,code,start_date,end_date) values ($1,$2,$3,'2026-07-01','2027-06-30') returning id",
    [SEED_IDS.collegeA, "Assessment Period " + s, "AY" + s]);
  const cohort = await pool.query<{id:string}>(
    "insert into cohorts (program_id,name,code,start_period_id) values ($1,$2,$3,$4) returning id",
    [program.rows[0]!.id, "Assessment Cohort " + s, "AC" + s, period.rows[0]!.id]);
  const course = await pool.query<{id:string}>(
    "insert into courses (department_id,name,code) values ($1,$2,$3) returning id",
    [dep.rows[0]!.id, "Assessment Course " + s, "AS" + s]);
  const offering = await pool.query<{id:string}>(
    "insert into course_offerings (course_id,cohort_id,academic_period_id) values ($1,$2,$3) returning id",
    [course.rows[0]!.id,cohort.rows[0]!.id,period.rows[0]!.id]);
  const path = await pool.query<{id:string}>(
    "insert into course_learning_paths (offering_id,title) values ($1,$2) returning id",
    [offering.rows[0]!.id, "Assessment Path " + s]);
  const lesson = await pool.query<{id:string}>(
    "insert into course_lessons (learning_path_id,name,sequence) values ($1,$2,0) returning id",
    [path.rows[0]!.id, "Assessment Lesson " + s]);
  return { lessonId: lesson.rows[0]!.id, suffix: s };
}
