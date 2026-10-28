import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { drizzleTenantDomainRepository } from "@/modules/tenant-domains/repository";
import {
  createTenantDomain,
  deleteTenantDomain,
  listTenantDomains,
  resolveTenantFromHost,
  setPrimaryTenantDomain,
  verifyTenantDomain,
} from "@/modules/tenant-domains/service";
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
  max: 1,
});

const superAdmin: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "integration-superadmin-identity",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

const collegeAAdmin: RequestContext = {
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

async function cleanupDomains() {
  await pool.query(
    "delete from tenant_domains where host like 'integration-tenant-%'",
  );
}

beforeEach(async () => {
  await cleanupDomains();
});

afterAll(async () => {
  await cleanupDomains();
  await pool.end();
  await closeDatabaseConnection();
});

const verifiedDns = {
  async verify(host: string, token: string) {
    expect(host).toMatch(/^integration-tenant-/);
    expect(token).toMatch(/^token-/);
    return {
      verified: true as const,
      result: "VERIFIED" as const,
    };
  },
};

describe("tenant domains against PostgreSQL", () => {
  it("creates idempotently, verifies, and resolves a tenant host", async () => {
    const first = await createTenantDomain(
      superAdmin,
      {
        collegeId: SEED_IDS.collegeA,
        host: "Integration-Tenant-A.Example.com.",
      },
      drizzleTenantDomainRepository,
      () => "token-a",
    );
    const repeated = await createTenantDomain(
      superAdmin,
      {
        collegeId: SEED_IDS.collegeA,
        host: "integration-tenant-a.example.com",
      },
      drizzleTenantDomainRepository,
      () => "token-should-not-replace",
    );

    expect(repeated.id).toBe(first.id);
    expect(repeated.verificationToken).toBe("token-a");

    const verified = await verifyTenantDomain(
      superAdmin,
      first.id,
      drizzleTenantDomainRepository,
      verifiedDns,
    );

    expect(verified.isVerified).toBe(true);
    expect(verified.isPrimary).toBe(true);
    expect(verified.verificationToken).toBeNull();

    await expect(
      resolveTenantFromHost(
        "INTEGRATION-TENANT-A.EXAMPLE.COM:443",
        drizzleTenantDomainRepository,
      ),
    ).resolves.toMatchObject({
      domainId: first.id,
      collegeId: SEED_IDS.collegeA,
      organizationId: SEED_IDS.organization,
    });
  });

  it("requires exact hostname confirmation for deletion of a persisted primary host",async()=>{
    const created=await createTenantDomain(superAdmin,{collegeId:SEED_IDS.collegeA,host:"integration-tenant-delete-primary.example.com"},drizzleTenantDomainRepository,()=> "token-delete-primary");
    await verifyTenantDomain(superAdmin,created.id,drizzleTenantDomainRepository,verifiedDns);
    await setPrimaryTenantDomain(superAdmin,created.id,drizzleTenantDomainRepository);
    await expect(deleteTenantDomain(superAdmin,created.id,drizzleTenantDomainRepository)).rejects.toMatchObject({code:"PRIMARY_HOST_CONFIRMATION_REQUIRED"});
    await expect(deleteTenantDomain(superAdmin,created.id,drizzleTenantDomainRepository,"wrong.example.com")).rejects.toMatchObject({code:"PRIMARY_HOST_CONFIRMATION_REQUIRED"});
    await expect(deleteTenantDomain(superAdmin,created.id,drizzleTenantDomainRepository,"integration-tenant-delete-primary.example.com")).resolves.toBeUndefined();
  });

  it("switches one verified primary domain transactionally", async () => {
    const first = await createTenantDomain(
      superAdmin,
      {
        collegeId: SEED_IDS.collegeA,
        host: "integration-tenant-primary-a.example.com",
      },
      drizzleTenantDomainRepository,
      () => "token-primary-a",
    );
    const second = await createTenantDomain(
      superAdmin,
      {
        collegeId: SEED_IDS.collegeA,
        host: "integration-tenant-primary-b.example.com",
      },
      drizzleTenantDomainRepository,
      () => "token-primary-b",
    );

    const firstVerified = await verifyTenantDomain(
      superAdmin,
      first.id,
      drizzleTenantDomainRepository,
      verifiedDns,
    );
    const secondVerified = await verifyTenantDomain(
      superAdmin,
      second.id,
      drizzleTenantDomainRepository,
      verifiedDns,
    );

    expect(firstVerified.isPrimary).toBe(true);
    expect(secondVerified.isPrimary).toBe(false);

    const promoted = await setPrimaryTenantDomain(
      superAdmin,
      second.id,
      drizzleTenantDomainRepository,
    );
    expect(promoted.isPrimary).toBe(true);

    const domains = await listTenantDomains(
      superAdmin,
      SEED_IDS.collegeA,
      drizzleTenantDomainRepository,
    );
    expect(domains).toHaveLength(2);
    expect(domains[0]?.id).toBe(second.id);
    expect(domains[0]?.isPrimary).toBe(true);
    expect(domains[1]?.isPrimary).toBe(false);
  });


  it("serializes simultaneous primary promotions without deadlocking or exposing two primaries", async () => {
    const first = await createTenantDomain(superAdmin,{
      collegeId: SEED_IDS.collegeA,host:"integration-tenant-race-primary-a.example.com",
    },drizzleTenantDomainRepository,()=>"token-race-primary-a");
    const second = await createTenantDomain(superAdmin,{
      collegeId: SEED_IDS.collegeA,host:"integration-tenant-race-primary-b.example.com",
    },drizzleTenantDomainRepository,()=>"token-race-primary-b");
    await verifyTenantDomain(superAdmin,first.id,drizzleTenantDomainRepository,verifiedDns);
    await verifyTenantDomain(superAdmin,second.id,drizzleTenantDomainRepository,verifiedDns);

    // Both requests arrive while the college row is locked by another
    // transaction. They must queue at the common parent before domain locks,
    // not deadlock by each holding a different domain's row.
    const blocker=await pool.connect();
    await blocker.query("begin");
    try{
      await blocker.query("select id from colleges where id=$1 for update",[SEED_IDS.collegeA]);
      const promotions=Promise.all([
        setPrimaryTenantDomain(superAdmin,first.id,drizzleTenantDomainRepository),
        setPrimaryTenantDomain(superAdmin,second.id,drizzleTenantDomainRepository),
      ]);
      await blocker.query("commit");
      const results=await promotions;
      expect(results).toHaveLength(2);
    }finally{
      await blocker.query("rollback");
      blocker.release();
    }
    const rows=await pool.query<{id:string;is_primary:boolean}>(
      "select id,is_primary from tenant_domains where id=any($1::uuid[])",
      [[first.id,second.id]],
    );
    expect(rows.rows).toHaveLength(2);
    expect(rows.rows.filter(row=>row.is_primary)).toHaveLength(1);
  });

  it("serializes DNS verification against primary promotion and keeps exactly one verified primary",async()=>{
    const first=await createTenantDomain(superAdmin,{
      collegeId:SEED_IDS.collegeA,host:"integration-tenant-race-verify-a.example.com",
    },drizzleTenantDomainRepository,()=>"token-race-verify-a");
    const second=await createTenantDomain(superAdmin,{
      collegeId:SEED_IDS.collegeA,host:"integration-tenant-race-verify-b.example.com",
    },drizzleTenantDomainRepository,()=>"token-race-verify-b");
    await verifyTenantDomain(superAdmin,first.id,drizzleTenantDomainRepository,verifiedDns);
    await Promise.all([
      verifyTenantDomain(superAdmin,second.id,drizzleTenantDomainRepository,verifiedDns),
      setPrimaryTenantDomain(superAdmin,first.id,drizzleTenantDomainRepository),
    ]);
    const rows=await pool.query<{id:string;is_primary:boolean;is_verified:boolean}>(
      "select id,is_primary,is_verified from tenant_domains where id=any($1::uuid[])",
      [[first.id,second.id]],
    );
    expect(rows.rows).toHaveLength(2);
    expect(rows.rows.every(row=>row.is_verified)).toBe(true);
    expect(rows.rows.filter(row=>row.is_primary).map(row=>row.id)).toEqual([first.id]);
  });

  it("never resurrects a removed domain when removal races primary promotion",async()=>{
    const created=await createTenantDomain(superAdmin,{
      collegeId:SEED_IDS.collegeA,host:"integration-tenant-race-delete.example.com",
    },drizzleTenantDomainRepository,()=>"token-race-delete");
    await verifyTenantDomain(superAdmin,created.id,drizzleTenantDomainRepository,verifiedDns);
    const outcomes=await Promise.allSettled([
      setPrimaryTenantDomain(superAdmin,created.id,drizzleTenantDomainRepository),
      deleteTenantDomain(superAdmin,created.id,drizzleTenantDomainRepository,created.host),
    ]);
    expect(outcomes[1]?.status).toBe("fulfilled");
    if(outcomes[0]?.status==="rejected"){
      expect(outcomes[0].reason).toMatchObject({code:"DOMAIN_NOT_FOUND"});
    }
    const rows=await pool.query<{deleted_at:Date|null;is_primary:boolean;is_verified:boolean}>(
      "select deleted_at,is_primary,is_verified from tenant_domains where id=$1",
      [created.id],
    );
    expect(rows.rows[0]?.deleted_at).not.toBeNull();
    expect(rows.rows[0]?.is_primary).toBe(false);
    expect(rows.rows[0]?.is_verified).toBe(false);
    await expect(resolveTenantFromHost(created.host,drizzleTenantDomainRepository))
      .resolves.toBeNull();
  });

  it("reserves a tombstoned hostname against same-college and cross-college reclaim",async()=>{
    const host="integration-tenant-retired-claim.example.com";
    const first=await createTenantDomain(superAdmin,{
      collegeId:SEED_IDS.collegeA,host,
    },drizzleTenantDomainRepository,()=>"token-retired-claim");
    await deleteTenantDomain(superAdmin,first.id,drizzleTenantDomainRepository);
    for(const collegeId of [SEED_IDS.collegeA,SEED_IDS.collegeB]){
      await expect(createTenantDomain(superAdmin,{collegeId,host},
        drizzleTenantDomainRepository,()=>"token-illegal-reclaim"))
        .rejects.toMatchObject({code:"HOST_CONFLICT"});
    }
    const saved=await pool.query<{deleted_at:Date|null}>(
      "select deleted_at from tenant_domains where id=$1",[first.id]);
    expect(saved.rows[0]?.deleted_at).not.toBeNull();
    await expect(resolveTenantFromHost(host,drizzleTenantDomainRepository))
      .resolves.toBeNull();
  });

  it("cannot race domain removal into fresh ownership of the same host",async()=>{
    const host="integration-tenant-retired-race.example.com";
    const first=await createTenantDomain(superAdmin,{
      collegeId:SEED_IDS.collegeA,host,
    },drizzleTenantDomainRepository,()=>"token-retired-race");
    const [removed,reclaimed]=await Promise.allSettled([
      deleteTenantDomain(superAdmin,first.id,drizzleTenantDomainRepository),
      createTenantDomain(superAdmin,{collegeId:SEED_IDS.collegeB,host},
        drizzleTenantDomainRepository,()=>"token-racing-claim"),
    ]);
    expect(removed.status).toBe("fulfilled");
    expect(reclaimed.status).toBe("rejected");
    if(reclaimed.status==="rejected")
      expect(reclaimed.reason).toMatchObject({code:"HOST_CONFLICT"});
    const count=await pool.query<{count:string}>(
      "select count(*)::text as count from tenant_domains where lower(host)=$1",[host]);
    expect(Number(count.rows[0]?.count)).toBe(1);
  });

  it("enforces global host uniqueness and tenant management boundaries", async () => {
    const collegeBDomain = await createTenantDomain(
      superAdmin,
      {
        collegeId: SEED_IDS.collegeB,
        host: "integration-tenant-shared.example.com",
      },
      drizzleTenantDomainRepository,
      () => "token-shared",
    );

    await expect(
      createTenantDomain(
        superAdmin,
        {
          collegeId: SEED_IDS.collegeA,
          host: "INTEGRATION-TENANT-SHARED.EXAMPLE.COM",
        },
        drizzleTenantDomainRepository,
      ),
    ).rejects.toMatchObject({
      code: "HOST_CONFLICT",
    });

    await expect(
      deleteTenantDomain(
        collegeAAdmin,
        collegeBDomain.id,
        drizzleTenantDomainRepository,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);

    await expect(
      resolveTenantFromHost(
        "integration-tenant-shared.example.com",
        drizzleTenantDomainRepository,
      ),
    ).resolves.toBeNull();
  });
});
