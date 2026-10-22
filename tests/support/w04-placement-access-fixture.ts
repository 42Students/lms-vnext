import type { Pool } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * The seed only creates learner memberships, not an academic program/cohort.
 * A legacy placement test that uses the learner application/feed APIs must
 * opt in explicitly to both gates before expecting a successful result.
 *
 * Runs only against the disposable PostgreSQL chosen by vitest.db.config.ts.
 * This helper intentionally does not modify shared development/prod seeds.
 */
const W04_FIXTURE_PROGRAM_ID = "9e080001-0000-4000-8000-000000000002";

/**
 * DB02 allows exactly one ACTIVE programme enrolment per membership. The
 * placement opt-in above parks the seeded learner in the W04 fixture
 * programme and (by design) leaves it there for later placement suites, so an
 * academic/course suite that enrols the seeded learner in its own programme
 * must first release that fixture-only enrolment. Placement suites re-create
 * it on demand through enableSeedLearnerPlacementAccess. Only the W04 fixture
 * programme row is touched; no other enrolment of the seeded learner is.
 */
export async function releaseSeedLearnerPlacementEnrollment(pool: Pool) {
  await pool.query(
    `DELETE FROM section_enrollments
      WHERE learner_enrollment_id IN (
        SELECT id FROM learner_program_enrollments
         WHERE membership_id = $1 AND program_id = $2)`,
    [SEED_IDS.learnerCollegeAMembership, W04_FIXTURE_PROGRAM_ID],
  );
  await pool.query(
    `DELETE FROM learner_program_enrollments
      WHERE membership_id = $1 AND program_id = $2`,
    [SEED_IDS.learnerCollegeAMembership, W04_FIXTURE_PROGRAM_ID],
  );
}

export async function enableSeedLearnerPlacementAccess(pool: Pool) {
  const periodId = "9e080001-0000-4000-8000-000000000001";
  const programId = W04_FIXTURE_PROGRAM_ID;
  const cohortId = "9e080001-0000-4000-8000-000000000003";

  await pool.query(
    `INSERT INTO academic_periods
      (id,college_id,name,code,start_date,end_date)
     VALUES ($1,$2,'W04 Placement Fixture','W04-PERIOD','2026-07-01','2026-12-31')
     ON CONFLICT (id) DO NOTHING`,
    [periodId, SEED_IDS.collegeA],
  );
  await pool.query(
    `INSERT INTO programs(id,department_id,name,code,duration_terms)
     VALUES ($1,$2,'W04 Placement Fixture','W04-PROGRAM',8)
     ON CONFLICT (id) DO NOTHING`,
    [programId, SEED_IDS.departmentA],
  );
  await pool.query(
    `INSERT INTO cohorts(id,program_id,name,code,start_period_id)
     VALUES ($1,$2,'W04 Placement Fixture','W04-COHORT',$3)
     ON CONFLICT (id) DO NOTHING`,
    [cohortId, programId, periodId],
  );
  const active = await pool.query<{ id: string }>(
    `SELECT id FROM learner_program_enrollments
      WHERE membership_id = $1 AND status = 'ACTIVE' LIMIT 2`,
    [SEED_IDS.learnerCollegeAMembership],
  );
  if (active.rows.length > 1) {
    throw new Error("W04 test learner has ambiguous active academic enrollments");
  }
  if (active.rows.length === 0) {
    await pool.query(
      `INSERT INTO learner_program_enrollments
        (membership_id,program_id,cohort_id,status)
       VALUES($1,$2,$3,'ACTIVE')`,
      [SEED_IDS.learnerCollegeAMembership, programId, cohortId],
    );
  }

  // Scope is intentionally college-only for the paid module, per V188.
  await pool.query(
    `INSERT INTO module_access_rules(scope_type,scope_id,module,enabled,locked)
     VALUES('COLLEGE',$1,'placements',true,false)
     ON CONFLICT (scope_type,scope_id,module) WHERE scope_id IS NOT NULL
     DO UPDATE SET enabled=true,locked=false,updated_at=now()`,
    [SEED_IDS.collegeA],
  );
  await pool.query(
    `INSERT INTO placement_eligibility_decisions
       (college_id,scope_type,scope_id,status,decided_by_user_id)
     VALUES($1,'MEMBERSHIP',$2,'ELIGIBLE',$3)
     ON CONFLICT(scope_type,scope_id)
     DO UPDATE SET college_id=EXCLUDED.college_id,status='ELIGIBLE',
       reason=NULL,note=NULL,decided_by_user_id=EXCLUDED.decided_by_user_id,
       decided_at=now(),updated_at=now()`,
    [SEED_IDS.collegeA,SEED_IDS.learnerCollegeAMembership,SEED_IDS.collegeAdminUser],
  );

  // P-S1-04: applying requires an explicit PLACEMENTS registration for the
  // learner's active cohort (never inferred from the enrollment).
  const own = await pool.query<{ cohort_id: string }>(
    `SELECT cohort_id FROM learner_program_enrollments
      WHERE membership_id = $1 AND status = 'ACTIVE' LIMIT 1`,
    [SEED_IDS.learnerCollegeAMembership],
  );
  await pool.query(
    `INSERT INTO placement_batch_registrations
       (college_id,cohort_id,membership_id,choice,consent_version,consent_at,source,recorded_by_user_id)
     VALUES ($1,$2,$3,'PLACEMENTS','fixture',now(),'BACKFILL',$4)
     ON CONFLICT (membership_id,cohort_id)
     DO UPDATE SET choice='PLACEMENTS',consent_version='fixture',
       consent_at=now(),source='BACKFILL',recorded_by_user_id=$4`,
    [SEED_IDS.collegeA, own.rows[0]!.cohort_id,
      SEED_IDS.learnerCollegeAMembership, SEED_IDS.collegeAdminUser],
  );
}
