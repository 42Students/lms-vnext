import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { newLearnerPositiveFixture, seedLearnerPositiveFixture, cleanupLearnerPositiveFixture } from "./learner-positive-fixture";

export function newLearnerLearningFixture() {
  const learner = newLearnerPositiveFixture();
  const id = () => randomUUID();
  return { learner, ids: {
    section: id(), sectionEnrollment: id(), course: id(), offering: id(),
    delivery: id(), path: id(), lesson: id(), assignment: id(), quiz: id(),
    attempt: id(), event: id(),
  }};
}
export type LearnerLearningFixture = ReturnType<typeof newLearnerLearningFixture>;

/** Isolated persisted learner/course hierarchy, not a mocked read model. */
export async function seedLearnerLearningFixture(pool: Pool, fixture: LearnerLearningFixture) {
  const { learner, ids } = fixture;
  await seedLearnerPositiveFixture(pool, learner);
  const parent = await pool.query<{cohort_id:string;start_period_id:string}>(
    "SELECT e.cohort_id,c.start_period_id FROM learner_program_enrollments e JOIN cohorts c ON c.id=e.cohort_id WHERE e.id=$1",
    [learner.ids.enrollment],
  );
  if(parent.rows.length !== 1) throw new Error("Missing unique learner cohort");
  const cohortId = parent.rows[0]!.cohort_id;
  const periodId = parent.rows[0]!.start_period_id;
  const suffix = ids.course.slice(0,8);
  await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
    [ids.section,cohortId,periodId,"Learning "+suffix,"L5-S-"+suffix]);
  await pool.query("INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
    [ids.course,SEED_IDS.departmentA,"Learning "+suffix,"L5-C-"+suffix]);
  await pool.query("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",
    [ids.offering,ids.course,cohortId,periodId]);
  await pool.query("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)",
    [ids.delivery,ids.offering,ids.section]);
  await pool.query("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)",
    [ids.sectionEnrollment,learner.ids.enrollment,ids.section,periodId]);
  await pool.query("INSERT INTO course_learning_paths(id,offering_id,title,status) VALUES($1,$2,$3,'PUBLISHED')",
    [ids.path,ids.offering,"Learning path "+suffix]);
  await pool.query("INSERT INTO course_lessons(id,learning_path_id,name,sequence) VALUES($1,$2,$3,0)",
    [ids.lesson,ids.path,"Learning lesson "+suffix]);
  await pool.query("INSERT INTO course_assignments(id,lesson_id,title,description,max_points,sequence,status,created_by_user_id) VALUES($1,$2,$3,'Instructions from DB',10,0,'PUBLISHED',$4)",
    [ids.assignment,ids.lesson,"Assignment "+suffix,SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO course_quizzes(id,lesson_id,title,total_points,sequence,max_attempts,status,created_by_user_id) VALUES($1,$2,$3,10,0,2,'PUBLISHED',$4)",
    [ids.quiz,ids.lesson,"Quiz "+suffix,SEED_IDS.collegeAdminUser]);
  await pool.query("INSERT INTO section_schedule_events(id,section_id,title,starts_at,ends_at) VALUES($1,$2,$3,$4,$5)",
    [ids.event,ids.section,"Learning class "+suffix,"2026-10-14T04:00:00Z","2026-10-14T05:00:00Z"]);
  await pool.query("INSERT INTO section_schedule_event_courses(schedule_event_id,delivery_id) VALUES($1,$2)",
    [ids.event,ids.delivery]);
}

export async function cleanupLearnerLearningFixture(pool: Pool, fixture: LearnerLearningFixture) {
  const { learner, ids } = fixture;
  try {
    await pool.query("DELETE FROM in_app_notifications WHERE event_id IN (SELECT id FROM activity_events WHERE actor_user_id=$1 AND event_type='courses.assignment.submitted' AND subject_id=$2)",
      [learner.ids.user,ids.assignment]);
    await pool.query("DELETE FROM activity_events WHERE actor_user_id=$1 AND event_type='courses.assignment.submitted' AND subject_id=$2",
      [learner.ids.user,ids.assignment]);
    await pool.query("DELETE FROM assignment_submissions WHERE assignment_id=$1",[ids.assignment]);
    await pool.query("DELETE FROM quiz_attempt_answers WHERE attempt_id=$1",[ids.attempt]);
    await pool.query("DELETE FROM quiz_attempts WHERE quiz_id=$1",[ids.quiz]);
    await pool.query("DELETE FROM course_assignments WHERE id=$1",[ids.assignment]);
    await pool.query("DELETE FROM course_quizzes WHERE id=$1",[ids.quiz]);
    await pool.query("DELETE FROM section_schedule_event_courses WHERE schedule_event_id=$1",[ids.event]);
    await pool.query("DELETE FROM section_schedule_events WHERE id=$1",[ids.event]);
    await pool.query("DELETE FROM course_lessons WHERE id=$1",[ids.lesson]);
    await pool.query("DELETE FROM course_learning_paths WHERE id=$1",[ids.path]);
    await pool.query("DELETE FROM section_enrollments WHERE id=$1",[ids.sectionEnrollment]);
    await pool.query("DELETE FROM course_section_deliveries WHERE id=$1",[ids.delivery]);
    await pool.query("DELETE FROM course_offerings WHERE id=$1",[ids.offering]);
    await pool.query("DELETE FROM program_term_courses WHERE course_id=$1",[ids.course]);
    await pool.query("DELETE FROM courses WHERE id=$1",[ids.course]);
    await pool.query("DELETE FROM sections WHERE id=$1",[ids.section]);
  } finally {
    await cleanupLearnerPositiveFixture(pool,learner);
  }
}