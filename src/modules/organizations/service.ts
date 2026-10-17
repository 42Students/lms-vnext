import { and, asc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import { colleges, organizations } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  hasMembershipRole,
  isSuperAdmin,
} from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  createOrganizationInputSchema,
  organizationIdSchema,
  renameOrganizationInputSchema,
  type CreateOrganizationInput,
  type RenameOrganizationInput,
} from "./validation";

export type OrganizationServiceErrorCode =
  | "ORGANIZATION_NOT_FOUND"
  | "ORGANIZATION_NAME_CONFLICT"
  | "ORGANIZATION_HAS_COLLEGES";

export class OrganizationServiceError extends Error {
  constructor(public readonly code: OrganizationServiceErrorCode) {
    super(code);
    this.name = "OrganizationServiceError";
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
    .select({
      id: organizations.id,
      name: organizations.name,
    })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, organizationId),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!organization) {
    throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
  }

  return organization;
}

async function assertUniqueActiveName(
  name: string,
  excludeOrganizationId?: string,
) {
  const db = getDb();

  const conditions = [
    eq(organizations.status, "ACTIVE"),
    sql<boolean>`lower(${organizations.name}) = ${name.toLowerCase()}`,
  ];

  if (excludeOrganizationId) {
    conditions.push(ne(organizations.id, excludeOrganizationId));
  }

  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    throw new OrganizationServiceError("ORGANIZATION_NAME_CONFLICT");
  }
}

export async function listOrganizations(context: RequestContext) {
  const db = getDb();

  if (isSuperAdmin(context)) {
    const selected = context.adminScope;
    const selectedOrganizationId =
      selected?.organizationId ?? null;

    if (selectedOrganizationId) {
      requirePermission(context, "organization.read", {
        organizationId: selectedOrganizationId,
        collegeId: selected?.collegeId ?? null,
      });

      return db
        .select({
          id: organizations.id,
          name: organizations.name,
          createdAt: organizations.createdAt,
          updatedAt: organizations.updatedAt,
        })
        .from(organizations)
        .where(
          and(
            eq(organizations.id, selectedOrganizationId),
            eq(organizations.status, "ACTIVE"),
          ),
        )
        .orderBy(asc(organizations.name));
    }

    return db
      .select({
        id: organizations.id,
        name: organizations.name,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .where(eq(organizations.status, "ACTIVE"))
      .orderBy(asc(organizations.name));
  }

  if (
    !context.membership ||
    !hasMembershipRole(context, "COLLEGE_ADMIN")
  ) {
    requirePermission(context, "organization.read", {});
  }

  const organizationId = context.membership?.organizationId;
  if (!organizationId) {
    requirePermission(context, "organization.read", {});
    return [];
  }

  requirePermission(context, "organization.read", {
    organizationId,
  });

  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, organizationId),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);
}

export async function createOrganization(
  context: RequestContext,
  rawInput: CreateOrganizationInput,
) {
  const input = createOrganizationInputSchema.parse(rawInput);

  requirePermission(context, "organization.manage", {});
  await assertUniqueActiveName(input.name);

  const db = getDb();

  try {
    return await db.transaction(async tx=>{
      const [created]=await tx.insert(organizations).values({name:input.name})
       .returning({id:organizations.id,name:organizations.name,createdAt:organizations.createdAt,
        updatedAt:organizations.updatedAt});
      if(!created)throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PLATFORM_ORGANIZATION_CREATED,
        organizationId:created.id,subjectType:"organization",subjectId:created.id,
        subjectLabel:created.name,summary:"Organization created",
      });
      return created;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new OrganizationServiceError("ORGANIZATION_NAME_CONFLICT");
    }
    throw error;
  }
}

