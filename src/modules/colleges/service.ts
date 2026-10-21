import {
  and,
  asc,
  eq,
  isNull,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {
  academicPeriods,
  collegeMemberships,
  colleges,
  departments,
  organizations,
  placementCompanyRelationships,
  placementJobs,
  placementSeasons,
  projectInstances,
  projectTemplateCollegeAssignments,
  tenantDomains,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";
import {
  assertCollegeCanArchive,
  type CollegeUsage,
} from "./archive-policy";
import {
  collegeIdSchema,
  collegeOrganizationIdSchema,
  createCollegeInputSchema,
  updateCollegeInputSchema,
  type CreateCollegeInput,
  type UpdateCollegeInput,
} from "./validation";

export type CollegeServiceErrorCode =
  | "COLLEGE_APPOINTEE_INVALID"
  | "ORGANIZATION_NOT_FOUND"
  | "COLLEGE_NOT_FOUND"
  | "COLLEGE_CODE_CONFLICT";

export class CollegeServiceError extends Error {
  constructor(public readonly code: CollegeServiceErrorCode) {
    super(code);
    this.name = "CollegeServiceError";
  }
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505",
  );
}

async function loadActiveOrganization(organizationId: string) {
  const db = getDb();

  const [organization] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, organizationId),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!organization) {
    throw new CollegeServiceError("ORGANIZATION_NOT_FOUND");
  }

  return organization;
}

async function loadActiveCollege(collegeId: string) {
  const db = getDb();

  const [college] = await db
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      name: colleges.name,
      code: colleges.code,
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

  if (!college) {
    throw new CollegeServiceError("COLLEGE_NOT_FOUND");
  }

  return college;
}

async function assertUniqueCode(code: string) {
  const db = getDb();

  const [existing] = await db
    .select({ id: colleges.id })
    .from(colleges)
    .where(
      sql<boolean>`lower(${colleges.code}) = ${code.toLowerCase()}`,
    )
    .limit(1);

  if (existing) {
    throw new CollegeServiceError("COLLEGE_CODE_CONFLICT");
  }
}

