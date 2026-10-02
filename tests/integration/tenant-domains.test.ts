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
    id: "integration-superadmin",
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
