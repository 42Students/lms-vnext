import {randomUUID} from "node:crypto";
import type {Pool} from "pg";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerDriveReadFixture,seedLearnerDriveReadFixture,
  cleanupLearnerDriveReadFixture} from "./learner-drive-read-fixture";
export function newLearnerAssessmentBrowseFixture(){
  return {drive:newLearnerDriveReadFixture(),applicationId:randomUUID(),roundId:randomUUID()};
}
export type LearnerAssessmentBrowseFixture=ReturnType<typeof newLearnerAssessmentBrowseFixture>;
export async function seedLearnerAssessmentBrowseFixture(pool:Pool,f:LearnerAssessmentBrowseFixture){
  await seedLearnerDriveReadFixture(pool,f.drive);
  const {ids,learner}=f.drive;
  await pool.query(
    "INSERT INTO placement_applications(id,job_id,role_option_id,membership_id,channel,status,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)",
    [f.applicationId,ids.newerJob,ids.newerRole,learner.ids.membership,learner.ids.user],
  );
  await pool.query(
    "INSERT INTO placement_application_screenings(application_id,status,decided_by_user_id,decided_at) VALUES($1,'SHORTLISTED',$2,now())",
    [f.applicationId,SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    "INSERT INTO placement_job_rounds(id,job_id,sequence,kind,name,mode,scheduled_at,timezone,meeting_url,status,created_by_user_id) VALUES($1,$2,1,'TEST',$3,'VIRTUAL',$4,'Asia/Kolkata',$5,'SCHEDULED',$6)",
    [f.roundId,ids.newerJob,"Own searchable assessment "+f.roundId,
      new Date("2026-10-16T08:00:00Z"),"https://exam.example.test/start",SEED_IDS.collegeAdminUser],
  );
}
export async function cleanupLearnerAssessmentBrowseFixture(pool:Pool,f:LearnerAssessmentBrowseFixture){
  // Only mutable fixture-owned relations; never delete audit or history tables.
  await pool.query("DELETE FROM placement_job_rounds WHERE id=$1",[f.roundId]);
  await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1",[f.applicationId]);
  await pool.query("DELETE FROM placement_applications WHERE id=$1",[f.applicationId]);
  await cleanupLearnerDriveReadFixture(pool,f.drive);
}
