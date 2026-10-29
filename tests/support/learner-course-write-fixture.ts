import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * A whole learner + Section + course hierarchy created anew for every test.
 * Relies only on the seeded organization, college, department and admin actor,
 * NEVER on an already enrolled learner, cohort, academic period or Section.
 */
export function newLearnerCourseWriteFixture() {
  const id = () => randomUUID();
  const ids = {
    user: id(), membership: id(), role: id(), period: id(),
    program: id(), cohort: id(), section: id(), learnerEnrollment: id(),
    sectionEnrollment: id(), course: id(), offering: id(), delivery: id(),
    path: id(), lesson: id(), content: id(),
  };
  const context: RequestContext = {
    user: {
      id: ids.user,
      identityUid: "learner-write-" + ids.user,
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: ids.membership,
      collegeId: SEED_IDS.collegeA,
      organizationId: SEED_IDS.organization,
      status: "ACTIVE",
      roles: ["LEARNER"],
    },
  };
  return { ids, context };
}

export type LearnerCourseWriteFixture = ReturnType<typeof newLearnerCourseWriteFixture>;

export async function seedLearnerCourseWriteFixture(
  pool: Pool,
  fixture: LearnerCourseWriteFixture,
  options: { content?: boolean } = {},
) {
  const { ids, context } = fixture;
  const unique = ids.user.slice(0, 12);
  await pool.query(
    "INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
    [ids.user, context.user.identityUid, "Course learner " + unique],
  );
  await pool.query(
    "INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
    [ids.membership, ids.user, SEED_IDS.collegeA],
  );
  await pool.query(
    "INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
    [ids.role, ids.membership],
  );
  await pool.query(
    "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,'2026-07-01','2026-12-31')",
    [ids.period, SEED_IDS.collegeA, "Learner write period " + unique, "LCW-P-" + unique],
  );
  await pool.query(
    "INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
    [ids.program, SEED_IDS.departmentA, "Learner write program " + unique, "LCW-G-" + unique],
  );
  // The cohort INSERT trigger creates cohort_progression_state; do not insert that row.
  await pool.query(
    "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
    [ids.cohort, ids.program, "Learner write cohort " + unique, "LCW-C-" + unique, ids.period],
  );
  await pool.query(
    "INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
    [ids.section, ids.cohort, ids.period, "Learner write section " + unique, "LCW-S-" + unique],
  );
  await pool.query(
    "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')",
    [ids.learnerEnrollment, ids.membership, ids.program, ids.cohort],
  );
  await pool.query(
    "INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)",
    [ids.sectionEnrollment, ids.learnerEnrollment, ids.section, ids.period],
  );
  await pool.query(
    "INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",
    [ids.course, SEED_IDS.departmentA, "Learner write course " + unique, "LCW-L-" + unique],
  );
  await pool.query(
    "INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",
    [ids.offering, ids.course, ids.cohort, ids.period],
  );
  await pool.query(
    "INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)",
    [ids.delivery, ids.offering, ids.section],
  );
  if (options.content) {
    await pool.query(
      "INSERT INTO course_learning_paths(id,offering_id,title,status) VALUES($1,$2,$3,'PUBLISHED')",
      [ids.path, ids.offering, "Learner write path " + unique],
    );
    await pool.query(
      "INSERT INTO course_lessons(id,learning_path_id,name,sequence) VALUES($1,$2,$3,0)",
      [ids.lesson, ids.path, "Learner write lesson " + unique],
    );
    await pool.query(
      "INSERT INTO lesson_contents(id,lesson_id,content_type,title,notes,sequence,status,created_by_user_id) VALUES($1,$2,'RESOURCE',$3,'Persisted learner test resource',0,'PUBLISHED',$4)",
      [ids.content, ids.lesson, "Learner write content " + unique, SEED_IDS.collegeAdminUser],
    );
  }
}

/**
 * Idempotent reverse-FK cleanup of ONLY the UUIDs allocated by this test.
 * Never deletes/rewrites activity_events or any other append-only evidence.
 * A successful audited write retains its minimal actor identity and membership
 * because activity_events references them with restrictive foreign keys.
 */
export async function cleanupLearnerCourseWriteFixture(
  pool: Pool,
  fixture: LearnerCourseWriteFixture,
) {
  const { ids } = fixture;
  await pool.query("DELETE FROM learner_content_progress WHERE lesson_content_id=$1", [ids.content]);
  await pool.query("DELETE FROM course_discussion_messages WHERE delivery_id=$1", [ids.delivery]);
  await pool.query("DELETE FROM lesson_contents WHERE id=$1", [ids.content]);
  await pool.query("DELETE FROM course_lessons WHERE id=$1", [ids.lesson]);
  await pool.query("DELETE FROM course_learning_paths WHERE id=$1", [ids.path]);
  await pool.query("DELETE FROM section_enrollments WHERE id=$1", [ids.sectionEnrollment]);
  await pool.query("DELETE FROM course_section_deliveries WHERE id=$1", [ids.delivery]);
  await pool.query("DELETE FROM course_offerings WHERE id=$1", [ids.offering]);
  // The registered DB-002 curriculum guard forbids removing a course's
  // program-term mapping while an offering still exists. Remove it only
  // after deleting this fixture's offering and before its parent course.
  await pool.query("DELETE FROM program_term_courses WHERE course_id=$1", [ids.course]);
  await pool.query("DELETE FROM courses WHERE id=$1", [ids.course]);
  await pool.query("DELETE FROM sections WHERE id=$1", [ids.section]);
  await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1", [ids.learnerEnrollment]);
  // cohort_progression_state is owned by its cohort (ON DELETE CASCADE).
  await pool.query("DELETE FROM cohorts WHERE id=$1", [ids.cohort]);
  // DB-002 materializes program_terms when constructing the academic
  // progression. Delete this fixture's empty terms after roster/offering
  // and curriculum teardown, before removing the owning program.
  await pool.query("DELETE FROM program_terms WHERE program_id=$1", [ids.program]);
  await pool.query("DELETE FROM programs WHERE id=$1", [ids.program]);
  await pool.query("DELETE FROM academic_periods WHERE id=$1", [ids.period]);

  const audit = await pool.query<{ used: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM activity_events WHERE actor_user_id=$1 OR actor_membership_id=$2) AS used",
    [ids.user, ids.membership],
  );
  if (!audit.rows[0]?.used) {
    await pool.query("DELETE FROM membership_roles WHERE id=$1", [ids.role]);
    await pool.query("DELETE FROM college_memberships WHERE id=$1", [ids.membership]);
    await pool.query("DELETE FROM users WHERE id=$1", [ids.user]);
  }
}
