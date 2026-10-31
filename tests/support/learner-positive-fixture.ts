import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "./w04-placement-access-fixture";

/** Runtime-created rows: no success assertion may rely on an empty shared feed. */
export function newLearnerPositiveFixture() {
  const key = (prefix: string) => prefix + randomUUID();
  const ids = Object.fromEntries([
    "user","membership","enrollment","role","decision","company","relation",
    "job","jobRole","application","round","eventA","eventB","notificationA","notificationB",
  ].map(name => [name, randomUUID()])) as Record<string,string>;
  const context: RequestContext = {
    user: { id: ids.user, identityUid: key("positive-"), platformStatus: "ACTIVE", systemRoles: [] },
    membership: {
      id: ids.membership, collegeId: SEED_IDS.collegeA,
      organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["LEARNER"],
    },
  };
  return { ids, context };
}

export async function seedLearnerPositiveFixture(
  pool: Pool,
  fixture: ReturnType<typeof newLearnerPositiveFixture>,
) {
  const { ids, context } = fixture;
  await enableSeedLearnerPlacementAccess(pool);
  await pool.query(
    "INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,'Positive path Learner')",
    [ids.user, context.user.identityUid],
  );
  await pool.query(
    "INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
    [ids.membership,ids.user,SEED_IDS.collegeA],
  );
  await pool.query(
    "INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
    [ids.role,ids.membership],
  );
  const parent = await pool.query<{program_id:string;cohort_id:string}>(
    "SELECT program_id,cohort_id FROM learner_program_enrollments WHERE membership_id=$1 AND status='ACTIVE'",
    [SEED_IDS.learnerCollegeAMembership],
  );
  if (parent.rows.length !== 1) throw new Error("Seed learner academic parent is not unique");
  await pool.query(
    "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')",
    [ids.enrollment,ids.membership,parent.rows[0].program_id,parent.rows[0].cohort_id],
  );
  await pool.query(
    `INSERT INTO placement_eligibility_decisions
      (id,college_id,scope_type,scope_id,status,decided_by_user_id)
      VALUES($1,$2,'MEMBERSHIP',$3,'ELIGIBLE',$4)`,
    [ids.decision,SEED_IDS.collegeA,ids.membership,SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    "INSERT INTO placement_companies(id,name,created_by_user_id) VALUES($1,$2,$3)",
    [ids.company,"Fixture-"+ids.company,SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    "INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)",
    [ids.relation,SEED_IDS.collegeA,ids.company,SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    `INSERT INTO placement_jobs
    (id,college_id,season_id,company_relationship_id,title,description,
     employment_type,work_mode,status,published_at,created_by_user_id)
     VALUES($1,$2,$3,$4,'Positive Assessment','Fixture only',
      'FULL_TIME','REMOTE','PUBLISHED',now(),$5)`,
    [ids.job,SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relation,SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    `INSERT INTO placement_job_role_options
     (id,job_id,title,employment_type,work_mode,is_primary)
     VALUES($1,$2,'Graduate Engineer','FULL_TIME','REMOTE',true)`,
    [ids.jobRole,ids.job],
  );
  await pool.query(
    `INSERT INTO placement_applications
     (id,job_id,role_option_id,membership_id,channel,status,eligibility_status,
      eligibility_snapshot,submitted_by_user_id)
     VALUES($1,$2,$3,$4,'INTERNAL','SUBMITTED','ELIGIBLE','{}'::jsonb,$5)`,
    [ids.application,ids.job,ids.jobRole,ids.membership,ids.user],
  );
  await pool.query(
    `INSERT INTO placement_application_screenings
     (application_id,status,decided_by_user_id,decided_at)
     VALUES($1,'SHORTLISTED',$2,now())`,
    [ids.application,SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    `INSERT INTO placement_job_rounds
     (id,job_id,sequence,kind,name,mode,scheduled_at,timezone,venue,status,created_by_user_id)
     VALUES($1,$2,1,'TEST','Positive test','ON_CAMPUS',
      '2030-10-14T06:00:00Z','Asia/Kolkata','Room 1','SCHEDULED',$3)`,
    [ids.round,ids.job,SEED_IDS.collegeAdminUser],
  );
  for (const [eventId,collegeId,notificationId] of [
    [ids.eventA,SEED_IDS.collegeA,ids.notificationA],
    [ids.eventB,SEED_IDS.collegeB,ids.notificationB],
  ]) {
    await pool.query(
      `INSERT INTO activity_events
       (id,organization_id,college_id,actor_user_id,module,event_type,subject_type,subject_id,summary)
       VALUES($1,$2,$3,$4,'PLACEMENTS','placements.application.submitted',
       'APPLICATION',$5,'Positive fixture')`,
      [eventId,SEED_IDS.organization,collegeId,SEED_IDS.collegeAdminUser,ids.application],
    );
    // A cross-college event cannot notify the College A learner: the
    // registered DB014 recipient guard correctly rejects that write. Keep
    // the foreign notification as valid data for a College B member, so
    // the learner's feed still has a real negative visibility witness.
    const recipientUserId = collegeId === SEED_IDS.collegeB
      ? SEED_IDS.facultyUser
      : ids.user;
    await pool.query(
      "INSERT INTO in_app_notifications(id,user_id,event_id,title,body) VALUES($1,$2,$3,'Fixture alert','Saved on test run')",
      [notificationId,recipientUserId,eventId],
    );
  }
}

export async function cleanupLearnerPositiveFixture(
  pool: Pool,
  fixture: ReturnType<typeof newLearnerPositiveFixture>,
) {
  const { ids } = fixture;
  // Everything inserted above is unique to this invocation. Shared base
  // seed rows, module rules and other tests are left intact.
  await pool.query("DELETE FROM in_app_notifications WHERE id=ANY($1::uuid[])",[[ids.notificationA,ids.notificationB]]);
  await pool.query("DELETE FROM activity_events WHERE id=ANY($1::uuid[])",[[ids.eventA,ids.eventB]]);
  await pool.query("DELETE FROM placement_job_round_events WHERE round_id=$1",[ids.round]);
  await pool.query("DELETE FROM placement_job_rounds WHERE id=$1",[ids.round]);
  await pool.query("DELETE FROM placement_application_status_history WHERE application_id=$1",[ids.application]);
  await pool.query("DELETE FROM placement_application_screenings WHERE application_id=$1",[ids.application]);
  await pool.query("DELETE FROM placement_applications WHERE id=$1",[ids.application]);
  await pool.query("DELETE FROM placement_job_role_options WHERE id=$1",[ids.jobRole]);
  await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
  await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relation]);
  await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
  await pool.query("DELETE FROM placement_eligibility_decisions WHERE id=$1",[ids.decision]);
  await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1",[ids.enrollment]);
  await pool.query("DELETE FROM membership_roles WHERE id=$1",[ids.role]);
  await pool.query("DELETE FROM college_memberships WHERE id=$1",[ids.membership]);
  await pool.query("DELETE FROM users WHERE id=$1",[ids.user]);
}
