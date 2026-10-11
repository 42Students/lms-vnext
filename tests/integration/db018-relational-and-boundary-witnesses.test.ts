import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
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
  if (
    !/^[a-zA-Z0-9_ .=<>]+$/.test(probe.from) ||
    !/^[a-zA-Z0-9_ .()=<>]+$/.test(probe.where) ||
    /\b(?:INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|UNION|SELECT)\b/i.test(
      probe.from + " " + probe.where,
    )
  ) {
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
  const primary = aliases[0]!;
  return {
    violations: `SELECT COUNT(*)::bigint AS violations FROM ${probe.from} WHERE ${probe.where}`,
    sample: `SELECT COUNT(*)::bigint AS sample_count FROM ${primary[1]} ${primary[0]}`,
  };
}

async function withRollback(run: (client: PoolClient) => Promise<void>) {
  const client = await db().connect();
  let transaction = false;
  try {
    await client.query("BEGIN");
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
          primaryTablesNonEmpty: nonEmpty.length,
          primaryTablesEmpty: empty.length,
          emptyProbeIds: empty,
          directSqlNegativeCases: 4,
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
        // This is a real PostgreSQL read-only transaction, not a source shim.
        await client.query("SET TRANSACTION READ ONLY");
        const sample = await client.query<{ sample_count: string }>(sql.sample);
        const count = await client.query<{ violations: string }>(sql.violations);
        const n = Number(count.rows[0]?.violations);
        const sampled = Number(sample.rows[0]?.sample_count);
        expect(Number.isSafeInteger(sampled)).toBe(true);
        expect(Number.isSafeInteger(n)).toBe(true);
        if (sampled > 0) nonEmpty.push(probe.id);
        else empty.push(probe.id);
        expect(n, `${probe.id} has relational mismatch rows`).toBe(0);
      });
    });
  }

  it("never reports a completely empty witness fixture as acceptance evidence", () => {
    // For a clean fixture without any source rows, all zeroes are vacuous.
    expect(nonEmpty.length).toBeGreaterThan(0);
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
