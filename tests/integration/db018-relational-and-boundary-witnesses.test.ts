import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import {
  createTenant, createPrincipal, createProjectFixture, createTaskSubmission,
  type PgHarness,
} from "./support/projects-placements-pg-harness";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * DB-018: executable PostgreSQL witnesses for the pre-existing Pass-5 source
 * manifest. Read-only integrity counts are observational, NOT prevention proof.
 *
 * Only enable against an explicitly provisioned disposable PostgreSQL fixture:
 *   DB018_ISOLATED_TEST_DATABASE=1 TEST_DATABASE_URL=postgresql://... \
 *     npx vitest run --config vitest.db.config.ts \
 *     tests/integration/db018-relational-and-boundary-witnesses.test.ts
 *
 * db:verify:independent also sets DB03_ISOLATED_TEST_DATABASE=1 after provisioning
 * a disposable fixture, so this suite executes in that existing verifier.
 *
 * Never fall back to DATABASE_URL. Never print actual row values or credentials.
 */
const url = process.env.TEST_DATABASE_URL;
const enabled =
  Boolean(url) &&
  (process.env.DB018_ISOLATED_TEST_DATABASE === "1" ||
    process.env.DB03_ISOLATED_TEST_DATABASE === "1");
if (enabled) assertDb018DisposableTarget(process.env);
const pool = enabled ? new Pool({ connectionString: url, max: 2 }) : null;

type Probe = {
  id: string;
  family: string;
  from: string;
  where: string;
  tableAliases: Record<string, string>;
  references: string[];
  expectedViolations: number;
  executionEvidence: string;
};

const manifest = JSON.parse(
  readFileSync(
    "docs/planning/database-parity-pass5-probe-manifest.json",
    "utf8",
  ),
) as { probes: Probe[]; status: string };
const probes = manifest.probes;
const nonEmpty: string[] = [];
const empty: string[] = [];

function db(): Pool {
  if (!pool) {
    throw new Error(
      "DB-018 requires disposable TEST_DATABASE_URL and DB018_ISOLATED_TEST_DATABASE=1",
    );
  }
  return pool;
}

/**
 * The SQL source is repository-controlled but still fail closed on unexpected
 * SQL syntax. Probe content is intentionally restricted to identifiers, aliases,
 * equality/inequality comparisons, AND/OR and joins. Semicolons, comments,
 * quotes, functions and subqueries are not accepted.
 */
function sqlFor(probe: Probe): { violations: string; sample: string } {
  if (!/^P5-\d{2}$/.test(probe.id)) {
    throw new Error("Unexpected Pass-5 check ID");
  }
  const table = "[a-z_][a-z0-9_]*";
  const alias = table;
  const column = `${alias}\\.${table}`;
  const equality = `${column}\\s*=\\s*${column}`;
  const fromPattern = new RegExp(
    `^${table}\\s+${alias}(?:\\s+JOIN\\s+${table}\\s+${alias}\\s+ON\\s+${equality})+$`,
    "i",
  );
  const mismatch = `${column}\\s*<>\\s*${column}`;
  const wherePattern = new RegExp(
    `^${mismatch}(?:\\s+OR\\s+${mismatch})*$`,
    "i",
  );
  if (!fromPattern.test(probe.from) || !wherePattern.test(probe.where)) {
    throw new Error(`Unsafe or unreviewed relational witness ${probe.id}`);
  }

  const aliases = Object.entries(probe.tableAliases);
  if (!aliases.length) throw new Error(`Missing aliases for ${probe.id}`);
  for (const [alias, table] of aliases) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(alias) || !/^[a-z_][a-z0-9_]*$/i.test(table)) {
      throw new Error(`Invalid table/alias for ${probe.id}`);
    }
    if (!new RegExp(`\\b${table}\\s+${alias}\\b`).test(probe.from)) {
      throw new Error(`Unbound alias ${alias} for ${probe.id}`);
    }
  }
  for (const ref of probe.references) {
    const [alias, column, extra] = ref.split(".");
    if (extra || !column || !probe.tableAliases[alias] ||
        !/^[a-z_][a-z0-9_]*$/i.test(column)) {
      throw new Error(`Unexpected reference in ${probe.id}`);
    }
  }
  if (probe.expectedViolations !== 0 || probe.executionEvidence !== "NOT_RUN") {
    throw new Error(`Pass-5 ${probe.id} must not inherit fabricated execution evidence`);
  }
  return {
    violations: `SELECT COUNT(*)::bigint AS violations FROM ${probe.from} WHERE ${probe.where}`,
    sample: `SELECT COUNT(*)::bigint AS sample_count FROM ${probe.from}`
  };
}

/**
 * A source-only zero-violation scan of a completely empty database proves
 * nothing. Create real, in-scope academic edges inside each probe's private
 * rollback transaction, so P5-17/18/19 execute against populated joins.
 * No fixture identity or PII escapes; all inserts are rolled back.
 */
