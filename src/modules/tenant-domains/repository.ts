import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  colleges,
  organizations,
  tenantDomains,
} from "@/db/schema";
import {
  TenantDomainServiceError,
  type TenantDomainRepository,
  type TenantDomainView,
} from "./service";

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505",
  );
}

async function loadDomainFromDb(
  domainId: string,
): Promise<TenantDomainView | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: tenantDomains.id,
      collegeId: tenantDomains.collegeId,
      organizationId: colleges.organizationId,
      host: tenantDomains.host,
      isPrimary: tenantDomains.isPrimary,
      isVerified: tenantDomains.isVerified,
      verificationToken: tenantDomains.verificationToken,
      verifiedAt: tenantDomains.verifiedAt,
      lastCheckedAt: tenantDomains.lastCheckedAt,
      lastCheckResult: tenantDomains.lastCheckResult,
      createdAt: tenantDomains.createdAt,
      updatedAt: tenantDomains.updatedAt,
    })
    .from(tenantDomains)
    .innerJoin(colleges, eq(colleges.id, tenantDomains.collegeId))
    .where(eq(tenantDomains.id, domainId))
    .limit(1);

  return row ?? null;
}

async function loadDomainByHostFromDb(
  host: string,
): Promise<TenantDomainView | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: tenantDomains.id,
      collegeId: tenantDomains.collegeId,
      organizationId: colleges.organizationId,
      host: tenantDomains.host,
      isPrimary: tenantDomains.isPrimary,
      isVerified: tenantDomains.isVerified,
      verificationToken: tenantDomains.verificationToken,
      verifiedAt: tenantDomains.verifiedAt,
      lastCheckedAt: tenantDomains.lastCheckedAt,
      lastCheckResult: tenantDomains.lastCheckResult,
      createdAt: tenantDomains.createdAt,
      updatedAt: tenantDomains.updatedAt,
    })
    .from(tenantDomains)
    .innerJoin(colleges, eq(colleges.id, tenantDomains.collegeId))
    .where(sql<boolean>`lower(${tenantDomains.host}) = ${host}`)
    .limit(1);

  return row ?? null;
}

