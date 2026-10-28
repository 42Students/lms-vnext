import {
  and,
  asc,
  eq,
  inArray,
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
  membershipRoles,
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
  const resourceOrganizationId = isSuperAdmin(context)
    ? context.adminScope?.organizationId
    : context.membership?.organizationId;
  const resourceCollegeId = isSuperAdmin(context)
    ? context.adminScope?.collegeId
    : context.membership?.collegeId;
  const resource = {
    ...(resourceOrganizationId !== undefined ? { organizationId: resourceOrganizationId } : {}),
    ...(resourceCollegeId !== undefined ? { collegeId: resourceCollegeId } : {}),
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

/** Deleted Items lists only archived colleges within the Super Admin's
 * selected safety scope. Restoration remains a separate, transaction-guarded
 * mutation and never resurrects students, sign-in or tenant domains. */
export async function listArchivedColleges(context: RequestContext) {
  if (!isSuperAdmin(context)) throw new AuthorizationError("college.manage");
  const selectedCollegeId=context.adminScope?.collegeId??null;
  const selectedOrganizationId=context.adminScope?.organizationId??null;
  requirePermission(context,"college.manage",{
    ...(selectedOrganizationId !== null ? { organizationId: selectedOrganizationId } : {}),
    ...(selectedCollegeId !== null ? { collegeId: selectedCollegeId } : {}),
  });
  return getDb().transaction(async tx=>{
    await assertPersistedPlatformPermission(tx,context,"college.manage",{
      ...(selectedOrganizationId !== null ? { organizationId: selectedOrganizationId } : {}),
      ...(selectedCollegeId !== null ? { collegeId: selectedCollegeId } : {}),
    });
    return tx.select({
      id:colleges.id,name:colleges.name,code:colleges.code,
      organizationId:colleges.organizationId,
      createdAt:colleges.createdAt,updatedAt:colleges.updatedAt,
      status:colleges.status,
    }).from(colleges)
      .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
      .where(and(
        eq(colleges.status,"ARCHIVED"),
        eq(organizations.status,"ACTIVE"),
        selectedCollegeId?eq(colleges.id,selectedCollegeId):undefined,
        selectedOrganizationId?eq(colleges.organizationId,selectedOrganizationId):undefined,
      ))
      .orderBy(asc(colleges.name),asc(colleges.id)).limit(200);
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
      .where(and(
        eq(tenantDomains.collegeId, collegeId),
        isNull(tenantDomains.deletedAt),
      )),
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
    // Keep appointments on the separate, college-scoped faculty membership
    // association. A learner or placement-only membership cannot become a
    // faculty chair simply because its UUID belongs to this college.
    const [prior]=await tx.select({
      id:colleges.id,chairMembershipId:colleges.chairMembershipId,
      viceChairMembershipId:colleges.viceChairMembershipId,
    }).from(colleges).where(and(eq(colleges.id,collegeId),
      eq(colleges.status,"ACTIVE"))).for("update").limit(1);
    if(!prior)throw new CollegeServiceError("COLLEGE_NOT_FOUND");
    const appointIds=[input.chairMembershipId,input.viceChairMembershipId]
      .filter((id):id is string=>typeof id==="string");
    if(input.chairMembershipId&&input.viceChairMembershipId&&
      input.chairMembershipId===input.viceChairMembershipId)
      throw new CollegeServiceError("COLLEGE_APPOINTEE_INVALID");
    for(const membershipId of new Set(appointIds)){
      const [eligible]=await tx.select({id:collegeMemberships.id})
        .from(collegeMemberships)
        .innerJoin(membershipRoles,and(
          eq(membershipRoles.membershipId,collegeMemberships.id),
          eq(membershipRoles.role,"FACULTY"),
        ))
        .where(and(eq(collegeMemberships.id,membershipId),
          eq(collegeMemberships.collegeId,collegeId),
          eq(collegeMemberships.status,"ACTIVE")))
        .for("share",{of:collegeMemberships}).limit(1);
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
      metadata:{code:updated.code,
       ...(input.chairMembershipId!==undefined?{
        chairMembershipId:{before:prior.chairMembershipId,after:updated.chairMembershipId}}:{}),
       ...(input.viceChairMembershipId!==undefined?{
        viceChairMembershipId:{before:prior.viceChairMembershipId,after:updated.viceChairMembershipId}}:{}),
      },
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
    // Scope must be rechecked under the tenant row lock before archiving.
    const [current]=await tx.select({
      id:colleges.id,organizationId:colleges.organizationId,
      collegeStatus:colleges.status,organizationStatus:organizations.status,
    }).from(colleges)
      .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
      .where(eq(colleges.id,collegeId)).for("update").limit(1);
    if(!current||current.organizationId!==college.organizationId||
       current.collegeStatus!=="ACTIVE"||current.organizationStatus!=="ACTIVE")
      throw new AuthorizationError("college.manage");
    // Dependency preflight ran outside this transaction. Recheck tenant
    // identity children under the parent row lock: a concurrent write may
    // have committed after the preflight, before this transaction began.
    const [liveDomains,liveMembers]=await Promise.all([
      tx.select({count:sql<number>`count(*)::int`}).from(tenantDomains)
        .where(and(eq(tenantDomains.collegeId,collegeId),
          isNull(tenantDomains.deletedAt))),
      tx.select({count:sql<number>`count(*)::int`}).from(collegeMemberships)
        .where(and(eq(collegeMemberships.collegeId,collegeId),
          ne(collegeMemberships.status,"ENDED"))),
    ]);
    assertCollegeCanArchive({...usage,
      tenantDomains:Number(liveDomains[0]?.count??0),
      memberships:Number(liveMembers[0]?.count??0),
    });
    const [archived]=await tx.update(colleges)
      .set({status:"ARCHIVED",updatedAt:archivedAt})
      .where(and(eq(colleges.id,collegeId),eq(colleges.status,"ACTIVE"),
        eq(colleges.organizationId,current.organizationId)))
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
   metadata:{code:restored.code,fromStatus:"ARCHIVED",toStatus:"ACTIVE",restoreType:"COLLEGE_RESTORE",entityName:restored.name,cascadeRestored:false,restoredDescendants:0},
  });
  // Only the selected college returns to ACTIVE; never cascade into members or child data.
  return {...restored,restoreType:"COLLEGE_RESTORE" as const,
    cascadeRestored:false as const,restoredDescendants:0,
    message:"College restored successfully."};
 });
}

/** The legacy CollegeSearchCache synonyms; kept local to college searching
 * so aliases never become new tenant identifiers or authorization decisions. */
const collegeSearchSynonyms:Readonly<Record<string,string>>={
 iit:"indian institute of technology",nit:"national institute of technology",
 iiit:"international institute of information technology",
 bits:"birla institute of technology and science",
 vit:"vellore institute of technology",srm:"srm institute of science and technology",
 amrita:"amrita vishwa vidyapeetham",anna:"anna university",
 manipal:"manipal institute of technology",pes:"pes university",
 rvce:"rv college of engineering",bmsce:"bms college of engineering",
 msrit:"ms ramaiah institute of technology",
 dsce:"dayananda sagar college of engineering",
 sjce:"sri jayachamarajendra college of engineering",
 nie:"national institute of engineering",
 jss:"jss science and technology university",
 atria:"atria institute of technology",cmr:"cmr institute of technology",
 acharya:"acharya institute of technology",
 "new horizon":"new horizon college of engineering",
 oxford:"oxford college of engineering",presidency:"presidency university",
 christ:"christ university","mount carmel":"mount carmel college",
 "st joseph":"st joseph college",
};
function collegeSearchNormalized(value:string){
 return value.toLocaleLowerCase("en-IN").replace(/[^\p{L}\p{N}]+/gu," ").trim();
}
/** Bounded edit-distance-2 check for the old cache's rare typo fallback.
 * Unlike full-matrix distance it exits as soon as a row exceeds the bound. */
function collegeSearchNear(query:string,name:string):boolean{
 if(query.length<3||name.length>100)return false;
 const candidates=[name,...name.split(" ")].filter(Boolean);
 return candidates.some(candidate=>{
  if(Math.abs(candidate.length-query.length)>2)return false;
  let previous=Array.from({length:candidate.length+1},(_,index)=>index);
  for(let i=1;i<=query.length;i++){
   const current=[i];
   let minimum=i;
   for(let j=1;j<=candidate.length;j++){
    const distance=Math.min(current[j-1]!+1,previous[j]!+1,
     previous[j-1]!+(query[i-1]===candidate[j-1]?0:1));
    current.push(distance);minimum=Math.min(minimum,distance);
   }
   if(minimum>2)return false;
   previous=current;
  }
  return previous[candidate.length]!<=2;
 });
}
function collegeSearchScore(fields:readonly string[],term:string){
 let best=0;
 for(const field of fields){
  const value=collegeSearchNormalized(field);
  if(!value)continue;
  if(value===term)best=Math.max(best,100);
  else if(value.startsWith(term))best=Math.max(best,80);
  else if(value.includes(" "+term))best=Math.max(best,60);
  else if(value.includes(term))best=Math.max(best,40);
  else if(best<20&&collegeSearchNear(term,value))best=20;
 }
 return best;
}

/**
 * Safe college-search adapter. The model deliberately keeps UUID IDs rather
 * than fabricating legacy numeric IDs. Never cache records across role/scope
 * changes; each call performs listColleges' persisted permission checks.
 * A logo object path is not a public URL; callers need authorized signing.
 */
export async function listAuthorizedCollegeSearchOptions(
 context:RequestContext,
 options:{organizationId?:string|null;q?:string;limit?:number}={},
){
 const q=(options.q??"").trim();
 if(q.length>200)throw new RangeError("College search must be 200 characters or fewer");
 const cap=Math.max(1,Math.min(options.limit??(q?15:10),50));
 const rows=await listColleges(context,options.organizationId);
 const term=collegeSearchNormalized(q);
 const expanded=collegeSearchSynonyms[term]??term;
 const ranked=rows.map(row=>{
  const fields=[row.name,row.code,row.city??"",row.state??"",row.country??"",
   row.addressLine1??"",row.addressLine2??"",row.landmark??""];
  return {row,score:term?Math.max(
    collegeSearchScore(fields,term),
    expanded!==term?collegeSearchScore(fields,expanded):0,
  ):0};
 }).filter(item=>!term||item.score>0);
 // Search usage in the old cache is process-local, and cannot safely be
 // invented after a restart. Active membership is an explicit, durable
 // popularity tie-breaker among ALREADY AUTHORIZED colleges only.
 const popularity=new Map<string,number>();
 if(ranked.length>1&&ranked.length<=2000){
  const counts=await getDb().select({
   collegeId:collegeMemberships.collegeId,
   total:sql<number>`count(*)::int`,
  }).from(collegeMemberships).where(and(
   inArray(collegeMemberships.collegeId,ranked.map(item=>item.row.id)),
   eq(collegeMemberships.status,"ACTIVE"),
  )).groupBy(collegeMemberships.collegeId);
  for(const item of counts)popularity.set(item.collegeId,Number(item.total));
 }
 ranked.sort((a,b)=>
  b.score-a.score||
  (popularity.get(b.row.id)??0)-(popularity.get(a.row.id)??0)||
  a.row.name.localeCompare(b.row.name)||a.row.id.localeCompare(b.row.id));
 return ranked.slice(0,cap).map(({row})=>({
  id:row.id,
  organizationId:row.organizationId,
  name:row.name,
  code:row.code,
  uniqueId:row.code,
  address:row.addressLine1??"",
  city:row.city??"",
  state:row.state??"",
  zip:row.postalCode??"",
  logo:null as string|null,
  logoObjectPath:row.logoObjectPath,
 }));
}


/** Organization-only read-only college directory for active members, distinct
 * from switching admin scope. The persisted caller membership, not a query
 * parameter, selects the tenant; no contacts or private college fields leak. */
export async function listAuthorizedOrganizationCollegePicker(
  context:RequestContext,
  options:{organizationId?:string|null;q?:string;limit?:number}={},
){
 if(isSuperAdmin(context)){
  return (await listAuthorizedCollegeSearchOptions(context,options)).map(row=>({
   id:row.id,organizationId:row.organizationId,name:row.name,
   code:row.code,uniqueId:row.uniqueId,
  }));
 }
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("college.read");
 if(options.organizationId&&options.organizationId!==member.organizationId)
  throw new AuthorizationError("college.read");
 requirePermission(context,"college.read",{
  organizationId:member.organizationId,collegeId:member.collegeId,
 });
 const q=(options.q??"").trim();
 if(q.length>200)throw new RangeError("College search must be 200 characters or fewer");
 const limit=Math.max(1,Math.min(50,options.limit??(q?15:10)));
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"college.read",{
   organizationId:member.organizationId,collegeId:member.collegeId,
  });
  const rows=await tx.select({
   id:colleges.id,organizationId:colleges.organizationId,
   name:colleges.name,code:colleges.code,
   city:colleges.city,state:colleges.state,
  }).from(colleges)
   .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
   .where(and(eq(colleges.organizationId,member.organizationId),
    eq(colleges.status,"ACTIVE"),eq(organizations.status,"ACTIVE")))
   .orderBy(asc(colleges.id)).limit(2001);
  if(rows.length>2000)throw new RangeError("Organization college directory too large");
  const query=collegeSearchNormalized(q);
  const alias=collegeSearchSynonyms[query]??query;
  const ranked=rows.map(row=>({
   row,score:query?Math.max(
    collegeSearchScore([row.name,row.code,row.city??"",row.state??""],query),
    alias!==query?collegeSearchScore([row.name,row.code,row.city??"",row.state??""],alias):0,
   ):0,
  })).filter(item=>!query||item.score>0);
  const popularity=new Map<string,number>();
  for(let start=0;start<ranked.length;start+=500){
   const ids=ranked.slice(start,start+500).map(item=>item.row.id);
   if(!ids.length)continue;
   const counts=await tx.select({
    collegeId:collegeMemberships.collegeId,
    total:sql<number>`count(*)::int`,
   }).from(collegeMemberships).where(and(
    inArray(collegeMemberships.collegeId,ids),
    eq(collegeMemberships.status,"ACTIVE"),
   )).groupBy(collegeMemberships.collegeId);
   for(const item of counts)popularity.set(item.collegeId,Number(item.total));
  }
  ranked.sort((a,b)=>b.score-a.score||
   (popularity.get(b.row.id)??0)-(popularity.get(a.row.id)??0)||
   a.row.name.localeCompare(b.row.name)||a.row.id.localeCompare(b.row.id));
  return ranked.slice(0,limit).map(({row})=>({
   id:row.id,organizationId:row.organizationId,
   name:row.name,code:row.code,uniqueId:row.code,
  }));
 });
}
