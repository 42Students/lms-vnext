import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {
  activityEvents,
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
    .where(and(eq(tenantDomains.id, domainId),isNull(tenantDomains.deletedAt)))
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
    .where(and(sql<boolean>`lower(${tenantDomains.host}) = ${host}`,isNull(tenantDomains.deletedAt)))
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
      .where(and(eq(tenantDomains.collegeId, collegeId),isNull(tenantDomains.deletedAt)))
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
    const db=getDb();
    // Retired hosts preserve ownership and require a reviewed release.
    const [retired]=await db.select({id:tenantDomains.id}).from(tenantDomains)
      .where(and(sql<boolean>`lower(${tenantDomains.host}) = ${input.host}`,
        sql`${tenantDomains.deletedAt} is not null`)).limit(1);
    if(retired)throw new TenantDomainServiceError("HOST_CONFLICT");
    try{
      const domainId=await db.transaction(async tx=>{
        await assertPersistedPlatformPermission(tx,input.context,"college.manage",{
          collegeId:input.collegeId,organizationId:input.organizationId,
        });
        const [created]=await tx.insert(tenantDomains).values({
          collegeId:input.collegeId,host:input.host,
          verificationToken:input.verificationToken,
        }).returning({id:tenantDomains.id});
        if(!created)throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
        await tx.insert(activityEvents).values({
          organizationId:input.organizationId,collegeId:input.collegeId,
          actorUserId:input.context.user.id,module:"PLATFORM",
          eventType:"PLATFORM_COLLEGE_SUBDOMAIN_CHANGED",importance:"HIGH",
          subjectType:"tenant_domain",subjectId:created.id,
          summary:"Super Admin added a custom college domain",
          metadata:{action:"CREATE_CUSTOM_HOST",host:input.host,pendingDnsVerification:true},
        });
        return created.id;
      });
      const domain=await loadDomainFromDb(domainId);
      if(!domain)throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
      return domain;
    }catch(error){
      if(error instanceof TenantDomainServiceError)throw error;
      if(isUniqueViolation(error)){
        const existing=await loadDomainByHostFromDb(input.host);
        if(existing?.collegeId===input.collegeId)return existing;
        throw new TenantDomainServiceError("HOST_CONFLICT");
      }
      throw error;
    }
  },

  async ensureToken(input) {
    await getDb().transaction(async tx=>{
      const [row]=await tx.select({
        id:tenantDomains.id,collegeId:tenantDomains.collegeId,
        organizationId:colleges.organizationId,status:colleges.status,
        host:tenantDomains.host,isVerified:tenantDomains.isVerified,
        verificationToken:tenantDomains.verificationToken,
      }).from(tenantDomains).innerJoin(colleges,eq(colleges.id,tenantDomains.collegeId))
       .where(and(eq(tenantDomains.id,input.domainId),isNull(tenantDomains.deletedAt)))
       .for("update").limit(1);
      if(!row||row.status!=="ACTIVE")throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
      await assertPersistedPlatformPermission(tx,input.context,"college.manage",{
        collegeId:row.collegeId,organizationId:row.organizationId,
      });
      if(row.host!==input.expectedHost)throw new TenantDomainServiceError("DOMAIN_HOST_STALE");
      if(row.isVerified||row.verificationToken)return;
      await tx.update(tenantDomains).set({
        verificationToken:input.token,lastCheckedAt:null,lastCheckResult:null,updatedAt:new Date(),
      }).where(eq(tenantDomains.id,row.id));
      await tx.insert(activityEvents).values({
        organizationId:row.organizationId,collegeId:row.collegeId,
        actorUserId:input.context.user.id,module:"PLATFORM",
        eventType:"PLATFORM_COLLEGE_SUBDOMAIN_CHANGED",importance:"HIGH",
        subjectType:"tenant_domain",subjectId:row.id,
        summary:"Super Admin issued a custom domain DNS challenge",
        metadata:{action:"ENSURE_DNS_TOKEN",host:row.host},
      });
    });
    const domain=await loadDomainFromDb(input.domainId);
    if(!domain)throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
    return domain;
  },

  async editDomainHost(input) {
    try {
      await getDb().transaction(async tx=>{
        const [row]=await tx.select({
          id:tenantDomains.id,
          collegeId:tenantDomains.collegeId,
          organizationId:colleges.organizationId,
          status:colleges.status,
          host:tenantDomains.host,
          wasPrimary:tenantDomains.isPrimary,
        }).from(tenantDomains)
          .innerJoin(colleges,eq(colleges.id,tenantDomains.collegeId))
          .where(and(eq(tenantDomains.id,input.domainId),
            sql`${tenantDomains.deletedAt} is null`))
          .for("update").limit(1);
        if(!row||row.status!=="ACTIVE")
          throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
        await assertPersistedPlatformPermission(tx,input.context,"college.manage",{
          organizationId:row.organizationId,collegeId:row.collegeId,
        });
        if(row.host!==input.expectedHost)
          throw new TenantDomainServiceError("DOMAIN_HOST_STALE");
        if(row.host===input.host)return;
        const [taken]=await tx.select({id:tenantDomains.id})
          .from(tenantDomains)
          .where(sql<boolean>`lower(${tenantDomains.host}) = ${input.host}`).limit(1);
        if(taken&&taken.id!==row.id)
          throw new TenantDomainServiceError("HOST_CONFLICT");
        const now=new Date();
        await tx.update(tenantDomains).set({
          host:input.host,isVerified:false,isPrimary:false,
          verifiedAt:null,verificationToken:input.verificationToken,
          lastCheckedAt:null,lastCheckResult:null,lastFoundValues:null,updatedAt:now,
        }).where(eq(tenantDomains.id,row.id));
        await tx.insert(activityEvents).values({
          organizationId:row.organizationId,collegeId:row.collegeId,
          actorUserId:input.context.user.id,module:"PLATFORM",
          eventType:"PLATFORM_COLLEGE_SUBDOMAIN_CHANGED",importance:"HIGH",
          subjectType:"tenant_domain",subjectId:row.id,
          summary:"Super Admin changed a custom college domain",
          metadata:{action:"EDIT_HOST",from:row.host,to:input.host,
            oldPrimary:row.wasPrimary,verificationReset:true},
        });
      });
    }catch(error){
      if(isUniqueViolation(error))throw new TenantDomainServiceError("HOST_CONFLICT");
      throw error;
    }
    const updated=await loadDomainFromDb(input.domainId);
    if(!updated)throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
    return updated;
  },

  async recordVerificationResult(domainId, input) {
    const db = getDb();

    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({
          id: tenantDomains.id,
          collegeId: tenantDomains.collegeId,
          organizationId:colleges.organizationId,
          isVerified: tenantDomains.isVerified,
          isPrimary: tenantDomains.isPrimary,
          host: tenantDomains.host,
          verificationToken: tenantDomains.verificationToken,
          verifiedAt: tenantDomains.verifiedAt,
        })
        .from(tenantDomains)
        .innerJoin(colleges,eq(colleges.id,tenantDomains.collegeId))
        .where(and(eq(tenantDomains.id, domainId),isNull(tenantDomains.deletedAt)))
        .for("update")
        .limit(1);

      if (!current) {
        throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
      }
      await assertPersistedPlatformPermission(tx,input.context,"college.manage",{
        collegeId:current.collegeId,organizationId:current.organizationId,
      });
      // In-flight DNS verification cannot confirm a host that was edited.
      if(current.host!==input.expectedHost ||
         current.verificationToken!==input.expectedToken)
        throw new TenantDomainServiceError("DOMAIN_HOST_STALE");

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
          // Never store raw DNS TXT values (which may contain challenge
          // secrets). Keep a finite, human-readable failure category only.
          lastFoundValues:input.result==="TXT_VALUE_MISMATCH"?"TXT value does not match":null,
          updatedAt: input.checkedAt,
        })
        .where(and(eq(tenantDomains.id, domainId),isNull(tenantDomains.deletedAt)));
      await tx.insert(activityEvents).values({
        organizationId:current.organizationId,collegeId:current.collegeId,
        actorUserId:input.context.user.id,module:"PLATFORM",
        eventType:"PLATFORM_COLLEGE_SUBDOMAIN_CHANGED",importance:"HIGH",
        subjectType:"tenant_domain",subjectId:domainId,
        summary:"Super Admin checked custom domain DNS verification",
        metadata:{action:"VERIFY_CUSTOM_HOST",host:current.host,
          verified:input.verified,result:input.result},
      });
    });

    const domain = await loadDomainFromDb(domainId);
    if (!domain) {
      throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
    }
    return domain;
  },

  async setPrimary(domainId,context) {
    const db = getDb();

    await db.transaction(async (tx) => {
      const [target] = await tx
        .select({
          id: tenantDomains.id,
          collegeId: tenantDomains.collegeId,
          organizationId:colleges.organizationId,
          isVerified: tenantDomains.isVerified,
        })
        .from(tenantDomains)
        .innerJoin(colleges,eq(colleges.id,tenantDomains.collegeId))
        .where(and(eq(tenantDomains.id, domainId),isNull(tenantDomains.deletedAt)))
        .for("update")
        .limit(1);

      if (!target) {
        throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
      }
      await assertPersistedPlatformPermission(tx,context,"college.manage",{
        collegeId:target.collegeId,organizationId:target.organizationId,
      });
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
      await tx.insert(activityEvents).values({
        organizationId:target.organizationId,collegeId:target.collegeId,
        actorUserId:context.user.id,module:"PLATFORM",
        eventType:"PLATFORM_COLLEGE_SUBDOMAIN_CHANGED",importance:"HIGH",
        subjectType:"tenant_domain",subjectId:target.id,
        summary:"Super Admin changed the primary custom college domain",
        metadata:{action:"SET_PRIMARY",verified:true},
      });
    });

    const domain = await loadDomainFromDb(domainId);
    if (!domain) {
      throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
    }
    return domain;
  },

  async deleteDomain(domainId, confirmationHost, context) {
    // Soft deletion preserves host ownership and an immutable audit receipt,
    // while the partial host uniqueness index releases the public address.
    await getDb().transaction(async tx=>{
      const [current]=await tx.select({
        id:tenantDomains.id,
        collegeId:tenantDomains.collegeId,
        organizationId:colleges.organizationId,
        status:colleges.status,
        host:tenantDomains.host,
        isPrimary:tenantDomains.isPrimary,
      }).from(tenantDomains)
        .innerJoin(colleges,eq(colleges.id,tenantDomains.collegeId))
        .where(and(eq(tenantDomains.id,domainId),isNull(tenantDomains.deletedAt)))
        .for("update").limit(1);
      if(!current||current.status!=="ACTIVE")
        throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
      await assertPersistedPlatformPermission(tx,context,"college.manage",{
        organizationId:current.organizationId,collegeId:current.collegeId,
      });
      if(current.isPrimary&&confirmationHost!==current.host)
        throw new TenantDomainServiceError("PRIMARY_HOST_CONFIRMATION_REQUIRED");
      const now=new Date();
      await tx.update(tenantDomains).set({
        deletedAt:now,isPrimary:false,isVerified:false,
        verificationToken:null,updatedAt:now,
      }).where(and(eq(tenantDomains.id,current.id),isNull(tenantDomains.deletedAt)));
      await tx.insert(activityEvents).values({
        organizationId:current.organizationId,collegeId:current.collegeId,
        actorUserId:context.user.id,module:"PLATFORM",
        eventType:"PLATFORM_COLLEGE_SUBDOMAIN_CHANGED",importance:"HIGH",
        subjectType:"tenant_domain",subjectId:current.id,
        summary:"Super Admin removed a custom college domain",
        metadata:{action:"DELETE_CUSTOM_HOST",host:current.host,
          oldPrimary:current.isPrimary,softDeleted:true},
      });
    });
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
          isNull(tenantDomains.deletedAt),
          eq(colleges.status, "ACTIVE"),
          eq(organizations.status, "ACTIVE"),
        ),
      )
      .limit(1);

    return row ?? null;
  },
};