const academicFixtureProbes = new Set(["P5-17", "P5-18", "P5-19"]);
const placementFixtureProbes = new Set([
  "P5-07", "P5-08", "P5-09", "P5-10", "P5-11",
]);
const projectFixtureProbes = new Set([
  "P5-01", "P5-02", "P5-03", "P5-04", "P5-05", "P5-06",
]);
const populatedFixtureProbes = new Set([
  ...academicFixtureProbes, ...placementFixtureProbes, ...projectFixtureProbes,
]);

/**
 * Populate project ancestry against this SAME rollback transaction; a
 * different connection would not see the uncommitted seed rows.
 */
async function insertProjectWitnessFixture(client: PoolClient, id: string) {
  if (!projectFixtureProbes.has(id)) throw new Error("Unreviewed project probe fixture");
  let savepointCounter = 0;
  const fixtureDb: PgHarness = {
    client, runId: randomUUID(),
    async query<T extends QueryResultRow = QueryResultRow>(statement: string, args?: unknown[]) {
      return (await client.query<T>(statement, args)).rows;
    },
    async savepoint<T>(work: () => Promise<T>, discard = false): Promise<T> {
      const name = "db018_project_sp_" + ++savepointCounter;
      await client.query("SAVEPOINT " + name);
      try {
        const result = await work();
        await client.query(discard ? "ROLLBACK TO SAVEPOINT " + name : "RELEASE SAVEPOINT " + name);
        if (discard) await client.query("RELEASE SAVEPOINT " + name);
        return result;
      } catch(error) {
        await client.query("ROLLBACK TO SAVEPOINT " + name);
        await client.query("RELEASE SAVEPOINT " + name);
        throw error;
      }
    },
    async expectSqlState() { throw new Error("DB018 project fixture does not perform negative writes"); },
  };
  const tenant = await createTenant(fixtureDb,"DB018 isolated project tenant");
  const admin = await createPrincipal(fixtureDb,tenant,["COLLEGE_ADMIN"]);
  const mentor = await createPrincipal(fixtureDb,tenant,["MENTOR"]);
  const learner = await createPrincipal(fixtureDb,tenant,["LEARNER"]);
  const project = await createProjectFixture(fixtureDb,tenant,admin,mentor,learner);
  if (["P5-02","P5-03","P5-04"].includes(id)) {
    const submission = await createTaskSubmission(fixtureDb,project,learner);
    if (id === "P5-04") {
      // P5-04's relational join uses the optional reviewer member.
      // This row must satisfy the real submitted-vs-reviewed check; an
      // isolated reviewer ID alone would create an impossible state.
      await client.query(
        "UPDATE project_task_submissions SET status='APPROVED', " +
        "reviewed_by_user_id=$1, reviewed_by_membership_id=$2, reviewed_at=now() WHERE id=$3",
        [mentor.userId,mentor.membershipId,submission],
      );
    }
  }
}

async function insertPlacementWitnessFixture(client: PoolClient, id: string) {
  if (!placementFixtureProbes.has(id)) throw new Error("Unreviewed fixture");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const company = randomUUID();
  const relationship = randomUUID();
  const job = randomUUID();
  const role = randomUUID();
  // The seeded fixture already owns the college's one permitted ACTIVE
  // season. Reuse that real FK parent instead of creating a second ACTIVE
  // season, which the unique index correctly prohibits. A fully empty
  // fixture can create a season, entirely within this rollback transaction.
  const existingSeason = await client.query<{ id: string }>(
    "SELECT id FROM placement_seasons WHERE college_id=$1 AND status='ACTIVE' ORDER BY created_at,id LIMIT 1",
    [SEED_IDS.collegeA],
  );
  let season = existingSeason.rows[0]?.id;
  if (!season) {
    season = randomUUID();
    await client.query(
      "INSERT INTO placement_seasons (id,college_id,name,code,start_date,end_date,status,created_by_user_id) VALUES ($1,$2,$3,$4,'2026-07-01','2027-06-30','ACTIVE',$5)",
      [season,SEED_IDS.collegeA,"DB018 isolated season "+suffix,"P5-"+suffix,SEED_IDS.collegeAdminUser],
    );
  }
  await client.query(
    "INSERT INTO placement_companies (id,name,status,created_by_user_id) VALUES ($1,$2,'ACTIVE',$3)",
    [company,"DB018 isolated company "+suffix,SEED_IDS.collegeAdminUser],
  );
  await client.query(
    "INSERT INTO placement_company_relationships (id,college_id,company_id,owner_membership_id,status,created_by_user_id) VALUES ($1,$2,$3,$4,'ACTIVE',$5)",
    [relationship,SEED_IDS.collegeA,company,SEED_IDS.collegeAdminMembership,SEED_IDS.collegeAdminUser],
  );
  await client.query(
    "INSERT INTO placement_jobs (id,college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,published_at,created_by_user_id) VALUES ($1,$2,$3,$4,$5,'DB018 isolated role','FULL_TIME','ONSITE','INTERNAL','PUBLISHED',now(),$6)",
    [job,SEED_IDS.collegeA,season,relationship,"DB018 isolated drive "+suffix,SEED_IDS.collegeAdminUser],
  );
  if (id === "P5-10" || id === "P5-11") {
    await client.query(
      "INSERT INTO placement_job_role_options (id,job_id,title,employment_type,work_mode,is_primary,status) VALUES ($1,$2,'Engineer','FULL_TIME','ONSITE',true,'ACTIVE')",
      [role,job],
    );
    await client.query(
      "INSERT INTO placement_applications (job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id) VALUES ($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4)",
      [job,role,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser],
    );
  }
}