export async function renameOrganization(
  context: RequestContext,
  organizationIdInput: string,
  rawInput: RenameOrganizationInput,
) {
  const organizationId =
    organizationIdSchema.parse(organizationIdInput);
  const input = renameOrganizationInputSchema.parse(rawInput);
  const organization = await loadActiveOrganization(organizationId);

  requirePermission(context, "organization.manage", {
    organizationId: organization.id,
  });

  await assertUniqueActiveName(input.name, organizationId);

  const db = getDb();

  try {
    return await db.transaction(async tx=>{
      const [updated]=await tx.update(organizations).set({name:input.name,updatedAt:new Date()})
       .where(and(eq(organizations.id,organizationId),eq(organizations.status,"ACTIVE")))
       .returning({id:organizations.id,name:organizations.name,createdAt:organizations.createdAt,
        updatedAt:organizations.updatedAt});
      if(!updated)throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PLATFORM_ORGANIZATION_RENAMED,
        organizationId:updated.id,subjectType:"organization",subjectId:updated.id,
        subjectLabel:updated.name,summary:"Organization renamed",
        metadata:{previousName:organization.name},
      });
      return updated;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new OrganizationServiceError("ORGANIZATION_NAME_CONFLICT");
    }
    throw error;
  }
}

export async function archiveOrganization(
  context: RequestContext,
  organizationIdInput: string,
) {
  const organizationId =
    organizationIdSchema.parse(organizationIdInput);
  const organization = await loadActiveOrganization(organizationId);

  requirePermission(context, "organization.manage", {
    organizationId: organization.id,
  });

  const db = getDb();

  const [activeCollege] = await db
    .select({ id: colleges.id })
    .from(colleges)
    .where(
      and(
        eq(colleges.organizationId, organizationId),
        eq(colleges.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (activeCollege) {
    throw new OrganizationServiceError("ORGANIZATION_HAS_COLLEGES");
  }

  return db.transaction(async tx=>{
    const [archived]=await tx.update(organizations).set({status:"ARCHIVED",updatedAt:new Date()})
     .where(and(eq(organizations.id,organizationId),eq(organizations.status,"ACTIVE")))
     .returning({id:organizations.id,name:organizations.name,status:organizations.status});
    if(!archived)throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PLATFORM_ORGANIZATION_ARCHIVED,
      organizationId:archived.id,subjectType:"organization",subjectId:archived.id,
      subjectLabel:archived.name,summary:"Organization archived",
    });
    return archived;
  });
}

/** SA-tenants-modules-R02: archived organizations are recoverable, but only by
 * a Super Admin in the authorized organization scope. No college is implicitly restored. */
export async function restoreOrganization(context:RequestContext, rawId:unknown){
 const organizationId=organizationIdSchema.parse(rawId);
 if(!isSuperAdmin(context))requirePermission(context,"admin-scope.select");
 requirePermission(context,"organization.manage",{organizationId});
 const db=getDb();
 const [candidate]=await db.select({name:organizations.name,status:organizations.status})
  .from(organizations).where(eq(organizations.id,organizationId)).limit(1);
 if(!candidate||candidate.status!=="ARCHIVED")
  throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
 await assertUniqueActiveName(candidate.name,organizationId);
 try{
  return await db.transaction(async tx=>{
   const [restored]=await tx.update(organizations)
    .set({status:"ACTIVE",updatedAt:new Date()})
    .where(and(eq(organizations.id,organizationId),eq(organizations.status,"ARCHIVED")))
    .returning({id:organizations.id,name:organizations.name,status:organizations.status});
   if(!restored)throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
   await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PLATFORM_ORGANIZATION_RESTORED,
    organizationId:restored.id,subjectType:"organization",subjectId:restored.id,
    subjectLabel:restored.name,summary:"Archived organization restored",
    metadata:{fromStatus:"ARCHIVED",toStatus:"ACTIVE"},
   });
   return restored;
  });
 }catch(error){
  if(isUniqueViolation(error))
   throw new OrganizationServiceError("ORGANIZATION_NAME_CONFLICT");
  throw error;
 }
}
export async function listArchivedOrganizations(context:RequestContext){
 if(!isSuperAdmin(context))requirePermission(context,"admin-scope.select");
 requirePermission(context,"organization.manage",{
  organizationId:context.adminScope?.organizationId??undefined,
  collegeId:context.adminScope?.collegeId??undefined,
 });
 return getDb().select({
  id:organizations.id,name:organizations.name,createdAt:organizations.createdAt,
 }).from(organizations).where(and(
  eq(organizations.status,"ARCHIVED"),
  context.adminScope?.organizationId?eq(organizations.id,context.adminScope.organizationId):undefined,
 )).orderBy(asc(organizations.name)).limit(200);
}