export const drizzleTenantDomainRepository: TenantDomainRepository = {
  async loadActiveCollege(collegeId) {
    const db = getDb();
    const [college] = await db
      .select({
        id: colleges.id,
        organizationId: colleges.organizationId,
      })
      .from(colleges)
      .innerJoin(
        organizations,
        eq(organizations.id, colleges.organizationId),
      )
      .where(
        and(
          eq(colleges.id, collegeId),
          eq(colleges.status, "ACTIVE"),
          eq(organizations.status, "ACTIVE"),
        ),
      )
      .limit(1);

    return college ?? null;
  },

  async listByCollege(collegeId) {
    const db = getDb();
    return db
      .select({
        id: tenantDomains.id,
        collegeId: tenantDomains.collegeId,
        organizationId: colleges.organizationId,
        host: tenantDomains.host,
        isPrimary: tenantDomains.isPrimary,
        isVerified: tenantDomains.isVerified,
        verificationToken: tenantDomains.verificationToken,
        verifiedAt: tenantDomains.verifiedAt,
        lastCheckedAt: tenantDomains.lastCheckedAt,
        lastCheckResult: tenantDomains.lastCheckResult,
        createdAt: tenantDomains.createdAt,
        updatedAt: tenantDomains.updatedAt,
      })
      .from(tenantDomains)
      .innerJoin(colleges, eq(colleges.id, tenantDomains.collegeId))
      .where(eq(tenantDomains.collegeId, collegeId))
      .orderBy(
        desc(tenantDomains.isPrimary),
        asc(tenantDomains.host),
      );
  },

  loadDomain(domainId) {
    return loadDomainFromDb(domainId);
  },

  findByHost(host) {
    return loadDomainByHostFromDb(host);
  },

  async createDomain(input) {
    const db = getDb();

    try {
      const [created] = await db
        .insert(tenantDomains)
        .values({
          collegeId: input.collegeId,
          host: input.host,
          verificationToken: input.verificationToken,
        })
        .returning({ id: tenantDomains.id });

      if (!created) {
        throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
      }

      const domain = await loadDomainFromDb(created.id);
      if (!domain) {
        throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
      }
      return domain;
    } catch (error) {
      if (error instanceof TenantDomainServiceError) {
        throw error;
      }
      if (isUniqueViolation(error)) {
        const existing = await loadDomainByHostFromDb(input.host);
        if (existing?.collegeId === input.collegeId) {
          return existing;
        }
        throw new TenantDomainServiceError("HOST_CONFLICT");
      }
      throw error;
    }
  },

  async recordVerificationResult(domainId, input) {
    const db = getDb();

    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({
          id: tenantDomains.id,
          collegeId: tenantDomains.collegeId,
          isVerified: tenantDomains.isVerified,
          isPrimary: tenantDomains.isPrimary,
          verifiedAt: tenantDomains.verifiedAt,
        })
        .from(tenantDomains)
        .where(eq(tenantDomains.id, domainId))
        .for("update")
        .limit(1);

      if (!current) {
        throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
      }

      let shouldBecomePrimary = current.isPrimary;
      if (input.verified && !current.isPrimary) {
        const [existingPrimary] = await tx
          .select({ id: tenantDomains.id })
          .from(tenantDomains)
          .where(
            and(
              eq(tenantDomains.collegeId, current.collegeId),
              eq(tenantDomains.isPrimary, true),
            ),
          )
          .for("update")
          .limit(1);

        shouldBecomePrimary = !existingPrimary;
      }

      await tx
        .update(tenantDomains)
        .set({
          isVerified: current.isVerified || input.verified,
          isPrimary:
            current.isVerified || input.verified
              ? shouldBecomePrimary
              : false,
          verificationToken:
            input.verified ? null : undefined,
          verifiedAt:
            input.verified
              ? current.verifiedAt ?? input.checkedAt
              : current.verifiedAt,
          lastCheckedAt: input.checkedAt,
          lastCheckResult: input.result,
          updatedAt: input.checkedAt,
        })
        .where(eq(tenantDomains.id, domainId));
    });

    const domain = await loadDomainFromDb(domainId);
    if (!domain) {
      throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
    }
    return domain;
  },

  async setPrimary(domainId) {
    const db = getDb();

    await db.transaction(async (tx) => {
      const [target] = await tx
        .select({
          id: tenantDomains.id,
          collegeId: tenantDomains.collegeId,
          isVerified: tenantDomains.isVerified,
        })
        .from(tenantDomains)
        .where(eq(tenantDomains.id, domainId))
        .for("update")
        .limit(1);

      if (!target) {
        throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
      }
      if (!target.isVerified) {
        throw new TenantDomainServiceError("DOMAIN_NOT_VERIFIED");
      }

      await tx
        .select({ id: tenantDomains.id })
        .from(tenantDomains)
        .where(eq(tenantDomains.collegeId, target.collegeId))
        .for("update");

      await tx
        .update(tenantDomains)
        .set({
          isPrimary: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tenantDomains.collegeId, target.collegeId),
            eq(tenantDomains.isPrimary, true),
            ne(tenantDomains.id, target.id),
          ),
        );

      await tx
        .update(tenantDomains)
        .set({
          isPrimary: true,
          updatedAt: new Date(),
        })
        .where(eq(tenantDomains.id, target.id));
    });

    const domain = await loadDomainFromDb(domainId);
    if (!domain) {
      throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
    }
    return domain;
  },

  async deleteDomain(domainId) {
    const db = getDb();
    const [deleted] = await db
      .delete(tenantDomains)
      .where(eq(tenantDomains.id, domainId))
      .returning({ id: tenantDomains.id });

    if (!deleted) {
      throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
    }
  },

  async resolveVerifiedHost(host) {
    const db = getDb();
    const [row] = await db
      .select({
        domainId: tenantDomains.id,
        host: tenantDomains.host,
        collegeId: colleges.id,
        organizationId: organizations.id,
      })
      .from(tenantDomains)
      .innerJoin(colleges, eq(colleges.id, tenantDomains.collegeId))
      .innerJoin(
        organizations,
        eq(organizations.id, colleges.organizationId),
      )
      .where(
        and(
          sql<boolean>`lower(${tenantDomains.host}) = ${host}`,
          eq(tenantDomains.isVerified, true),
          eq(colleges.status, "ACTIVE"),
          eq(organizations.status, "ACTIVE"),
        ),
      )
      .limit(1);

    return row ?? null;
  },
};
