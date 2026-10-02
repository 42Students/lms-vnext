import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  TenantDomainServiceError,
  createTenantDomain,
  resolveTenantFromHost,
  setPrimaryTenantDomain,
  verifyTenantDomain,
  type TenantDomainRepository,
  type TenantDomainView,
} from "@/modules/tenant-domains/service";

const adminContext: RequestContext = {
  user: {
    id: "user-admin",
    identityUid: "identity-admin",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: "membership-admin",
    collegeId: "11111111-1111-4111-8111-111111111111",
    organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    status: "ACTIVE",
    roles: ["COLLEGE_ADMIN"],
  },
};

function createRepository(): TenantDomainRepository {
  const domains = new Map<string, TenantDomainView>();
  let counter = 0;

  function now() {
    return new Date("2026-10-02T00:00:00.000Z");
  }

  return {
    async loadActiveCollege(collegeId) {
      if (collegeId === "11111111-1111-4111-8111-111111111111") {
        return {
          id: collegeId,
          organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        };
      }
      if (collegeId === "22222222-2222-4222-8222-222222222222") {
        return {
          id: collegeId,
          organizationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        };
      }
      return null;
    },

    async listByCollege(collegeId) {
      return [...domains.values()].filter(
        (domain) => domain.collegeId === collegeId,
      );
    },

    async loadDomain(domainId) {
      return domains.get(domainId) ?? null;
    },

    async findByHost(host) {
      return (
        [...domains.values()].find(
          (domain) => domain.host === host,
        ) ?? null
      );
    },

    async createDomain(input) {
      counter += 1;
      const id = `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`;
      const organizationId =
        input.collegeId === "11111111-1111-4111-8111-111111111111"
          ? "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
          : "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
      const domain: TenantDomainView = {
        id,
        collegeId: input.collegeId,
        organizationId,
        host: input.host,
        isPrimary: false,
        isVerified: false,
        verificationToken: input.verificationToken,
        verifiedAt: null,
        lastCheckedAt: null,
        lastCheckResult: null,
        createdAt: now(),
        updatedAt: now(),
      };
      domains.set(id, domain);
      return domain;
    },

    async recordVerificationResult(domainId, input) {
      const current = domains.get(domainId);
      if (!current) {
        throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
      }
      const hasPrimary = [...domains.values()].some(
        (domain) =>
          domain.collegeId === current.collegeId &&
          domain.isPrimary,
      );
      const updated: TenantDomainView = {
        ...current,
        isVerified: current.isVerified || input.verified,
        isPrimary:
          current.isPrimary || (input.verified && !hasPrimary),
        verificationToken:
          input.verified ? null : current.verificationToken,
        verifiedAt:
          input.verified
            ? current.verifiedAt ?? input.checkedAt
            : current.verifiedAt,
        lastCheckedAt: input.checkedAt,
        lastCheckResult: input.result,
        updatedAt: input.checkedAt,
      };
      domains.set(domainId, updated);
      return updated;
    },

    async setPrimary(domainId) {
      const current = domains.get(domainId);
      if (!current) {
        throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
      }
      if (!current.isVerified) {
        throw new TenantDomainServiceError("DOMAIN_NOT_VERIFIED");
      }

      for (const [id, domain] of domains) {
        if (domain.collegeId === current.collegeId) {
          domains.set(id, {
            ...domain,
            isPrimary: id === domainId,
          });
        }
      }

      return domains.get(domainId)!;
    },

    async deleteDomain(domainId) {
      if (!domains.delete(domainId)) {
        throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
      }
    },

    async resolveVerifiedHost(host) {
      const domain = [...domains.values()].find(
        (candidate) =>
          candidate.host === host && candidate.isVerified,
      );
      return domain
        ? {
            domainId: domain.id,
            host: domain.host,
            collegeId: domain.collegeId,
            organizationId: domain.organizationId,
          }
        : null;
    },
  };
}