export async function listColleges(
  context: RequestContext,
  organizationIdInput?: string | null,
) {
  const resource={
    organizationId:isSuperAdmin(context)
      ? context.adminScope?.organizationId??undefined
      : context.membership?.organizationId??undefined,
    collegeId:isSuperAdmin(context)
      ? context.adminScope?.collegeId??undefined
      : context.membership?.collegeId??undefined,
  };
  return getDb().transaction(async db=>{
    await assertPersistedPlatformPermission(db,context,"college.read",resource);

  if (isSuperAdmin(context)) {
    const requestedOrganizationId = organizationIdInput
      ? collegeOrganizationIdSchema.parse(organizationIdInput)
      : null;
    const selectedOrganizationId =
      context.adminScope?.organizationId ?? null;
    const selectedCollegeId =
      context.adminScope?.collegeId ?? null;

    if (
      requestedOrganizationId &&
      selectedOrganizationId &&
      requestedOrganizationId !== selectedOrganizationId
    ) {
      throw new AuthorizationError("college.read");
    }

    if (selectedCollegeId) {
      requirePermission(context, "college.read", {
        organizationId: selectedOrganizationId,
        collegeId: selectedCollegeId,
      });

      return db
        .select({
          id: colleges.id,
          organizationId: colleges.organizationId,
          name: colleges.name,
          code: colleges.code,
          logoObjectPath: colleges.logoObjectPath,
          addressLine1: colleges.addressLine1,
          addressLine2: colleges.addressLine2,
          landmark: colleges.landmark,
          postalCode: colleges.postalCode,
      city: colleges.city,
          state: colleges.state,
          country: colleges.country,
          createdAt: colleges.createdAt,
          updatedAt: colleges.updatedAt,
        })
        .from(colleges)
        .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
        .where(
          and(
            eq(colleges.id, selectedCollegeId),
            eq(colleges.status, "ACTIVE"),
            eq(organizations.status, "ACTIVE"),
            selectedOrganizationId
              ? eq(colleges.organizationId, selectedOrganizationId)
              : undefined,
            requestedOrganizationId
              ? eq(colleges.organizationId, requestedOrganizationId)
              : undefined,
          ),
        )
        .orderBy(asc(colleges.name));
    }

    const effectiveOrganizationId =
      requestedOrganizationId ?? selectedOrganizationId;

    if (effectiveOrganizationId) {
      await loadActiveOrganization(effectiveOrganizationId);
      requirePermission(context, "college.read", {
        organizationId: effectiveOrganizationId,
      });
    }

    return db
      .select({
        id: colleges.id,
        organizationId: colleges.organizationId,
        name: colleges.name,
        code: colleges.code,
        logoObjectPath: colleges.logoObjectPath,
          addressLine1: colleges.addressLine1,
          addressLine2: colleges.addressLine2,
          landmark: colleges.landmark,
          postalCode: colleges.postalCode,
      city: colleges.city,
        state: colleges.state,
        country: colleges.country,
        createdAt: colleges.createdAt,
        updatedAt: colleges.updatedAt,
      })
      .from(colleges)
      .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
      .where(and(
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
        effectiveOrganizationId
          ? eq(colleges.organizationId, effectiveOrganizationId)
          : undefined,
      ))
      .orderBy(asc(colleges.name));
  }

  // Any active college membership can discover its own college. This is a
  // read-only lookup, not permission to administer the college or switch tenants.
  if (!context.membership) {
    throw new AuthorizationError("college.read");
  }

  if (
    organizationIdInput &&
    organizationIdInput !== context.membership.organizationId
  ) {
    throw new AuthorizationError("college.read");
  }

  requirePermission(context, "college.read", {
    organizationId: context.membership.organizationId,
    collegeId: context.membership.collegeId,
  });

  return db
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      name: colleges.name,
      code: colleges.code,
      logoObjectPath: colleges.logoObjectPath,
      addressLine1: colleges.addressLine1,
      addressLine2: colleges.addressLine2,
      landmark: colleges.landmark,
      postalCode: colleges.postalCode,
      city: colleges.city,
      state: colleges.state,
      country: colleges.country,
      createdAt: colleges.createdAt,
      updatedAt: colleges.updatedAt,
    })
    .from(colleges)
    .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
    .where(
      and(
        eq(colleges.id, context.membership.collegeId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);
  });
}

