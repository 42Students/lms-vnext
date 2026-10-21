import { and, asc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import { colleges, organizations } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  hasMembershipRole,
  isSuperAdmin,
} from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
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
 // Organization names are visible only while the current persisted actor
 // keeps organization.read. Hold live actor locks through the directory SELECT
 // instead of trusting the stale role captured at request startup.
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"organization.read",{
   collegeId:context.adminScope?.collegeId??undefined,
   organizationId:context.adminScope?.organizationId??
    context.membership?.organizationId??undefined,
  });
  if(isSuperAdmin(context)){
   const selected=context.adminScope;
   const selectedOrganizationId=selected?.organizationId??null;
   if(selected?.collegeId){
    requirePermission(context,"organization.read",{
     organizationId:selectedOrganizationId,collegeId:selected.collegeId,
    });
    // College-only scope resolves through the actual college FK, never
    // falls back to every organization just because orgId is not selected.
    return tx.select({
     id:organizations.id,name:organizations.name,
     createdAt:organizations.createdAt,updatedAt:organizations.updatedAt,
    }).from(organizations)
     .innerJoin(colleges,eq(colleges.organizationId,organizations.id))
     .where(and(eq(colleges.id,selected.collegeId),eq(colleges.status,"ACTIVE"),
      eq(organizations.status,"ACTIVE"),
      selectedOrganizationId?eq(organizations.id,selectedOrganizationId):undefined))
     .limit(1);
   }
   if(selectedOrganizationId){
    requirePermission(context,"organization.read",{organizationId:selectedOrganizationId});
    return tx.select({
     id:organizations.id,name:organizations.name,
     createdAt:organizations.createdAt,updatedAt:organizations.updatedAt,
    }).from(organizations)
     .where(and(eq(organizations.id,selectedOrganizationId),eq(organizations.status,"ACTIVE")))
     .orderBy(asc(organizations.name));
   }
   return tx.select({
    id:organizations.id,name:organizations.name,
    createdAt:organizations.createdAt,updatedAt:organizations.updatedAt,
   }).from(organizations)
    .where(eq(organizations.status,"ACTIVE")).orderBy(asc(organizations.name));
  }
  if(!context.membership||!hasMembershipRole(context,"COLLEGE_ADMIN"))
   requirePermission(context,"organization.read");
  const organizationId=context.membership?.organizationId;
  if(!organizationId){
   requirePermission(context,"organization.read");
   return [];
  }
  requirePermission(context,"organization.read",{organizationId});
  return tx.select({
   id:organizations.id,name:organizations.name,
   createdAt:organizations.createdAt,updatedAt:organizations.updatedAt,
  }).from(organizations)
   .where(and(eq(organizations.id,organizationId),eq(organizations.status,"ACTIVE")))
   .limit(1);
 });
}

export async function createOrganization(
  context: RequestContext,
  rawInput: CreateOrganizationInput,
) {
  const input = createOrganizationInputSchema.parse(rawInput);

  // Legacy create is a platform-global operation. A selected organization or
  // college scope may rename its own organization but must not create siblings.
  if(context.adminScope?.organizationId||context.adminScope?.collegeId)
    throw new AuthorizationError("organization.manage");
  requirePermission(context, "organization.manage", {});
  await assertUniqueActiveName(input.name);

  const db = getDb();

  try {
    return await db.transaction(async tx=>{
      await assertPersistedPlatformPermission(tx,context,"organization.manage");
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
      await assertPersistedPlatformPermission(tx,context,"organization.manage",{organizationId});
      const [locked]=await tx.select({id:organizations.id}).from(organizations)
        .where(and(eq(organizations.id,organizationId),eq(organizations.status,"ACTIVE")))
        .for("update").limit(1);
      if(!locked)throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
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
  return db.transaction(async tx=>{
    await assertPersistedPlatformPermission(tx,context,"organization.manage",{organizationId});
    // Lock the parent before checking for children; a concurrent college
    // insert requires a FK SHARE lock on this row and cannot sneak in
    // between the zero-child check and archival.
    const [activeParent]=await tx.select({id:organizations.id}).from(organizations)
      .where(and(eq(organizations.id,organizationId),eq(organizations.status,"ACTIVE")))
      .for("update").limit(1);
    if(!activeParent)throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
    const [activeCollege] = await tx.select({id:colleges.id}).from(colleges)
      .where(and(eq(colleges.organizationId,organizationId),eq(colleges.status,"ACTIVE")))
      .limit(1);
    if(activeCollege)throw new OrganizationServiceError("ORGANIZATION_HAS_COLLEGES");
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
   await assertPersistedPlatformPermission(tx,context,"organization.manage",{organizationId});
   const [parent]=await tx.select({id:organizations.id}).from(organizations)
    .where(and(eq(organizations.id,organizationId),eq(organizations.status,"ARCHIVED")))
    .for("update").limit(1);
   if(!parent)throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
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
 const selectedCollegeId=context.adminScope?.collegeId??null;
 let organizationId=context.adminScope?.organizationId??null;
 requirePermission(context,"organization.manage",{
  organizationId:organizationId??undefined,collegeId:selectedCollegeId??undefined,
 });
 return getDb().transaction(async tx=>{
  // A college-scoped Super Admin cannot enumerate every archived parent when
  // the selected organization is missing from the request context.
  if(selectedCollegeId){
   const [selected]=await tx.select({organizationId:colleges.organizationId})
    .from(colleges).where(eq(colleges.id,selectedCollegeId)).for("share").limit(1);
   if(!selected||(organizationId&&organizationId!==selected.organizationId))
    throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
   organizationId=selected.organizationId;
  }
  await assertPersistedPlatformPermission(tx,context,"organization.manage",{
   organizationId:organizationId??undefined,collegeId:selectedCollegeId??undefined,
  });
  return tx.select({
   id:organizations.id,name:organizations.name,createdAt:organizations.createdAt,
   updatedAt:organizations.updatedAt,status:organizations.status,
  }).from(organizations).where(and(
   eq(organizations.status,"ARCHIVED"),
   organizationId?eq(organizations.id,organizationId):undefined,
  )).orderBy(asc(organizations.name)).limit(200);
 });
}
