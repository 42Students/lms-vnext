import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DB-018 concurrency witnesses require TEST_DATABASE_URL or DATABASE_URL");
}

const pool = new Pool({ connectionString: databaseUrl, max: 4 });

afterAll(async () => {
  await pool.end();
});

describe("DB-018 registered concurrency witnesses", () => {
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
});
