import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

/** Super Admin with no membership at all, scoped to the selected college. */
export function superAdminContext(collegeId: string = SEED_IDS.collegeA): RequestContext {
  return {
    user: {
      id: SEED_IDS.superAdminUser,
      identityUid: "sa-courses-content",
      platformStatus: "ACTIVE",
      systemRoles: ["SUPER_ADMIN"],
    },
    membership: null,
    adminScope: { organizationId: SEED_IDS.organization, collegeId },
  };
}

export type CoursesContentFixture = Awaited<ReturnType<typeof createCoursesContentFixture>>;

/** One course/offering/path/lesson hierarchy inside college A, removed again by `cleanup`. */
export async function createCoursesContentFixture(pool: Pool, label: string) {
  const tag = label + "-" + randomUUID().slice(0, 8);
  const ids = {
    period: randomUUID(), program: randomUUID(), cohort: randomUUID(), course: randomUUID(),
    offering: randomUUID(), path: randomUUID(), lesson: randomUUID(), lesson2: randomUUID(),
  };
  const q = (text: string, values: unknown[]) => pool.query(text, values);
  await q("insert into academic_periods(id,college_id,name,code,start_date,end_date) values ($1,$2,$3::text,$3::text,'2026-07-01','2027-06-30')", [ids.period, SEED_IDS.collegeA, tag]);
  await q("insert into programs(id,department_id,name,code,duration_terms) values ($1,$2,$3::text,$3::text,8)", [ids.program, SEED_IDS.departmentA, tag]);
  await q("insert into cohorts(id,program_id,name,code,start_period_id) values ($1,$2,$3::text,$3::text,$4)", [ids.cohort, ids.program, tag, ids.period]);
  await q("insert into courses(id,department_id,name,code) values ($1,$2,$3::text,$3::text)", [ids.course, SEED_IDS.departmentA, tag]);
  await q("insert into course_offerings(id,course_id,cohort_id,academic_period_id) values ($1,$2,$3,$4)", [ids.offering, ids.course, ids.cohort, ids.period]);
  await q("insert into course_learning_paths(id,offering_id,title) values ($1,$2,$3)", [ids.path, ids.offering, tag]);
  await q("insert into course_lessons(id,learning_path_id,name,sequence) values ($1,$2,$3,0)", [ids.lesson, ids.path, "Lesson A " + tag]);
  await q("insert into course_lessons(id,learning_path_id,name,sequence) values ($1,$2,$3,1)", [ids.lesson2, ids.path, "Lesson B " + tag]);
  async function cleanup() {
    await q("delete from lesson_contents where lesson_id in ($1,$2)", [ids.lesson, ids.lesson2]);
    await q("delete from course_lessons where learning_path_id=$1", [ids.path]);
    await q("delete from course_learning_paths where id=$1", [ids.path]);
    await q("delete from course_offerings where id=$1", [ids.offering]);
    await q("delete from program_term_courses where course_id=$1", [ids.course]);
    await q("delete from courses where id=$1", [ids.course]);
    await q("delete from cohorts where id=$1", [ids.cohort]);
    await q("delete from programs where id=$1", [ids.program]);
    await q("delete from academic_periods where id=$1", [ids.period]);
  }
  return { tag, ids, cleanup };
}
