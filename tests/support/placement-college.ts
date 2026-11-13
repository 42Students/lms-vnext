import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { contextFor, deletePerson, insertPerson, person, type Person } from "./actors";
import {
  cleanupLearnerCareerCalendarFixture,
  newLearnerCareerCalendarFixture,
  seedLearnerCareerCalendarFixture,
} from "./learner-career-calendar-fixture";

/**
 * A disposable college for placement tests: learner A with an application to one drive, a second fully eligible learner B in the
 * SAME college with an application to another drive, and a TPO, a College Admin and a faculty member of that college, plus a TPO of
 * a different college. Because B is eligible, any denial in a test is about ownership or role, never about eligibility.
 */
export type PlacementCollege = Awaited<ReturnType<typeof seedPlacementCollege>>;

export async function seedPlacementCollege(pool: Pool, prefix = "sec-plc") {
  const fixture = newLearnerCareerCalendarFixture();
  await seedLearnerCareerCalendarFixture(pool, fixture);
  const { ids, learner } = fixture.drive;
  const college = learner.ids.college;

  const learnerBp = person();
  const tpoP = person();
  const adminP = person();
  const facultyP = person();
  const enrollmentB = randomUUID();
  const decisionB = randomUUID();
  const applicationB = randomUUID();

  for (const [p, role, name] of [
    [learnerBp, "LEARNER", "Learner B"], [tpoP, "TPO", "TPO"], [adminP, "COLLEGE_ADMIN", "Admin"], [facultyP, "FACULTY", "Faculty"],
  ] as const) {
    await insertPerson(pool, p, role, `${prefix.toUpperCase()} ${name}`, college, prefix);
  }
  await pool.query(
    "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')",
    [enrollmentB, learnerBp.membership, learner.ids.program, learner.ids.cohort],
  );
  await pool.query(
    "INSERT INTO placement_eligibility_decisions(id,college_id,scope_type,scope_id,status,decided_by_user_id) VALUES($1,$2,'MEMBERSHIP',$3,'ELIGIBLE',$4)",
    [decisionB, college, learnerBp.membership, SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    "INSERT INTO placement_applications(id,job_id,role_option_id,membership_id,channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)",
    [applicationB, ids.olderJob, ids.olderRole, learnerBp.membership, learnerBp.user],
  );

  const as = (p: Person, role: "LEARNER" | "TPO" | "COLLEGE_ADMIN" | "FACULTY", collegeId = college): RequestContext =>
    contextFor(p, role, collegeId, prefix);

  return {
    college,
    jobA: ids.newerJob, // learner A applied here
    jobB: ids.olderJob, // learner B applied here
    applicationA: fixture.applicationId,
    applicationB,
    learnerA: learner.context,
    learnerB: as(learnerBp, "LEARNER"),
    tpo: as(tpoP, "TPO"),
    admin: as(adminP, "COLLEGE_ADMIN"),
    faculty: as(facultyP, "FACULTY"),
    otherCollegeTpo: as(person(), "TPO", SEED_IDS.collegeB),
    membershipA: learner.ids.membership,
    membershipB: learnerBp.membership,
    /** Remove everything this helper created (history rows that must be kept are left, by design). */
    async cleanup() {
      const q = (sql: string, args: unknown[]) => pool.query(sql, args).catch(() => undefined);
      await q("DELETE FROM placement_applications WHERE id=$1", [applicationB]);
      await q("DELETE FROM placement_eligibility_decisions WHERE id=$1", [decisionB]);
      await q("DELETE FROM learner_program_enrollments WHERE id=$1", [enrollmentB]);
      for (const p of [learnerBp, tpoP, adminP, facultyP]) await deletePerson(pool, p);
      await cleanupLearnerCareerCalendarFixture(pool, fixture);
    },
  };
}
