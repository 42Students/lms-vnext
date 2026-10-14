import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  newLearnerDriveReadFixture, seedLearnerDriveReadFixture,
  cleanupLearnerDriveReadFixture,
} from "./learner-drive-read-fixture";

export function newLearnerCareerCalendarFixture() {
  return { drive: newLearnerDriveReadFixture(), applicationId: randomUUID(), roundId: randomUUID() };
}
export type LearnerCareerCalendarFixture=ReturnType<typeof newLearnerCareerCalendarFixture>;

export async function seedLearnerCareerCalendarFixture(
  pool: Pool, fixture: LearnerCareerCalendarFixture,
) {
  await seedLearnerDriveReadFixture(pool,fixture.drive);
  const {ids,learner}=fixture.drive;
  await pool.query(
    "INSERT INTO placement_applications(id,job_id,role_option_id,membership_id,channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)",
    [fixture.applicationId,ids.newerJob,ids.newerRole,learner.ids.membership,learner.ids.user],
  );
  await pool.query(
    "INSERT INTO placement_application_screenings(application_id,status,decided_by_user_id,decided_at) VALUES($1,'SHORTLISTED',$2,now())",
    [fixture.applicationId,SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    "INSERT INTO placement_job_rounds(id,job_id,sequence,kind,name,mode,scheduled_at,timezone,meeting_url,status,created_by_user_id) VALUES($1,$2,1,'INTERVIEW',$3,'VIRTUAL',$4,'Asia/Kolkata',$5,'SCHEDULED',$6)",
    [fixture.roundId,ids.newerJob,"Owned interview "+fixture.roundId,
      new Date("2026-10-16T18:45:00Z"),"https://calendar.example.test/interview",SEED_IDS.collegeAdminUser],
  );
}
export async function cleanupLearnerCareerCalendarFixture(
  pool:Pool,fixture:LearnerCareerCalendarFixture,
) {
  // No append-only event/history records may be deleted.
  await pool.query("DELETE FROM placement_job_rounds WHERE id=$1",[fixture.roundId]);
  await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1",[fixture.applicationId]);
  await pool.query("DELETE FROM placement_applications WHERE id=$1",[fixture.applicationId]);
  await cleanupLearnerDriveReadFixture(pool,fixture.drive);
}
