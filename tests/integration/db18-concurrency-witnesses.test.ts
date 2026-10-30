import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL;
const explicitlyIsolated =
  process.env.DB018_ISOLATED_TEST_DATABASE === "1" ||
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
const enabled = Boolean(databaseUrl) && explicitlyIsolated;
if (enabled) assertDb018DisposableTarget(process.env);
const pool = new Pool({
  connectionString:
    databaseUrl ?? "postgresql://disabled:disabled@127.0.0.1:1/disabled",
  max: 4,
});

afterAll(async () => {
  await pool.end();
});

describe.skipIf(!enabled)("DB-018 registered concurrency witnesses", () => {
  it("allows exactly one concurrent cohort compare-and-set transition", async () => {
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
        `DB18 CAS period ${suffix}`,
        `DB18-CASP-${suffix}`,
      ],
    );
    await pool.query(
      `insert into programs
         (id, department_id, name, code, duration_terms, status)
       values ($1, $2, $3, $4, 8, 'ACTIVE')`,
      [
        programId,
        SEED_IDS.departmentA,
        `DB18 CAS program ${suffix}`,
        `DB18-CASPR-${suffix}`,
      ],
    );
    await pool.query(
      `insert into cohorts
         (id, program_id, name, code, start_period_id, status)
       values ($1, $2, $3, $4, $5, 'PLANNED')`,
      [
        cohortId,
        programId,
        `DB18 CAS cohort ${suffix}`,
        `DB18-CASC-${suffix}`,
        periodId,
      ],
    );

    try {
      const contenders = await Promise.all([
        pool.query(
          `update cohorts
             set status = 'ACTIVE', updated_at = now()
           where id = $1 and status = 'PLANNED'
           returning id`,
          [cohortId],
        ),
        pool.query(
          `update cohorts
             set status = 'ACTIVE', updated_at = now()
           where id = $1 and status = 'PLANNED'
           returning id`,
          [cohortId],
        ),
      ]);

      expect(
        contenders.reduce(
          (total, result) => total + (result.rowCount ?? 0),
          0,
        ),
      ).toBe(1);

      const final = await pool.query<{ status: string }>(
        "select status from cohorts where id = $1",
        [cohortId],
      );
      expect(final.rows[0]?.status).toBe("ACTIVE");
    } finally {
      await pool.query("delete from cohorts where id = $1", [cohortId]);
      await pool.query("delete from programs where id = $1", [programId]);
      await pool.query("delete from academic_periods where id = $1", [periodId]);
    }
  });

  it("allows exactly one concurrent project task submission transition", async () => {
    const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
    const templateId = randomUUID();
    const versionId = randomUUID();
    const projectId = randomUUID();
    const releaseId = randomUUID();
    const sprintId = randomUUID();
    const taskId = randomUUID();

    // DB071: the initially absent snapshot is permitted only inside the
    // same transaction that inserts the immutable revision.
    const client=await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `insert into project_templates
           (id, slug, title, status, current_version, created_by_user_id)
         values ($1, $2, $3, 'PUBLISHED', 1, $4)`,
        [templateId,`db18-cas-${suffix}`,`DB18 CAS template ${suffix}`,SEED_IDS.collegeAdminUser],
      );
      await client.query(
        `insert into project_template_versions
           (id, template_id, version, title, blueprint, created_by_user_id)
         values ($1, $2, 1, $3, '{}'::jsonb, $4)`,
        [versionId,templateId,`DB18 CAS template v1 ${suffix}`,SEED_IDS.collegeAdminUser],
      );
      await client.query("COMMIT");
    } catch(error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
    await pool.query(
      `insert into project_instances
         (id, college_id, template_id, template_version_id, slug, title,
          status, created_by_user_id)
       values ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7)`,
      [
        projectId,
        SEED_IDS.collegeA,
        templateId,
        versionId,
        `db18-project-${suffix}`,
        `DB18 project ${suffix}`,
        SEED_IDS.collegeAdminUser,
      ],
    );
    await pool.query(
      `insert into project_releases
         (id, project_id, template_key, title, sequence, status)
       values ($1, $2, 'release-1', 'DB18 release', 0, 'IN_PROGRESS')`,
      [releaseId, projectId],
    );
    await pool.query(
      `insert into project_sprints
         (id, project_id, release_id, template_key, title, sequence, status)
       values ($1, $2, $3, 'sprint-1', 'DB18 sprint', 0, 'ACTIVE')`,
      [sprintId, projectId, releaseId],
    );
    await pool.query(
      `insert into project_tasks
         (id, project_id, sprint_id, template_key, title, priority, status, sequence)
       values ($1, $2, $3, 'task-1', 'DB18 task', 'MEDIUM', 'IN_PROGRESS', 0)`,
      [taskId, projectId, sprintId],
    );

    const contender = async () => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const won = await client.query<{ id: string }>(
          `update project_tasks
             set status = 'IN_REVIEW', updated_at = now()
           where id = $1
             and status <> 'DONE'
             and status <> 'IN_REVIEW'
           returning id`,
          [taskId],
        );
        if ((won.rowCount ?? 0) === 0) {
          await client.query("COMMIT");
          return false;
        }
        await client.query(
          `insert into project_task_submissions
             (project_id, task_id, version, submitted_by_membership_id, submission_url)
           values ($1, $2, 1, $3, $4)`,
          [
            projectId,
            taskId,
            SEED_IDS.learnerCollegeAMembership,
            `https://example.test/db18/${suffix}`,
          ],
        );
        await client.query("COMMIT");
        return true;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    };

    try {
      const winners = await Promise.all([contender(), contender()]);
      expect(winners.filter(Boolean)).toHaveLength(1);

      const [task, submissions] = await Promise.all([
        pool.query<{ status: string }>(
          "select status from project_tasks where id = $1",
          [taskId],
        ),
        pool.query<{ version: number; status: string }>(
          `select version, status
             from project_task_submissions
            where task_id = $1
            order by version`,
          [taskId],
        ),
      ]);
      expect(task.rows[0]?.status).toBe("IN_REVIEW");
      expect(submissions.rows).toEqual([
        { version: 1, status: "SUBMITTED" },
      ]);
    } finally {
      await pool.query("delete from project_task_submissions where task_id = $1", [taskId]);
      await pool.query("delete from project_tasks where id = $1", [taskId]);
      await pool.query("delete from project_sprints where id = $1", [sprintId]);
      await pool.query("delete from project_releases where id = $1", [releaseId]);
      await pool.query("delete from project_instances where id = $1", [projectId]);
      // DB070 immutable revisions and DB071 header pointers are permanent;
      // only disposable, UUID-unique fixture state is retained.
      const retention=await pool.query<{retainHistory:boolean}>("select (exists (select 1 from pg_trigger where tgrelid='project_template_versions'::regclass " +
      "and tgname='db07_project_template_versions_append_only' and tgenabled='O') " +
      "or exists (select 1 from pg_constraint where conrelid='project_templates'::regclass " +
      "and conname='project_templates_current_version_snapshot_fk')) as \"retainHistory\"");
      if(!retention.rows[0]?.retainHistory){
        await pool.query("delete from project_template_versions where id = $1", [versionId]);
        await pool.query("delete from project_templates where id = $1", [templateId]);
      }
    }
  });

});