export async function resolveCollegeUsage(
  collegeId: string,
): Promise<CollegeUsage> {
  const db = getDb();

  const [
    membershipRows,
    departmentRows,
    academicPeriodRows,
    templateAssignmentRows,
    projectRows,
    placementRelationshipRows,
    placementSeasonRows,
    placementJobRows,
    tenantDomainRows,
  ] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(collegeMemberships)
      .where(
        and(
          eq(
            collegeMemberships.collegeId,
            collegeId,
          ),
          ne(
            collegeMemberships.status,
            "ENDED",
          ),
        ),
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(departments)
      .where(
        and(
          eq(departments.collegeId, collegeId),
          isNull(departments.archivedAt),
        ),
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(academicPeriods)
      .where(
        and(
          eq(
            academicPeriods.collegeId,
            collegeId,
          ),
          ne(
            academicPeriods.status,
            "CLOSED",
          ),
        ),
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(
        projectTemplateCollegeAssignments,
      )
      .where(
        and(
          eq(
            projectTemplateCollegeAssignments.collegeId,
            collegeId,
          ),
          isNull(
            projectTemplateCollegeAssignments.revokedAt,
          ),
        ),
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(projectInstances)
      .where(
        and(
          eq(
            projectInstances.collegeId,
            collegeId,
          ),
          ne(
            projectInstances.status,
            "ARCHIVED",
          ),
        ),
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(
        placementCompanyRelationships,
      )
      .where(
        and(
          eq(
            placementCompanyRelationships.collegeId,
            collegeId,
          ),
          eq(
            placementCompanyRelationships.status,
            "ACTIVE",
          ),
        ),
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(placementSeasons)
      .where(
        and(
          eq(
            placementSeasons.collegeId,
            collegeId,
          ),
          eq(
            placementSeasons.status,
            "ACTIVE",
          ),
        ),
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(placementJobs)
      .where(
        and(
          eq(
            placementJobs.collegeId,
            collegeId,
          ),
          ne(
            placementJobs.status,
            "ARCHIVED",
          ),
        ),
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(tenantDomains)
      .where(
        eq(
          tenantDomains.collegeId,
          collegeId,
        ),
      ),
  ]);

  return {
    memberships: Number(
      membershipRows[0]?.count ?? 0,
    ),
    departments: Number(
      departmentRows[0]?.count ?? 0,
    ),
    academicPeriods: Number(
      academicPeriodRows[0]?.count ?? 0,
    ),
    projectTemplateAssignments: Number(
      templateAssignmentRows[0]?.count ?? 0,
    ),
    projects: Number(
      projectRows[0]?.count ?? 0,
    ),
    placementRelationships: Number(
      placementRelationshipRows[0]?.count ??
        0,
    ),
    placementSeasons: Number(
      placementSeasonRows[0]?.count ?? 0,
    ),
    placementJobs: Number(
      placementJobRows[0]?.count ?? 0,
    ),
    tenantDomains: Number(
      tenantDomainRows[0]?.count ?? 0,
    ),
  };
}

export async function createCollege(
  context: RequestContext,
  rawInput: CreateCollegeInput,
) {
  const input = createCollegeInputSchema.parse(rawInput);
  const organization = await loadActiveOrganization(
    input.organizationId,
  );

  requirePermission(context, "college.manage", {
    organizationId: organization.id,
  });

  await assertUniqueCode(input.code);

  const db = getDb();

  try {
    return await db.transaction(async tx=>{
      // A college cannot be created from a stale Super Admin tab after the
      // parent was archived or the administrator's system role was removed.
      await assertPersistedPlatformPermission(tx,context,"college.manage",{
        organizationId:organization.id,
      });
      const [parent]=await tx.select({id:organizations.id}).from(organizations)
        .where(and(eq(organizations.id,organization.id),eq(organizations.status,"ACTIVE")))
        .for("share").limit(1);
      if(!parent)throw new CollegeServiceError("ORGANIZATION_NOT_FOUND");
      const [created]=await tx.insert(colleges).values(input).returning();
      if(!created)throw new CollegeServiceError("COLLEGE_NOT_FOUND");
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_CREATED,
        collegeId:created.id,organizationId:created.organizationId,
        subjectType:"college",subjectId:created.id,subjectLabel:created.name,
        summary:"College created",
        metadata:{collegeCode:created.code},
      });
      return created;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new CollegeServiceError("COLLEGE_CODE_CONFLICT");
    }
    throw error;
  }
}

export async function updateCollege(
  context: RequestContext,
  collegeIdInput: string,
  rawInput: UpdateCollegeInput,
) {
  const collegeId = collegeIdSchema.parse(collegeIdInput);
  const input = updateCollegeInputSchema.parse(rawInput);
  const college = await loadActiveCollege(collegeId);

  requirePermission(context, "college.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  return getDb().transaction(async tx=>{
    await assertPersistedPlatformPermission(tx,context,"college.manage",{
      collegeId,organizationId:college.organizationId,
    });
    const [parent]=await tx.select({id:organizations.id}).from(organizations)
      .where(and(eq(organizations.id,college.organizationId),eq(organizations.status,"ACTIVE")))
      .for("share").limit(1);
    if(!parent)throw new CollegeServiceError("ORGANIZATION_NOT_FOUND");
    const appointIds=[input.chairMembershipId,input.viceChairMembershipId]
      .filter((id):id is string=>typeof id==="string");
    for(const membershipId of new Set(appointIds)){
      const [eligible]=await tx.select({id:collegeMemberships.id})
        .from(collegeMemberships)
        .where(and(eq(collegeMemberships.id,membershipId),
          eq(collegeMemberships.collegeId,collegeId),
          eq(collegeMemberships.status,"ACTIVE")))
        .limit(1);
      if(!eligible)throw new CollegeServiceError("COLLEGE_APPOINTEE_INVALID");
    }
    const [updated]=await tx.update(colleges).set({
      ...input,updatedAt:new Date(),
    }).where(and(eq(colleges.id,collegeId),eq(colleges.status,"ACTIVE"))).returning();
    if(!updated)throw new CollegeServiceError("COLLEGE_NOT_FOUND");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_UPDATED,
      collegeId:updated.id,organizationId:updated.organizationId,
      subjectType:"college",subjectId:updated.id,subjectLabel:updated.name,
      summary:"College details updated",
      metadata:{code:updated.code},
    });
    return updated;
  });
}


export async function archiveCollege(
  context: RequestContext,
  collegeIdInput: string,
  resolveUsage: (
    collegeId: string,
  ) => Promise<CollegeUsage> =
    resolveCollegeUsage,
) {
  const collegeId =
    collegeIdSchema.parse(collegeIdInput);
  const college =
    await loadActiveCollege(collegeId);

  if (!isSuperAdmin(context)) {
    throw new AuthorizationError(
      "college.manage",
    );
  }

  requirePermission(context, "college.manage", {
    organizationId:
      college.organizationId,
    collegeId: college.id,
  });

  const usage = await resolveUsage(collegeId);
  assertCollegeCanArchive(usage);

  const archivedAt = new Date();
  return getDb().transaction(async tx=>{
    await assertPersistedPlatformPermission(tx,context,"college.manage",{
      collegeId,organizationId:college.organizationId,
    });
    const [archived]=await tx.update(colleges)
      .set({status:"ARCHIVED",updatedAt:archivedAt})
      .where(and(eq(colleges.id,collegeId),eq(colleges.status,"ACTIVE")))
      .returning({id:colleges.id,organizationId:colleges.organizationId,
        name:colleges.name,code:colleges.code,status:colleges.status});
    if(!archived)throw new CollegeServiceError("COLLEGE_NOT_FOUND");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_ARCHIVED,
      collegeId:archived.id,organizationId:archived.organizationId,
      subjectType:"college",subjectId:archived.id,subjectLabel:archived.name,
      summary:"College archived",metadata:{code:archived.code},
    });
    return archived;
  });
}

