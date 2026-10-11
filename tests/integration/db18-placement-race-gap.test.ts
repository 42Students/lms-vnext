import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DB-018 placement race witness requires TEST_DATABASE_URL or DATABASE_URL");
}

const pool = new Pool({ connectionString: databaseUrl, max: 4 });

afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("DB-018 known placement race gap (red until fixed)", () => {
  it("P5-R01 rejects placement application if paid access is revoked after precheck", async () => {
    const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
    const collegeId = randomUUID();
    const departmentId = randomUUID();
    const learnerUserId = randomUUID();
    const membershipId = randomUUID();
    const membershipRoleId = randomUUID();
    const periodId = randomUUID();
    const programId = randomUUID();
    const cohortId = randomUUID();
    const enrollmentId = randomUUID();
    const moduleRuleId = randomUUID();
    const decisionId = randomUUID();
    const seasonId = randomUUID();
    const companyId = randomUUID();
    const relationshipId = randomUUID();
    const jobId = randomUUID();
    const roleOptionId = randomUUID();

    const learner: RequestContext = {
      user: {
        id: learnerUserId,
        identityUid: `db18-placement-${suffix}`,
        platformStatus: "ACTIVE",
        systemRoles: [],
      },
      membership: {
        id: membershipId,
        collegeId,
        organizationId: SEED_IDS.organization,
        status: "ACTIVE",
        roles: ["LEARNER"],
      },
    };

    await pool.query(
      `insert into colleges
         (id, organization_id, name, code, status)
       values ($1, $2, $3, $4, 'ACTIVE')`,
      [collegeId, SEED_IDS.organization, `DB18 placement college ${suffix}`, `DB18-PC-${suffix}`],
    );
    await pool.query(
      "insert into departments (id, college_id, name) values ($1, $2, $3)",
      [departmentId, collegeId, `DB18 placement department ${suffix}`],
    );
    await pool.query(
      `insert into users (id, identity_uid, display_name, platform_status)
       values ($1, $2, $3, 'ACTIVE')`,
      [learnerUserId, `db18-placement-${suffix}`, `DB18 placement learner ${suffix}`],
    );
    await pool.query(
      `insert into college_memberships (id, user_id, college_id, status)
       values ($1, $2, $3, 'ACTIVE')`,
      [membershipId, learnerUserId, collegeId],
    );
    await pool.query(
      `insert into membership_roles (id, membership_id, role)
       values ($1, $2, 'LEARNER')`,
      [membershipRoleId, membershipId],
    );
    await pool.query(
      `insert into academic_periods
         (id, college_id, name, code, start_date, end_date, status)
       values ($1, $2, $3, $4, '2026-01-01', '2026-06-30', 'ACTIVE')`,
      [periodId, collegeId, `DB18 placement period ${suffix}`, `DB18-PP-${suffix}`],
    );
    await pool.query(
      `insert into programs
         (id, department_id, name, code, duration_terms, status)
       values ($1, $2, $3, $4, 8, 'ACTIVE')`,
      [programId, departmentId, `DB18 placement program ${suffix}`, `DB18-PPR-${suffix}`],
    );
    await pool.query(
      `insert into cohorts
         (id, program_id, name, code, start_period_id, status)
       values ($1, $2, $3, $4, $5, 'ACTIVE')`,
      [cohortId, programId, `DB18 placement cohort ${suffix}`, `DB18-PCO-${suffix}`, periodId],
    );
    await pool.query(
      `insert into learner_program_enrollments
         (id, membership_id, program_id, cohort_id, status)
       values ($1, $2, $3, $4, 'ACTIVE')`,
      [enrollmentId, membershipId, programId, cohortId],
    );
    await pool.query(
      `insert into module_access_rules
         (id, scope_type, scope_id, module, enabled)
       values ($1, 'COLLEGE', $2, 'placements', true)`,
      [moduleRuleId, collegeId],
    );
    await pool.query(
      `insert into placement_eligibility_decisions
         (id, college_id, scope_type, scope_id, status, decided_by_user_id)
       values ($1, $2, 'COHORT', $3, 'ELIGIBLE', $4)`,
      [decisionId, collegeId, cohortId, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      `insert into placement_seasons
         (id, college_id, name, code, start_date, end_date, status, created_by_user_id)
       values ($1, $2, $3, $4, '2026-07-01', '2027-06-30', 'ACTIVE', $5)`,
      [seasonId, collegeId, `DB18 placement season ${suffix}`, `DB18-PS-${suffix}`, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      `insert into placement_companies (id, name, status, created_by_user_id)
       values ($1, $2, 'ACTIVE', $3)`,
      [companyId, `DB18 placement company ${suffix}`, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      `insert into placement_company_relationships
         (id, college_id, company_id, status, created_by_user_id)
       values ($1, $2, $3, 'ACTIVE', $4)`,
      [relationshipId, collegeId, companyId, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      `insert into placement_jobs
         (id, college_id, season_id, company_relationship_id, title, description,
          employment_type, work_mode, application_mode, status, published_at,
          created_by_user_id)
       values ($1, $2, $3, $4, $5, 'DB18 race job',
               'FULL_TIME', 'ONSITE', 'INTERNAL', 'PUBLISHED', now(), $6)`,
      [jobId, collegeId, seasonId, relationshipId, `DB18 placement job ${suffix}`, SEED_IDS.collegeAdminUser],
    );
    await pool.query(
      `insert into placement_job_role_options
         (id, job_id, title, employment_type, work_mode, is_primary, status)
       values ($1, $2, 'Engineer', 'FULL_TIME', 'ONSITE', true, 'ACTIVE')`,
      [roleOptionId, jobId],
    );

    const blocker = await pool.connect();
    let blockerOpen = false;
    try {
      await blocker.query("BEGIN");
      blockerOpen = true;
      // A correct fix should take a lock/read which orders with the paid
      // module writer. Current code only performs ordinary pre-transaction
      // reads, then later blocks on the membership FK during application insert.
      await blocker.query(
        "select id from module_access_rules where id = $1 for update",
        [moduleRuleId],
      );
      await blocker.query(
        "select id from college_memberships where id = $1 for update",
        [membershipId],
      );

      const pending = applyToPlacementJob(learner, jobId, {
        roleOptionId,
      }).then(
        (value) => ({ kind: "resolved" as const, value }),
        (error: unknown) => ({ kind: "rejected" as const, error }),
      );

      const deadline = Date.now() + 5_000;
      let blocked = false;
      while (Date.now() < deadline) {
        const waiting = await pool.query<{ query: string }>(
          `select query
             from pg_stat_activity
            where datname = current_database()
              and pid <> pg_backend_pid()
              and wait_event_type = 'Lock'
              and (
                query ilike '%placement_applications%'
                or query ilike '%module_access_rules%'
              )
            limit 1`,
        );
        if (waiting.rowCount) {
          blocked = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(blocked).toBe(true);

      // This update happens in the same transaction holding the rule row lock.
      // Pre-transaction readers have already observed enabled=true. A future
      // transactional locking recheck resumes after COMMIT and observes false.
      await blocker.query(
        "update module_access_rules set enabled = false, updated_at = now() where id = $1",
        [moduleRuleId],
      );
      await blocker.query("COMMIT");
      blockerOpen = false;

      const outcome = await pending;
      expect(outcome.kind).toBe("rejected");

      const persisted = await pool.query<{ count: string }>(
        `select count(*)::text as count
           from placement_applications
          where job_id = $1 and membership_id = $2`,
        [jobId, membershipId],
      );
      expect(persisted.rows[0]?.count).toBe("0");
    } finally {
      if (blockerOpen) {
        await blocker.query("ROLLBACK").catch(() => undefined);
      }
      blocker.release();

      const applications = await pool.query<{ id: string }>(
        "select id from placement_applications where job_id = $1 and membership_id = $2",
        [jobId, membershipId],
      );
      const applicationIds = applications.rows.map((row) => row.id);
      if (applicationIds.length > 0) {
        await pool.query(
          `delete from in_app_notifications
            where event_id in (
              select id from activity_events
               where subject_type = 'placement_application'
                 and subject_id = any($1::text[])
            )`,
          [applicationIds],
        );
        await pool.query(
          `delete from activity_events
            where subject_type = 'placement_application'
              and subject_id = any($1::text[])`,
          [applicationIds],
        );
        await pool.query(
          "delete from placement_application_screenings where application_id = any($1::uuid[])",
          [applicationIds],
        );
        await pool.query(
          "delete from placement_application_status_history where application_id = any($1::uuid[])",
          [applicationIds],
        );
        await pool.query(
          "delete from placement_applications where id = any($1::uuid[])",
          [applicationIds],
        );
      }
      await pool.query("delete from placement_job_role_options where id = $1", [roleOptionId]);
      await pool.query("delete from placement_jobs where id = $1", [jobId]);
      await pool.query("delete from placement_company_relationships where id = $1", [relationshipId]);
      await pool.query("delete from placement_companies where id = $1", [companyId]);
      await pool.query("delete from placement_seasons where id = $1", [seasonId]);
      await pool.query("delete from placement_eligibility_decisions where id = $1", [decisionId]);
      await pool.query("delete from module_access_rules where id = $1", [moduleRuleId]);
      await pool.query("delete from learner_program_enrollments where id = $1", [enrollmentId]);
      await pool.query("delete from cohorts where id = $1", [cohortId]);
      await pool.query("delete from programs where id = $1", [programId]);
      await pool.query("delete from academic_periods where id = $1", [periodId]);
      await pool.query("delete from membership_roles where id = $1", [membershipRoleId]);
      await pool.query("delete from college_memberships where id = $1", [membershipId]);
      await pool.query("delete from users where id = $1", [learnerUserId]);
      await pool.query("delete from departments where id = $1", [departmentId]);
      await pool.query("delete from colleges where id = $1", [collegeId]);
    }
  });
});
