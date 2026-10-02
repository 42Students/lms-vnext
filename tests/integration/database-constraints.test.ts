import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  Pool,
  type PoolClient,
} from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

const databaseUrl =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 2,
});

let client: PoolClient;

beforeAll(async () => {
  const result = await pool.query(
    `select count(*)::int as count
     from information_schema.tables
     where table_schema = 'public'
       and table_name in ('organizations', 'colleges', 'users', 'tenant_domains')`,
  );

  expect(result.rows[0]?.count).toBe(4);
});

beforeEach(async () => {
  client = await pool.connect();
  await client.query("BEGIN");
});

afterEach(async () => {
  await client.query("ROLLBACK");
  client.release();
});

afterAll(async () => {
  await pool.end();
});

describe("canonical PostgreSQL constraints", () => {
  it("keeps the seed cross-college membership scenario intact", async () => {
    const result = await client.query(
      `select college_id
       from college_memberships
       where user_id = $1
       order by college_id`,
      [SEED_IDS.facultyUser],
    );

    expect(result.rows.map((row) => row.college_id)).toEqual([
      SEED_IDS.collegeA,
      SEED_IDS.collegeB,
    ]);
  });

  it("allows a user to join another college but not duplicate the same membership", async () => {
    await expect(
      client.query(
        `insert into college_memberships
           (id, user_id, college_id, status)
         values
           ('60000000-0000-4000-8000-000000000001', $1, $2, 'ACTIVE')`,
        [SEED_IDS.learnerUser, SEED_IDS.collegeB],
      ),
    ).resolves.toMatchObject({ rowCount: 1 });

    await expect(
      client.query(
        `insert into college_memberships
           (id, user_id, college_id, status)
         values
           ('60000000-0000-4000-8000-000000000002', $1, $2, 'ACTIVE')`,
        [SEED_IDS.learnerUser, SEED_IDS.collegeA],
      ),
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("enforces case-insensitive user email uniqueness", async () => {
    await expect(
      client.query(
        `insert into users
           (id, identity_uid, phone_e164, email, display_name)
         values
           ('60000000-0000-4000-8000-000000000003',
            'case-email-test',
            '+919000000099',
            'LEARNER.SEED@EXAMPLE.COM',
            'Case Collision')`,
      ),
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("requires a primary tenant domain to be verified", async () => {
    await expect(
      client.query(
        `insert into tenant_domains
           (id, college_id, host, is_primary, is_verified)
         values
           ('60000000-0000-4000-8000-000000000004',
            $1,
            'unverified-primary.seed.example.com',
            true,
            false)`,
        [SEED_IDS.collegeA],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("allows at most one verified primary domain per college", async () => {
    await client.query(
      `insert into tenant_domains
         (id, college_id, host, is_primary, is_verified)
       values
         ('60000000-0000-4000-8000-000000000005',
          $1,
          'primary-one.seed.example.com',
          true,
          true)`,
      [SEED_IDS.collegeA],
    );

    await expect(
      client.query(
        `insert into tenant_domains
           (id, college_id, host, is_primary, is_verified)
         values
           ('60000000-0000-4000-8000-000000000006',
            $1,
            'primary-two.seed.example.com',
            true,
            true)`,
        [SEED_IDS.collegeA],
      ),
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("enforces tenant foreign-key ownership", async () => {
    await expect(
      client.query(
        `insert into colleges
           (id, organization_id, name, code, status)
         values
           ('60000000-0000-4000-8000-000000000007',
            'ffffffff-ffff-4fff-8fff-ffffffffffff',
            'Orphan College',
            'ORPHAN',
            'ACTIVE')`,
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });
});
