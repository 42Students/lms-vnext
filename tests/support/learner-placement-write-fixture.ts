import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * Full disposable learner placement entitlement (V188).
 * The seed provides only a parent organization and admin auditor, never a
 * learner enrollment, membership, entitlement or eligibility decision.
 */
export function newLearnerPlacementWriteFixture() {
  const uuid = () => randomUUID();
  const ids = {
    college: uuid(), department: uuid(), user: uuid(), membership: uuid(),
    role: uuid(), period: uuid(), program: uuid(), cohort: uuid(),
    enrollment: uuid(), access: uuid(), decision: uuid(),
  };
  const suffix=ids.user.slice(0, 10).toUpperCase();
  const context:RequestContext = {
    user: {
      id: ids.user, identityUid: "lpw-" + ids.user,
      platformStatus: "ACTIVE", systemRoles: [],
    },
    membership: {
      id: ids.membership, collegeId: ids.college,
      organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["LEARNER"],
    },
  };
  return { ids, suffix, context };
}

export type LearnerPlacementWriteFixture = ReturnType<typeof newLearnerPlacementWriteFixture>;

export async function seedLearnerPlacementWriteFixture(
  pool:Pool, fixture:LearnerPlacementWriteFixture,
) {
  const {ids, suffix, context}=fixture;
  await pool.query(
    "INSERT INTO colleges(id,organization_id,name,code) VALUES($1,$2,$3,$4)",
    [ids.college,SEED_IDS.organization,"Placement Fixture College "+suffix,"LPW-C-"+suffix],
  );
  await pool.query(
    "INSERT INTO departments(id,college_id,name) VALUES($1,$2,$3)",
    [ids.department,ids.college,"Placement Fixture Department "+suffix],
  );
  await pool.query(
    "INSERT INTO users(id,identity_uid,display_name,platform_status) VALUES($1,$2,$3,'ACTIVE')",
    [ids.user,context.user.identityUid,"Placement Fixture Learner "+suffix],
  );
  await pool.query(
    "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1,$2,$3,'ACTIVE')",
    [ids.membership,ids.user,ids.college],
  );
  await pool.query(
    "INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
    [ids.role,ids.membership],
  );
  await pool.query(
    "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3,$4,'2026-07-01','2027-12-31')",
    [ids.period,ids.college,"Placement Fixture Period "+suffix,"LPW-P-"+suffix],
  );
  await pool.query(
    "INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3,$4,8)",
    [ids.program,ids.department,"Placement Fixture Program "+suffix,"LPW-G-"+suffix],
  );
  // The cohorts insert trigger owns cohort_progression_state creation.
  await pool.query(
    "INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3,$4,$5)",
    [ids.cohort,ids.program,"Placement Fixture Cohort "+suffix,"LPW-B-"+suffix,ids.period],
  );
  await pool.query(
    "INSERT INTO learner_program_enrollments(id,membership_id,program_id,cohort_id,status) VALUES($1,$2,$3,$4,'ACTIVE')",
    [ids.enrollment,ids.membership,ids.program,ids.cohort],
  );
  // Never enable placements at MEMBERSHIP: V188 intentionally ignores it.
  await pool.query(
    "INSERT INTO module_access_rules(id,scope_type,scope_id,module,enabled,locked) VALUES($1,'COLLEGE',$2,'placements',true,false)",
    [ids.access,ids.college],
  );
  await pool.query(
    "INSERT INTO placement_eligibility_decisions(id,college_id,scope_type,scope_id,status,decided_by_user_id) VALUES($1,$2,'MEMBERSHIP',$3,'ELIGIBLE',$4)",
    [ids.decision,ids.college,ids.membership,SEED_IDS.collegeAdminUser],
  );
}

/**
 * Idempotent reverse-FK cleanup. Callers delete only their mutable child
 * rows first. Never delete activity_events, offer/application status history,
 * joining history, or cohort progression history. If immutable evidence owns
 * the actor or offer hierarchy, retain the minimum FK parent identities.
 */
export async function cleanupLearnerPlacementWriteFixture(
  pool:Pool, fixture:LearnerPlacementWriteFixture,
) {
  const {ids}=fixture;
  await pool.query("DELETE FROM placement_candidate_preferences WHERE membership_id=$1",[ids.membership]);
  await pool.query("DELETE FROM placement_eligibility_decisions WHERE id=$1",[ids.decision]);
  await pool.query("DELETE FROM module_access_rules WHERE id=$1",[ids.access]);
  await pool.query("DELETE FROM learner_program_enrollments WHERE id=$1",[ids.enrollment]);
  await pool.query("DELETE FROM cohorts WHERE id=$1",[ids.cohort]);
  await pool.query("DELETE FROM programs WHERE id=$1",[ids.program]);
  await pool.query("DELETE FROM academic_periods WHERE id=$1",[ids.period]);
  await pool.query("DELETE FROM departments WHERE id=$1",[ids.department]);

  const referenced=await pool.query<{preserve:boolean}>(
    "SELECT (EXISTS(SELECT 1 FROM activity_events WHERE actor_user_id=$1 OR actor_membership_id=$2 OR college_id=$3)" +
    " OR EXISTS(SELECT 1 FROM placement_applications WHERE membership_id=$2)" +
    " OR EXISTS(SELECT 1 FROM placement_jobs WHERE college_id=$3)) AS preserve",
    [ids.user,ids.membership,ids.college],
  );
  if (!referenced.rows[0]?.preserve) {
    await pool.query("DELETE FROM membership_roles WHERE id=$1",[ids.role]);
    await pool.query("DELETE FROM college_memberships WHERE id=$1",[ids.membership]);
    await pool.query("DELETE FROM users WHERE id=$1",[ids.user]);
    await pool.query("DELETE FROM colleges WHERE id=$1",[ids.college]);
  }
}
