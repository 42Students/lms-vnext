import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * DB-004 / Chat 2 — actual negative PostgreSQL witnesses for constraints
 * already present in the registered vNext schema.
 *
 * These tests do NOT demonstrate complete legacy DB01 parity. They establish
 * only the named database invariants, and deliberately do not alter shared
 * migration files, schemas, or application services.
 */
// Deliberately never fall back to DATABASE_URL: these tests issue rejected writes.
const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error("DB01 negative witnesses require explicit TEST_DATABASE_URL");
}

const pool = new Pool({ connectionString, max: 1 });

async function withRollback(run: (client: PoolClient) => Promise<void>) {
  const client = await pool.connect();
  let began = false;
  try {
    await client.query("BEGIN");
    began = true;
    await run(client);
  } finally {
    if (began) {
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

function uniqueHost() {
  return `db01-witness-${randomUUID()}.example.test`;
}

afterAll(async () => {
  await pool.end();
});

describe("DB01 tenant and identity PostgreSQL constraints", () => {
  it("rejects an unverified primary tenant domain (23514)", async () => {
    await withRollback(async (client) => {
      await expect(
        client.query(
          `insert into tenant_domains
           (college_id, host, is_verified, is_primary)
           values ($1, $2, false, true)`,
          [SEED_IDS.collegeA, uniqueHost()],
        ),
      ).rejects.toMatchObject({
        code: "23514",
        constraint: "tenant_domains_primary_verified_ck",
      });
    });
  });

  it("rejects a case-folded host collision across two colleges (23505)", async () => {
    await withRollback(async (client) => {
      const hostname = uniqueHost();
      await client.query(
        `insert into tenant_domains
         (college_id, host, is_verified, is_primary)
         values ($1, $2, false, false)`,
        [SEED_IDS.collegeA, hostname],
      );
      await expect(
        client.query(
          `insert into tenant_domains
           (college_id, host, is_verified, is_primary)
           values ($1, $2, false, false)`,
          [SEED_IDS.collegeB, hostname.toUpperCase()],
        ),
      ).rejects.toMatchObject({
        code: "23505",
        constraint: "tenant_domains_host_uq",
      });
    });
  });

  it("reserves tombstoned hostnames globally even from direct PostgreSQL writes (23505)", async () => {
    await withRollback(async client => {
      const hostname=uniqueHost();
      await client.query(
        `insert into tenant_domains
           (college_id,host,is_verified,is_primary,deleted_at)
         values ($1,$2,false,false,clock_timestamp())`,
        [SEED_IDS.collegeA,hostname],
      );
      await expect(client.query(
        `insert into tenant_domains(college_id,host,is_verified,is_primary)
         values($1,$2,false,false)`,
        [SEED_IDS.collegeB,hostname.toUpperCase()],
      )).rejects.toMatchObject({code:"23505",constraint:"tenant_domains_host_uq"});
    });
  });

  it("rejects a second verified primary domain for the same college (23505)", async () => {
    await withRollback(async (client) => {
      const result = await client.query(
        `select id from tenant_domains
         where college_id = $1 and is_primary = true limit 1`,
        [SEED_IDS.collegeA],
      );
      if (result.rowCount === 0) {
        await client.query(
          `insert into tenant_domains
           (college_id, host, is_verified, is_primary)
           values ($1, $2, true, true)`,
          [SEED_IDS.collegeA, uniqueHost()],
        );
      }

      await expect(
        client.query(
          `insert into tenant_domains
           (college_id, host, is_verified, is_primary)
           values ($1, $2, true, true)`,
          [SEED_IDS.collegeA, uniqueHost()],
        ),
      ).rejects.toMatchObject({
        code: "23505",
        constraint: "tenant_domains_college_primary_uq",
      });
    });
  });


  it("direct SQL cannot transfer an existing domain to another college (23514)",async()=>{
    await withRollback(async client=>{
      const host=uniqueHost();
      const created=await client.query<{id:string}>(
        "insert into tenant_domains(college_id,host) values($1,$2) returning id",
        [SEED_IDS.collegeA,host],
      );
      await expect(client.query(
        "update tenant_domains set college_id=$2 where id=$1",
        [created.rows[0]!.id,SEED_IDS.collegeB],
      )).rejects.toMatchObject({
        code:"23514",constraint:"db01_domain_owner_immutable_ck",
      });
    });
  });

  it("direct SQL cannot change a verified hostname without resetting DNS proof (23514)",async()=>{
    await withRollback(async client=>{
      const created=await client.query<{id:string}>(
        "insert into tenant_domains(college_id,host,is_verified,verified_at,verification_token) values($1,$2,true,now(),null) returning id",
        [SEED_IDS.collegeA,uniqueHost()],
      );
      await expect(client.query(
        "update tenant_domains set host=$2 where id=$1",
        [created.rows[0]!.id,uniqueHost()],
      )).rejects.toMatchObject({
        code:"23514",constraint:"db01_domain_host_proof_reset_ck",
      });
    });
  });

  it("direct SQL cannot revive a tombstoned hostname (23514)",async()=>{
    await withRollback(async client=>{
      const created=await client.query<{id:string}>(
        "insert into tenant_domains(college_id,host,is_verified,is_primary,deleted_at) values($1,$2,false,false,now()) returning id",
        [SEED_IDS.collegeA,uniqueHost()],
      );
      await expect(client.query(
        "update tenant_domains set deleted_at=null where id=$1",
        [created.rows[0]!.id],
      )).rejects.toMatchObject({
        code:"23514",constraint:"db01_domain_tombstone_terminal_ck",
      });
    });
  });

  it("permits a legitimate hostname rotation only with a fresh proof and cleared verification",async()=>{
    await withRollback(async client=>{
      const created=await client.query<{id:string}>(
        "insert into tenant_domains(college_id,host,is_verified,verified_at,verification_token) values($1,$2,true,now(),null) returning id",
        [SEED_IDS.collegeA,uniqueHost()],
      );
      const next=uniqueHost();
      const rotated=await client.query<{host:string;is_verified:boolean;verification_token:string}>(
        `update tenant_domains
          set host=$2,is_verified=false,is_primary=false,verified_at=null,
              last_checked_at=null,last_check_result=null,verification_token=$3
          where id=$1 returning host,is_verified,verification_token`,
        [created.rows[0]!.id,next,"new-proof-"+randomUUID()],
      );
      expect(rotated.rows[0]).toMatchObject({host:next,is_verified:false});
      expect(rotated.rows[0]!.verification_token).toMatch(/^new-proof-/);
    });
  });

  it("rejects duplicate canonical membership for the same user and college (23505)", async () => {
    await withRollback(async (client) => {
      const rows = await client.query(
        `select id from college_memberships
         where user_id = $1 and college_id = $2`,
        [SEED_IDS.collegeAdminUser, SEED_IDS.collegeA],
      );
      expect(rows.rows.map((row: { id: string }) => row.id)).toContain(
        SEED_IDS.collegeAdminMembership,
      );
      await expect(
        client.query(
          `insert into college_memberships (user_id, college_id)
           values ($1, $2)`,
          [SEED_IDS.collegeAdminUser, SEED_IDS.collegeA],
        ),
      ).rejects.toMatchObject({
        code: "23505",
        constraint: "college_memberships_user_college_uq",
      });
    });
  });

  it("rejects duplicate role grants on a canonical membership (23505)", async () => {
    await withRollback(async (client) => {
      const existing = await client.query<{ role: string }>(
        `select role from membership_roles
         where membership_id = $1 limit 1`,
        [SEED_IDS.collegeAdminMembership],
      );
      expect(existing.rows.length).toBeGreaterThan(0);
      await expect(
        client.query(
          `insert into membership_roles (membership_id, role)
           values ($1, $2)`,
          [SEED_IDS.collegeAdminMembership, existing.rows[0]!.role],
        ),
      ).rejects.toMatchObject({
        code: "23505",
        constraint: "membership_roles_membership_role_uq",
      });
    });
  });
});
