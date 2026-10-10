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
export async function enableSeedLearnerPlacementAccess(pool: Pool) {
  const periodId = "9e080001-0000-4000-8000-000000000001";
  const programId = "9e080001-0000-4000-8000-000000000002";
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
}
