import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { closeDatabaseConnection } from "@/db/client";
import { archiveCollege, resolveCollegeUsage } from "@/modules/colleges/service";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { drizzleTenantDomainRepository } from "@/modules/tenant-domains/repository";
import {
  deleteTenantDomain,
  resolveTenantFromHost,
} from "@/modules/tenant-domains/service";

/**
 * DB-004 Chat 2: real repository/host resolution against a registered
 * migrated, seeded disposable PostgreSQL database.
 *
 * The repository under test uses DATABASE_URL; require exact equality to the
 * explicitly selected disposable TEST_DATABASE_URL to avoid reading from an
 * unintended database. All fixture rows are unique and deleted in FK order.
 */
const dbUrl = process.env.TEST_DATABASE_URL;
if (!dbUrl || process.env.DATABASE_URL !== dbUrl) {
  throw new Error(
    "DB01 routing lifecycle requires TEST_DATABASE_URL === DATABASE_URL on an isolated test database",
  );
}
const pool = new Pool({ connectionString: dbUrl, max: 1 });

type TenantFixture = {
  organizationId: string;
  collegeId: string;
  domainId: string;
  host: string;
};

async function withTenantFixture(run: (fixture: TenantFixture) => Promise<void>) {
  const fixture: TenantFixture = {
    organizationId: randomUUID(),
    collegeId: randomUUID(),
    domainId: randomUUID(),
    host: `db01-live-${randomUUID()}.example.test`,
  };

  try {
    await pool.query(
      "insert into organizations (id, name, status) values ($1, $2, 'ACTIVE')",
      [fixture.organizationId, `DB01 Lifecycle ${fixture.organizationId}`],
    );
    await pool.query(
      `insert into colleges
       (id, organization_id, name, code, status)
       values ($1, $2, 'Test Tenant', $3, 'ACTIVE')`,
      [fixture.collegeId, fixture.organizationId, `DB01-${fixture.collegeId}`],
    );
    await pool.query(
      `insert into tenant_domains
       (id, college_id, host, is_verified, is_primary, verified_at)
       values ($1, $2, $3, true, true, now())`,
      [fixture.domainId, fixture.collegeId, fixture.host],
    );

    await run(fixture);
  } finally {
    // Domain removal writes a fixture-college audit receipt; remove it first.
    await pool.query("delete from activity_events where college_id = $1", [fixture.collegeId]);
    await pool.query("delete from tenant_domains where id = $1", [fixture.domainId]);
    await pool.query("delete from colleges where id = $1", [fixture.collegeId]);
    await pool.query("delete from organizations where id = $1", [fixture.organizationId]);
  }
}

afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("DB01 tenant host lifecycle — real repository SQL", () => {
  it("does not honor a cached verified host after the owning college is archived", async () => {
    await withTenantFixture(async (fixture) => {
      const first = await resolveRequestTenant(fixture.host);
      expect(first).toMatchObject({kind:"college",collegeId:fixture.collegeId});
      // This can be committed by another application replica without any
      // opportunity to invalidate our in-memory lookup.
      await pool.query(
        "update colleges set status = 'ARCHIVED' where id = $1",
        [fixture.collegeId],
      );
      await expect(resolveRequestTenant(fixture.host)).resolves.toMatchObject({
        kind:"unknown",host:fixture.host,
      });
    });
  });

  it("archives a college after its domain is tombstoned but never while the host is active", async () => {
    await withTenantFixture(async (fixture) => {
      const superAdmin: RequestContext = {
        user: {
          id: SEED_IDS.superAdminUser,
          identityUid: "isolated-test-superadmin-uid",
          platformStatus: "ACTIVE",
          systemRoles: ["SUPER_ADMIN"],
        },
        membership: null,
      };
      const before = await resolveCollegeUsage(fixture.collegeId);
      expect(before.tenantDomains).toBe(1);
      await expect(archiveCollege(superAdmin,fixture.collegeId)).rejects.toThrow();

      // Retain forensic host ownership, but remove its live routing.
      await pool.query(`
        update tenant_domains
           set deleted_at=clock_timestamp(),is_primary=false,
               is_verified=false,verification_token=null
         where id=$1`,[fixture.domainId]);
      const after = await resolveCollegeUsage(fixture.collegeId);
      expect(after.tenantDomains).toBe(0);

      const archived = await archiveCollege(superAdmin,fixture.collegeId);
      expect(archived.status).toBe("ARCHIVED");
      await expect(resolveTenantFromHost(
        fixture.host,drizzleTenantDomainRepository,
      )).resolves.toBeNull();
    });
  });

  it("rejects a stale archive preflight after a new domain has committed",async()=>{
    await withTenantFixture(async fixture=>{
      const superAdmin:RequestContext={
        user:{id:SEED_IDS.superAdminUser,identityUid:"isolated-test-superadmin-uid",
          platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,
      };
      const staleEmpty={memberships:0,departments:0,academicPeriods:0,
        projectTemplateAssignments:0,projects:0,placementRelationships:0,
        placementSeasons:0,placementJobs:0,tenantDomains:0};
      await expect(archiveCollege(superAdmin,fixture.collegeId,
        async()=>staleEmpty)).rejects.toMatchObject({code:"COLLEGE_HAS_DEPENDENCIES"});
      const status=await pool.query<{status:string}>(
        "select status from colleges where id=$1",[fixture.collegeId]);
      expect(status.rows[0]?.status).toBe("ACTIVE");
    });
  });

  it("denies late domain creation after the college is archived",async()=>{
    await withTenantFixture(async fixture=>{
      const superAdmin:RequestContext={
        user:{id:SEED_IDS.superAdminUser,identityUid:"isolated-test-superadmin-uid",
          platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,
      };
      await pool.query(`update tenant_domains set deleted_at=now(),
        is_primary=false,is_verified=false,verification_token=null where id=$1`,[fixture.domainId]);
      await archiveCollege(superAdmin,fixture.collegeId);
      const lateHost=`late-${randomUUID()}.example.test`;
      await expect(drizzleTenantDomainRepository.createDomain({
        collegeId:fixture.collegeId,organizationId:fixture.organizationId,
        host:lateHost,verificationToken:"late-domain-claim",context:superAdmin,
      })).rejects.toThrow();
      const result=await pool.query("select 1 from tenant_domains where host=$1",[lateHost]);
      expect(result.rowCount).toBe(0);
    });
  });

  it("resolves a verified active tenant using normalized hostname", async () => {
    await withTenantFixture(async (fixture) => {
      const result = await resolveTenantFromHost(
        `${fixture.host.toUpperCase()}:443`,
        drizzleTenantDomainRepository,
      );
      expect(result).toMatchObject({
        domainId: fixture.domainId,
        collegeId: fixture.collegeId,
        organizationId: fixture.organizationId,
        host: fixture.host,
      });
    });
  });

  it("fails closed when a college or its parent organization is archived", async () => {
    await withTenantFixture(async (fixture) => {
      const resolve = () => resolveTenantFromHost(
        fixture.host, drizzleTenantDomainRepository,
      );
      expect(await resolve()).not.toBeNull();
      await pool.query(
        "update colleges set status = 'ARCHIVED' where id = $1",
        [fixture.collegeId],
      );
      await expect(resolve()).resolves.toBeNull();

      await pool.query(
        "update colleges set status = 'ACTIVE' where id = $1",
        [fixture.collegeId],
      );
      await pool.query(
        "update organizations set status = 'ARCHIVED' where id = $1",
        [fixture.organizationId],
      );
      await expect(resolve()).resolves.toBeNull();

      await pool.query(
        "update organizations set status = 'ACTIVE' where id = $1",
        [fixture.organizationId],
      );
      await expect(resolve()).resolves.not.toBeNull();
    });
  });

  it("rejects an unverified hostname even while its college remains ACTIVE", async () => {
    await withTenantFixture(async (fixture) => {
      await pool.query(
        `update tenant_domains
         set is_primary = false, is_verified = false, verified_at = null
         where id = $1`,
        [fixture.domainId],
      );
      await expect(
        resolveTenantFromHost(fixture.host, drizzleTenantDomainRepository),
      ).resolves.toBeNull();
    });
  });

  it("stops routing immediately after the owning admin removes a hostname", async () => {
    await withTenantFixture(async (fixture) => {
      const superAdmin: RequestContext = {
        user: {
          id: SEED_IDS.superAdminUser,
          identityUid: "isolated-test-superadmin-uid",
          platformStatus: "ACTIVE",
          systemRoles: ["SUPER_ADMIN"],
        },
        membership: null,
      };
      await expect(
        resolveTenantFromHost(fixture.host, drizzleTenantDomainRepository),
      ).resolves.not.toBeNull();
      // Deleting a verified PRIMARY host needs the exact hostname confirmation.
      await expect(deleteTenantDomain(
        superAdmin, fixture.domainId, drizzleTenantDomainRepository,
      )).rejects.toMatchObject({ code: "PRIMARY_HOST_CONFIRMATION_REQUIRED" });
      await expect(
        resolveTenantFromHost(fixture.host, drizzleTenantDomainRepository),
      ).resolves.not.toBeNull();

      await deleteTenantDomain(
        superAdmin, fixture.domainId, drizzleTenantDomainRepository, fixture.host,
      );
      await expect(
        resolveTenantFromHost(fixture.host, drizzleTenantDomainRepository),
      ).resolves.toBeNull();
    });
  });
});