async function insertAcademicWitnessFixture(client: PoolClient, id: string) {
  if (!academicFixtureProbes.has(id)) throw new Error("Unreviewed fixture");
  const program = randomUUID();
  const period = randomUUID();
  const cohort = randomUUID();
  const section = randomUUID();
  const code = randomUUID().replaceAll("-", "").slice(0, 12);
  await client.query(
    "INSERT INTO programs (id,department_id,name,code,duration_terms) VALUES ($1,$2,$3,$4,8)",
    [program, SEED_IDS.departmentA, "DB018 isolated program "+code, "P5-"+code],
  );
  await client.query(
    "INSERT INTO academic_periods (id,college_id,name,code,start_date,end_date,status) VALUES ($1,$2,$3,$4,'2026-01-01','2026-06-30','ACTIVE')",
    [period,SEED_IDS.collegeA,"DB018 isolated period "+code,"P5-"+code],
  );
  await client.query(
    "INSERT INTO cohorts (id,program_id,name,code,start_period_id,status) VALUES ($1,$2,$3,$4,$5,'ACTIVE')",
    [cohort,program,"DB018 isolated cohort "+code,"P5-"+code,period],
  );
  await client.query(
    "INSERT INTO sections (id,cohort_id,academic_period_id,name,code,status) VALUES ($1,$2,$3,$4,$5,'ACTIVE')",
    [section,cohort,period,"DB018 isolated section "+code,"P5-"+code],
  );
  if (id === "P5-19") {
    const course = randomUUID();
    const offering = randomUUID();
    await client.query(
      "INSERT INTO courses (id,department_id,name,code,status) VALUES ($1,$2,$3,$4,'ACTIVE')",
      [course,SEED_IDS.departmentA,"DB018 isolated course "+code,"P5-"+code],
    );
    await client.query(
      "INSERT INTO course_offerings (id,course_id,cohort_id,academic_period_id,type,credits,display_order) VALUES ($1,$2,$3,$4,'CORE',3,0)",
      [offering,course,cohort,period],
    );
    await client.query(
      "INSERT INTO course_section_deliveries (offering_id,section_id) VALUES ($1,$2)",
      [offering,section],
    );
  } else {
    const user = randomUUID();
    const membership = randomUUID();
    const enrollment = randomUUID();
    await client.query(
      "INSERT INTO users (id,identity_uid,display_name,platform_status) VALUES ($1,$2,'DB018 synthetic learner','ACTIVE')",
      [user,"db018-test-"+user],
    );
    await client.query(
      "INSERT INTO college_memberships (id,user_id,college_id,status) VALUES ($1,$2,$3,'ACTIVE')",
      [membership,user,SEED_IDS.collegeA],
    );
    // DB02's registered enrollment guard requires a live LEARNER role.
    // Seed the role inside the same rollback-only transaction so the
    // relational join has real rows without bypassing authorization.
    await client.query(
      "INSERT INTO membership_roles (membership_id,role) VALUES ($1,'LEARNER')",
      [membership],
    );
    await client.query(
      "INSERT INTO learner_program_enrollments (id,membership_id,program_id,cohort_id,status) VALUES ($1,$2,$3,$4,'ACTIVE')",
      [enrollment,membership,program,cohort],
    );
    await client.query(
      "INSERT INTO section_enrollments (learner_enrollment_id,section_id,academic_period_id,status) VALUES ($1,$2,$3,'ACTIVE')",
      [enrollment,section,period],
    );
  }
}

async function withRollback(run: (client: PoolClient) => Promise<void>, readOnly = false) {
  const client = await db().connect();
  let transaction = false;
  try {
    await client.query(readOnly ? "BEGIN READ ONLY" : "BEGIN");
    transaction = true;
    await client.query("SET LOCAL statement_timeout = '8000ms'");
    await client.query("SET LOCAL lock_timeout = '2000ms'");
    await run(client);
  } finally {
    if (transaction) {
      try {
        await client.query("ROLLBACK");
      } finally {
        client.release();
      }
    } else {
      client.release();
    }
  }
}

