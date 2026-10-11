import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createLearnerProgramEnrollment } from "@/modules/academics/enrollment-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL;
const explicitlyIsolated =
  process.env.DB018_ISOLATED_TEST_DATABASE === "1" ||
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
const serviceTargetMatches = process.env.DATABASE_URL === databaseUrl;
const enabled = Boolean(databaseUrl) && explicitlyIsolated && serviceTargetMatches;
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({
  connectionString:
    databaseUrl ?? "postgresql://disabled:disabled@127.0.0.1:1/disabled",
  max: 4,
});

const collegeAdmin: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

async function waitForBlockedQuery(fragment: string) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const blocked = await pool.query<{ pid: number }>(
      `select pid
         from pg_stat_activity
        where datname = current_database()
          and pid <> pg_backend_pid()
          and wait_event_type = 'Lock'
          and query ilike $1
        limit 1`,
      [`%${fragment}%`],
    );
    if (blocked.rowCount) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Timed out waiting for blocked SQL containing ${fragment}`);
}

describe.skipIf(!enabled)("DB-018 known race gaps (red until domain fixes land)", () => {
  it("P5-R02 rejects enrollment if the cohort stops being mutable after precheck", async () => {
    const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
    const periodId = randomUUID();
    const programId = randomUUID();
    const cohortId = randomUUID();

    await pool.query(
      `insert into academic_periods
         (id, college_id, name, code, start_date, end_date, status)
       values ($1, $2, $3, $4, '2026-01-01', '2026-06-30', 'ACTIVE')`,
      [
        periodId,
        SEED_IDS.collegeA,
        `DB18 race period ${suffix}`,
        `DB18-RP-${suffix}`,
      ],
    );
    await pool.query(
      `insert into programs
         (id, department_id, name, code, duration_terms, status)
       values ($1, $2, $3, $4, 8, 'ACTIVE')`,
      [
        programId,
        SEED_IDS.departmentA,
        `DB18 race program ${suffix}`,
        `DB18-RPR-${suffix}`,
      ],
    );
    await pool.query(
      `insert into cohorts
         (id, program_id, name, code, start_period_id, status)
       values ($1, $2, $3, $4, $5, 'ACTIVE')`,
      [
        cohortId,
        programId,
        `DB18 race cohort ${suffix}`,
        `DB18-RC-${suffix}`,
        periodId,
      ],
    );

    const blocker = await pool.connect();
    let blockerOpen = false;
    try {
      await blocker.query("BEGIN");
      blockerOpen = true;
      // createLearnerProgramEnrollment does not query this table before its
      // write transaction. The ACCESS EXCLUSIVE lock therefore lets all
      // program/cohort/membership prechecks finish, then deterministically
      // pauses the insert at the exact stale-check window.
      await blocker.query(
        "lock table learner_program_enrollments in access exclusive mode",
      );

      const pending = createLearnerProgramEnrollment(collegeAdmin, {
        membershipId: SEED_IDS.learnerCollegeAMembership,
        programId,
        cohortId,
      }).then(
        (value) => ({ kind: "resolved" as const, value }),
        (error: unknown) => ({ kind: "rejected" as const, error }),
      );

      await waitForBlockedQuery("learner_program_enrollments");

      await pool.query(
        "update cohorts set status = 'COMPLETED', updated_at = now() where id = $1",
        [cohortId],
      );

      await blocker.query("COMMIT");
      blockerOpen = false;

      const outcome = await pending;

      // Correct behavior after the DB02/academics fix: the transaction must
      // lock/re-read cohort state and reject instead of persisting enrollment.
      expect(outcome.kind).toBe("rejected");
      if (outcome.kind === "rejected") {
        expect(outcome.error).toMatchObject({
          code: "COHORT_NOT_MUTABLE",
        });
      }
    } finally {
      if (blockerOpen) {
        await blocker.query("ROLLBACK").catch(() => undefined);
      }
      blocker.release();

      await pool.query(
        `delete from activity_events
          where subject_type = 'learner_program_enrollment'
            and subject_id in (
              select id::text
                from learner_program_enrollments
               where membership_id = $1 and program_id = $2 and cohort_id = $3
            )`,
        [
          SEED_IDS.learnerCollegeAMembership,
          programId,
          cohortId,
        ],
      );
      await pool.query(
        `delete from learner_program_enrollments
          where membership_id = $1 and program_id = $2 and cohort_id = $3`,
        [
          SEED_IDS.learnerCollegeAMembership,
          programId,
          cohortId,
        ],
      );
      await pool.query("delete from cohorts where id = $1", [cohortId]);
      await pool.query("delete from programs where id = $1", [programId]);
      await pool.query("delete from academic_periods where id = $1", [periodId]);
    }
  });
});
