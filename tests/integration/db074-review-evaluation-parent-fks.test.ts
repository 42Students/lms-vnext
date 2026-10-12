import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

/** DB074: opt-in against registered candidate on disposable test PostgreSQL.
 * Authored tests do not certify source parity without execution.
 * No migration, table mutation outside rollback or destructive reset here.
 */
const enabled = process.env.DB074_REVIEW_EVALUATION_ENFORCED === "1";
if (enabled) {
  assertDb018DisposableTarget({ ...process.env, DB018_ISOLATED_TEST_DATABASE: "1" });
}
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

type Fixture = {
  client: PoolClient;
  projectA: string;
  projectB: string;
  submissionA: string;
  submissionB: string;
};

async function withFixture(run: (fixture: Fixture) => Promise<void>) {
  if (!pool) throw new Error("DB074 PostgreSQL suite is disabled");
  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    const templateId = randomUUID(), versionId = randomUUID();
    const projectA = randomUUID(), projectB = randomUUID();
    const submissionA = randomUUID(), submissionB = randomUUID();
    await client.query(
      `INSERT INTO project_templates (id, slug, title, created_by_user_id)
       VALUES ($1, $2, 'DB074 project template', $3)`,
      [templateId, `db074-${templateId}`, SEED_IDS.superAdminUser],
    );
    await client.query(
      `INSERT INTO project_template_versions
        (id, template_id, version, title, blueprint, created_by_user_id)
       VALUES ($1, $2, 1, 'DB074 version', '{}'::jsonb, $3)`,
      [versionId, templateId, SEED_IDS.superAdminUser],
    );
    await client.query(
      `INSERT INTO project_instances
        (id, college_id, template_id, template_version_id,
         slug, title, created_by_user_id)
       VALUES ($1, $3, $4, $5, $6, 'DB074 A', $8),
              ($2, $3, $4, $5, $7, 'DB074 B', $8)`,
      [projectA, projectB, SEED_IDS.collegeA, templateId, versionId,
        `db074-a-${projectA}`, `db074-b-${projectB}`,
        SEED_IDS.superAdminUser],
    );
    await client.query(
      `INSERT INTO project_submissions
        (id, project_id, version, status, summary,
         created_by_membership_id, submitted_by_membership_id, submitted_at)
       VALUES
        ($1, $3, 1, 'SUBMITTED', 'DB074 A', $5, $5, now()),
        ($2, $4, 1, 'SUBMITTED', 'DB074 B', $5, $5, now())`,
      [submissionA, submissionB, projectA, projectB,
        SEED_IDS.learnerCollegeAMembership],
    );
    await run({ client, projectA, projectB, submissionA, submissionB });
  } finally {
    try {
      if (transactionOpen) await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}

async function insertReview(
  f: Fixture, projectId: string, submissionId: string,
) {
  const id = randomUUID();
  const response = await f.client.query(
    `INSERT INTO project_submission_reviews
      (id, project_id, submission_id, decision, reviewed_by_user_id)
     VALUES ($1, $2, $3, 'APPROVED', $4) RETURNING id`,
    [id, projectId, submissionId, SEED_IDS.superAdminUser],
  );
  expect(response.rowCount).toBe(1);
  return id;
}

async function insertEvaluation(
  f: Fixture, projectId: string, submissionId: string,
) {
  const id = randomUUID();
  const response = await f.client.query(
    `INSERT INTO project_evaluations
      (id, project_id, submission_id, evaluator_user_id, total_score, max_score)
     VALUES ($1, $2, $3, $4, 4, 5) RETURNING id`,
    [id, projectId, submissionId, SEED_IDS.superAdminUser],
  );
  expect(response.rowCount).toBe(1);
  return id;
}

const requiredConstraints = [
  ["project_submission_reviews_project_submission_fk", "project_submission_reviews"],
  ["project_evaluations_project_submission_fk", "project_evaluations"],
] as const;

describe.skipIf(!enabled)("DB074 submission review / evaluation project ancestry", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("DB074 pool absent");
    const results = await pool.query<{
      conname: string;
      table_name: string;
      def: string;
      contype: string;
      convalidated: boolean;
    }>(
      `SELECT con.conname, cls.relname AS table_name, con.contype, con.convalidated,
              pg_get_constraintdef(con.oid) AS def
         FROM pg_constraint con
         JOIN pg_class cls ON cls.oid = con.conrelid
        WHERE con.conname = ANY($1::text[])`,
      [requiredConstraints.map(([name]) => name)],
    );
    expect(results.rows).toHaveLength(2);
    for (const [name, table] of requiredConstraints) {
      const actual = results.rows.find((row) => row.conname === name);
      expect(actual).toMatchObject({
        table_name: table, contype: "f", convalidated: true,
      });
      expect(actual?.def).toMatch(
        /FOREIGN KEY \(project_id, submission_id\) REFERENCES project_submissions\(project_id, id\)/i,
      );
    }
  });
  afterAll(async () => { if (pool) await pool.end(); });

  it("allows same-project review", async () => {
    await withFixture(async (f) => {
      const id = await insertReview(f, f.projectA, f.submissionA);
      const result = await f.client.query(
        "SELECT project_id, submission_id FROM project_submission_reviews WHERE id = $1",
        [id],
      );
      expect(result.rows[0]).toMatchObject({
        project_id: f.projectA, submission_id: f.submissionA,
      });
    });
  });

  it("blocks a review of a different project's submission", async () => {
    await withFixture(async (f) => {
      await expect(insertReview(f, f.projectA, f.submissionB))
        .rejects.toMatchObject({
          code: "23503",
          constraint: "project_submission_reviews_project_submission_fk",
        });
    });
  });

  it("blocks moving an existing review to a foreign submission", async () => {
    await withFixture(async (f) => {
      const id = await insertReview(f, f.projectA, f.submissionA);
      await expect(f.client.query(
        "UPDATE project_submission_reviews SET submission_id=$1 WHERE id=$2",
        [f.submissionB, id],
      )).rejects.toMatchObject({
        code: "23503",
        constraint: "project_submission_reviews_project_submission_fk",
      });
    });
  });

  it("allows same-project evaluation", async () => {
    await withFixture(async (f) => {
      const id = await insertEvaluation(f, f.projectA, f.submissionA);
      const result = await f.client.query(
        "SELECT project_id, submission_id FROM project_evaluations WHERE id=$1",
        [id],
      );
      expect(result.rows[0]).toMatchObject({
        project_id: f.projectA, submission_id: f.submissionA,
      });
    });
  });

  it("blocks evaluation for another project's submission", async () => {
    await withFixture(async (f) => {
      await expect(insertEvaluation(f, f.projectA, f.submissionB))
        .rejects.toMatchObject({
          code: "23503",
          constraint: "project_evaluations_project_submission_fk",
        });
    });
  });

  it("blocks moving an existing evaluation to a foreign submission", async () => {
    await withFixture(async (f) => {
      const id = await insertEvaluation(f, f.projectA, f.submissionA);
      await expect(f.client.query(
        "UPDATE project_evaluations SET submission_id=$1 WHERE id=$2",
        [f.submissionB, id],
      )).rejects.toMatchObject({
        code: "23503",
        constraint: "project_evaluations_project_submission_fk",
      });
    });
  });
});
