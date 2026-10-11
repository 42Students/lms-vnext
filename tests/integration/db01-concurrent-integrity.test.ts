import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * Chat 2 / DB-004: concurrent integrity witnesses for registered vNext DB01.
 *
 * Parallel writes use independent PostgreSQL pool connections. Tests create
 * random, disposable records and clean up in finally blocks because successful
 * race winners must COMMIT for a unique index to reject the losing statement.
 * Run only against an explicitly provisioned disposable TEST_DATABASE_URL.
 *
 * Passing proves a uniqueness result under two attempted concurrent writes,
 * NOT full serializable business transitions or migration/legacy parity.
 */
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DB01 concurrency witnesses require explicit TEST_DATABASE_URL");
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 4,
  statement_timeout: 10_000,
  query_timeout: 15_000,
});

type PgFailure = { code?: string; constraint?: string };

async function exactlyOneWins(
  firstSql: string,
  firstParams: unknown[],
  secondSql: string,
  secondParams: unknown[],
  expectedConstraint: string,
) {
  const outcomes = await Promise.allSettled([
    pool.query(firstSql, firstParams),
    pool.query(secondSql, secondParams),
  ]);
  const winners = outcomes.filter(
    (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof pool.query>>> =>
      result.status === "fulfilled",
  );
  const rejected = outcomes.filter(
    (result): result is PromiseRejectedResult =>
      result.status === "rejected",
  );
  expect(winners).toHaveLength(1);
  expect(rejected).toHaveLength(1);
  const failure = rejected[0]?.reason as PgFailure | undefined;
  expect(failure).toMatchObject({
    code: "23505",
    constraint: expectedConstraint,
  });
}

afterAll(async () => {
  await pool.end();
});

describe("DB01 same-key concurrent PostgreSQL writes", () => {
  it("permits exactly one college to claim the same case-folded hostname", async () => {
    const host = `db01-race-${randomUUID()}.example.test`;
    try {
      await exactlyOneWins(
        "insert into tenant_domains (college_id, host) values ($1, $2)",
        [SEED_IDS.collegeA, host],
        "insert into tenant_domains (college_id, host) values ($1, $2)",
        [SEED_IDS.collegeB, host.toUpperCase()],
        "tenant_domains_host_uq",
      );
    } finally {
      await pool.query("delete from tenant_domains where lower(host) = lower($1)", [host]);
    }
  });

  it("permits exactly one active organization with the same normalized name", async () => {
    const name = `DB01 Race Organization ${randomUUID()}`;
    try {
      await exactlyOneWins(
        "insert into organizations (name, status) values ($1, 'ACTIVE')",
        [name],
        "insert into organizations (name, status) values ($1, 'ACTIVE')",
        [name.toUpperCase()],
        "organizations_active_name_uq",
      );
    } finally {
      await pool.query("delete from organizations where lower(name) = lower($1)", [name]);
    }
  });

  it("permits exactly one college with the same normalized code", async () => {
    const code = `DB01-RACE-${randomUUID()}`;
    try {
      await exactlyOneWins(
        "insert into colleges (organization_id, name, code) values ($1, $2, $3)",
        [SEED_IDS.organization, "Race College One", code],
        "insert into colleges (organization_id, name, code) values ($1, $2, $3)",
        [SEED_IDS.organization, "Race College Two", code.toLowerCase()],
        "colleges_code_uq",
      );
    } finally {
      await pool.query("delete from colleges where lower(code) = lower($1)", [code]);
    }
  });

  it("permits exactly one user with a reused provider identity UID", async () => {
    const identityUid = `db01-race-uid-${randomUUID()}`;
    try {
      await exactlyOneWins(
        "insert into users (identity_uid, display_name) values ($1, 'one')",
        [identityUid],
        "insert into users (identity_uid, display_name) values ($1, 'two')",
        [identityUid],
        "users_identity_uid_unique",
      );
    } finally {
      await pool.query("delete from users where identity_uid = $1", [identityUid]);
    }
  });

  it("permits exactly one user to claim a case-folded email address", async () => {
    const email = `db01-race-${randomUUID()}@example.test`;
    try {
      await exactlyOneWins(
        "insert into users (identity_uid, email) values ($1, $2)",
        [`db01-race-user-${randomUUID()}`, email],
        "insert into users (identity_uid, email) values ($1, $2)",
        [`db01-race-user-${randomUUID()}`, email.toUpperCase()],
        "users_email_ci_uq",
      );
    } finally {
      await pool.query("delete from users where lower(email) = lower($1)", [email]);
    }
  });

  it("permits only one verified primary domain for a college under concurrent promotion", async () => {
    const hostA = `db01-primary-a-${randomUUID()}.example.test`;
    const hostB = `db01-primary-b-${randomUUID()}.example.test`;
    const ids: string[] = [];
    try {
      const rows = await pool.query<{ id: string }>(
        `insert into tenant_domains
          (college_id, host, is_verified, is_primary)
         values ($1, $2, true, false), ($1, $3, true, false)
         returning id`,
        [SEED_IDS.collegeA, hostA, hostB],
      );
      ids.push(...rows.rows.map((row) => row.id));
      expect(ids).toHaveLength(2);
      // A test seeded primary would cause both writes to fail, so ensure
      // this user-owned college has no primary (without disturbing seed).
      const seededPrimary = await pool.query(
        "select 1 from tenant_domains where college_id = $1 and is_primary = true",
        [SEED_IDS.collegeA],
      );
      if (seededPrimary.rowCount !== 0) {
        // When tests run against stale shared fixtures, do not misdiagnose
        // their pre-existing primary as a concurrency race.
        throw new Error("DB01 primary race fixture requires a college without an existing primary");
      }
      await exactlyOneWins(
        "update tenant_domains set is_primary = true where id = $1",
        [ids[0]],
        "update tenant_domains set is_primary = true where id = $1",
        [ids[1]],
        "tenant_domains_college_primary_uq",
      );
    } finally {
      // Explicitly delete only rows created by this test.
      if (ids.length > 0) {
        await pool.query(
          "delete from tenant_domains where id = any($1::uuid[])",
          [ids],
        );
      }
    }
  });
});