/** SA-tenants-modules-R02: restore only the selected archived tenant under
 * an ACTIVE parent. No memberships, domains, or services are turned on here. */
export async function restoreCollege(context:RequestContext,rawId:unknown){
 const collegeId=collegeIdSchema.parse(rawId);
 if(!isSuperAdmin(context))throw new AuthorizationError("college.manage");
 const db=getDb();
 const [candidate]=await db.select({
  id:colleges.id,name:colleges.name,code:colleges.code,status:colleges.status,
  organizationId:colleges.organizationId,organizationStatus:organizations.status,
 }).from(colleges).innerJoin(organizations,eq(organizations.id,colleges.organizationId))
 .where(eq(colleges.id,collegeId)).limit(1);
 if(!candidate||candidate.status!=="ARCHIVED")
  throw new CollegeServiceError("COLLEGE_NOT_FOUND");
 requirePermission(context,"college.manage",{collegeId,organizationId:candidate.organizationId});
 if(candidate.organizationStatus!=="ACTIVE")
  throw new CollegeServiceError("ORGANIZATION_NOT_FOUND");
 return db.transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"college.manage",{
   collegeId,organizationId:candidate.organizationId,
  });
  const [parent]=await tx.select({id:organizations.id}).from(organizations)
   .where(and(eq(organizations.id,candidate.organizationId),eq(organizations.status,"ACTIVE")))
   .for("share").limit(1);
  if(!parent)throw new CollegeServiceError("ORGANIZATION_NOT_FOUND");
  const [restored]=await tx.update(colleges)
   .set({status:"ACTIVE",updatedAt:new Date()})
   .where(and(eq(colleges.id,collegeId),eq(colleges.status,"ARCHIVED"),
    sql`exists(select 1 from organizations o where o.id=${colleges.organizationId} and o.status='ACTIVE')`))
   .returning({id:colleges.id,name:colleges.name,organizationId:colleges.organizationId,
    code:colleges.code,status:colleges.status});
  if(!restored)throw new CollegeServiceError("COLLEGE_NOT_FOUND");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_RESTORED,
   collegeId:restored.id,organizationId:restored.organizationId,
   subjectType:"college",subjectId:restored.id,subjectLabel:restored.name,
   summary:"Archived college restored",
   metadata:{code:restored.code,fromStatus:"ARCHIVED",toStatus:"ACTIVE"},
  });
  return restored;
 });
}