describe("tenant-domain service", () => {
  it("creates a normalized mapping idempotently for the same college", async () => {
    const repository = createRepository();

    const first = await createTenantDomain(
      adminContext,
      {
        collegeId: "11111111-1111-4111-8111-111111111111",
        host: "Portal.Example.edu.",
      },
      repository,
      () => "token-one",
    );
    const second = await createTenantDomain(
      adminContext,
      {
        collegeId: "11111111-1111-4111-8111-111111111111",
        host: "portal.example.edu",
      },
      repository,
      () => "token-two",
    );

    expect(second.id).toBe(first.id);
    expect(second.verificationToken).toBe("token-one");
  });

  it("rejects a host already owned by another college", async () => {
    const repository = createRepository();
    const superAdmin: RequestContext = {
      user: {
        id: "super-admin",
        identityUid: "super-identity",
        platformStatus: "ACTIVE",
        systemRoles: ["SUPER_ADMIN"],
      },
      membership: null,
    };

    await createTenantDomain(
      superAdmin,
      {
        collegeId: "22222222-2222-4222-8222-222222222222",
        host: "shared.example.edu",
      },
      repository,
      () => "other-token",
    );

    await expect(
      createTenantDomain(
        adminContext,
        {
          collegeId: "11111111-1111-4111-8111-111111111111",
          host: "SHARED.EXAMPLE.EDU",
        },
        repository,
      ),
    ).rejects.toMatchObject({
      code: "HOST_CONFLICT",
    });
  });

  it("blocks a college admin from managing another college mapping", async () => {
    const repository = createRepository();

    await expect(
      createTenantDomain(
        adminContext,
        {
          collegeId: "22222222-2222-4222-8222-222222222222",
          host: "other.example.edu",
        },
        repository,
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("verifies ownership and promotes the first verified host to primary", async () => {
    const repository = createRepository();
    const domain = await createTenantDomain(
      adminContext,
      {
        collegeId: "11111111-1111-4111-8111-111111111111",
        host: "portal.example.edu",
      },
      repository,
      () => "token-one",
    );

    const verified = await verifyTenantDomain(
      adminContext,
      domain.id,
      repository,
      {
        async verify(host, token) {
          expect(host).toBe("portal.example.edu");
          expect(token).toBe("token-one");
          return { verified: true, result: "VERIFIED" };
        },
      },
    );

    expect(verified.isVerified).toBe(true);
    expect(verified.isPrimary).toBe(true);
    expect(verified.verificationToken).toBeNull();

    await expect(
      resolveTenantFromHost(
        "PORTAL.EXAMPLE.EDU:443",
        repository,
      ),
    ).resolves.toMatchObject({
      collegeId: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("switches the primary flag between verified domains", async () => {
    const repository = createRepository();
    const first = await createTenantDomain(
      adminContext,
      {
        collegeId: "11111111-1111-4111-8111-111111111111",
        host: "first.example.edu",
      },
      repository,
      () => "first-token",
    );
    const second = await createTenantDomain(
      adminContext,
      {
        collegeId: "11111111-1111-4111-8111-111111111111",
        host: "second.example.edu",
      },
      repository,
      () => "second-token",
    );

    await verifyTenantDomain(adminContext, first.id, repository, {
      async verify() {
        return { verified: true, result: "VERIFIED" };
      },
    });
    await verifyTenantDomain(adminContext, second.id, repository, {
      async verify() {
        return { verified: true, result: "VERIFIED" };
      },
    });

    const promoted = await setPrimaryTenantDomain(
      adminContext,
      second.id,
      repository,
    );

    expect(promoted.isPrimary).toBe(true);
    expect((await repository.loadDomain(first.id))?.isPrimary).toBe(false);
  });

  it("requires verification before a domain can become primary", async () => {
    const repository = createRepository();
    const domain = await createTenantDomain(
      adminContext,
      {
        collegeId: "11111111-1111-4111-8111-111111111111",
        host: "secondary.example.edu",
      },
      repository,
      () => "token",
    );

    await expect(
      setPrimaryTenantDomain(
        adminContext,
        domain.id,
        repository,
      ),
    ).rejects.toMatchObject({
      code: "DOMAIN_NOT_VERIFIED",
    });
  });
});