afterAll(async () => {
  if (enabled) {
    // Coverage counts only: no learner, member or customer data is emitted.
    console.info(
      "DB018 observational witness coverage: " +
        JSON.stringify({
          probes: probes.length,
          joinedSamplesNonEmpty: nonEmpty.length,
          joinedSamplesEmpty: empty.length,
          emptyProbeIds: empty,
          directSqlNegativeCases: 4,
          syntheticRollbackFixtureProbeIds: [...populatedFixtureProbes],
          caveat:
            "Zero violations and nonempty fixture counts do NOT establish prevention; mutation/race witnesses and source semantics still require acceptance.",
        }),
    );
  }
  await pool?.end();
});

describe.skipIf(!enabled)("DB018: Pass-5 relational consistency on disposable PostgreSQL", () => {
  it("has exactly 21 pinned, unique, source-only witnesses", () => {
    expect(manifest.status).toBe("SOURCE_REVIEW_READY_EXECUTION_NOT_RUN");
    expect(probes).toHaveLength(21);
    expect(new Set(probes.map((p) => p.id)).size).toBe(21);
    for (const probe of probes) expect(() => sqlFor(probe)).not.toThrow();
  });

  for (const probe of probes) {
    it(`${probe.id} [${probe.family}] has no existing relational violations`, async () => {
      const sql = sqlFor(probe);
      await withRollback(async (client) => {
        // Fourteen joins now have real in-transaction fixture edges.
        // The other seven remain observational and cannot prove prevention.
        if (academicFixtureProbes.has(probe.id)) {
          await insertAcademicWitnessFixture(client, probe.id);
        }
        if (placementFixtureProbes.has(probe.id)) {
          await insertPlacementWitnessFixture(client, probe.id);
        }
        if (projectFixtureProbes.has(probe.id)) {
          await insertProjectWitnessFixture(client, probe.id);
        }
        const sample = await client.query<{ sample_count: string }>(sql.sample);
        const count = await client.query<{ violations: string }>(sql.violations);
        const n = Number(count.rows[0]?.violations);
        const sampled = Number(sample.rows[0]?.sample_count);
        expect(Number.isSafeInteger(sampled)).toBe(true);
        expect(Number.isSafeInteger(n)).toBe(true);
        if (sampled > 0) nonEmpty.push(probe.id);
        else empty.push(probe.id);
        expect(n, `${probe.id} has relational mismatch rows`).toBe(0);
      }, !populatedFixtureProbes.has(probe.id));
    });
  }

  it("requires real populated academic joins rather than vacuous zeroes", () => {
    // Empty joins in the remaining families stay explicitly unverified.
    // Fixture population is not proof of prevention against invalid writes.
    for (const id of populatedFixtureProbes) expect(nonEmpty).toContain(id);
    expect(nonEmpty.length).toBeGreaterThanOrEqual(populatedFixtureProbes.size);
  });
});

describe.skipIf(!enabled)("DB018: direct-SQL negative database boundaries", () => {
  it("rejects a membership with a nonexistent user using a real FK (23503)", async () => {
    await withRollback(async (client) => {
      await expect(
        client.query(
          "INSERT INTO college_memberships (id, user_id, college_id, status) VALUES ($1,$2,$3,'ACTIVE')",
          [randomUUID(), randomUUID(), SEED_IDS.collegeA],
        ),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("rejects a role grant to a nonexistent membership (23503)", async () => {
    await withRollback(async (client) => {
      await expect(
        client.query(
          "INSERT INTO membership_roles (membership_id, role) VALUES ($1,'LEARNER')",
          [randomUUID()],
        ),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("rejects an unverified primary tenant domain (23514)", async () => {
    await withRollback(async (client) => {
      await expect(
        client.query(
          "INSERT INTO tenant_domains (college_id, host, is_verified, is_primary) VALUES ($1,$2,false,true)",
          [SEED_IDS.collegeA, `db018-${randomUUID()}.example.test`],
        ),
      ).rejects.toMatchObject({
        code: "23514",
        constraint: "tenant_domains_primary_verified_ck",
      });
    });
  });

  it("rejects duplicate user membership within the same college (23505)", async () => {
    await withRollback(async (client) => {
      await expect(
        client.query(
          "INSERT INTO college_memberships (id, user_id, college_id, status) VALUES ($1,$2,$3,'ACTIVE')",
          [randomUUID(), SEED_IDS.collegeAdminUser, SEED_IDS.collegeA],
        ),
      ).rejects.toMatchObject({
        code: "23505",
        constraint: "college_memberships_user_college_uq",
      });
    });
  });
});
