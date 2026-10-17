import {
  and,
  asc,
  eq,
  ilike,
  inArray,
  sql,
  isNull,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { can, requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import {
  collegeMemberships,
  membershipRoles,
  placementCompanies,
  placementCompanyRelationships,
  placementJobs,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePlacementManageScope } from "./scope";
import { PlacementsServiceError } from "./errors";
import {
  createPlacementCompanyInputSchema,
  placementCompanyRelationshipIdSchema,
  updatePlacementCompanyRelationshipInputSchema,
  type CreatePlacementCompanyInput,
  type UpdatePlacementCompanyRelationshipInput,
} from "./validation";

async function loadRelationship(
  relationshipId: string,
) {
  const [row] = await getDb()
    .select({
      relationship: placementCompanyRelationships,
      company: placementCompanies,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .where(
      eq(
        placementCompanyRelationships.id,
        relationshipId,
      ),
    )
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND",
    );
  }

  return row;
}

async function requireValidOwner(
  collegeId: string,
  membershipId: string,
) {
  const rows = await getDb()
    .select({ role: membershipRoles.role })
    .from(collegeMemberships)
    .innerJoin(
      membershipRoles,
      eq(
        membershipRoles.membershipId,
        collegeMemberships.id,
      ),
    )
    .where(
      and(
        eq(collegeMemberships.id, membershipId),
        eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    );

  if (rows.length === 0) {
    throw new PlacementsServiceError(
      "PLACEMENT_OWNER_MEMBERSHIP_NOT_FOUND",
    );
  }

  if (
    !rows.some(
      ({ role }) =>
        role === "TPO" || role === "COLLEGE_ADMIN",
    )
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_OWNER_ROLE_REQUIRED",
    );
  }
}

export async function listPlacementCompanies(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId =
    createPlacementCompanyInputSchema.shape.collegeId.parse(
      collegeIdInput,
    );
  await requirePlacementManageScope(context, collegeId);

  return getDb()
    .select({
      relationshipId: placementCompanyRelationships.id,
      companyId: placementCompanies.id,
      name: placementCompanies.name,
      websiteUrl: placementCompanies.websiteUrl,
      primaryDomain: placementCompanies.primaryDomain,
      otherNames: sql<string[]>`(select coalesce(array_agg(a.alias order by a.alias),array[]::text[])
        from placement_company_aliases a where a.company_id=${placementCompanies.id})`,
      domains: sql<string[]>`(select coalesce(array_agg(d.domain order by d.domain),array[]::text[])
        from placement_company_domains d where d.company_id=${placementCompanies.id})`,
      logoObjectPath: placementCompanies.logoObjectPath,
      isTrusted: placementCompanyRelationships.isTrusted,
      ownerMembershipId:
        placementCompanyRelationships.ownerMembershipId,
      createdAt: placementCompanyRelationships.createdAt,
      updatedAt: placementCompanyRelationships.updatedAt,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .where(
      and(
        eq(placementCompanyRelationships.collegeId, collegeId),
        eq(placementCompanyRelationships.status, "ACTIVE"),
        eq(placementCompanies.status, "ACTIVE"),
        isNull(placementCompanyRelationships.archivedAt),
      ),
    )
    .orderBy(asc(placementCompanies.name));
}

export async function listPlacementRelationshipOwners(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId =
    createPlacementCompanyInputSchema.shape.collegeId.parse(
      collegeIdInput,
    );
  await requirePlacementManageScope(
    context,
    collegeId,
  );

  const rows = await getDb()
    .select({
      membershipId: collegeMemberships.id,
      displayName: users.displayName,
      email: users.email,
      role: membershipRoles.role,
    })
    .from(collegeMemberships)
    .innerJoin(
      membershipRoles,
      eq(
        membershipRoles.membershipId,
        collegeMemberships.id,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(
      and(
        eq(
          collegeMemberships.collegeId,
          collegeId,
        ),
        eq(
          collegeMemberships.status,
          "ACTIVE",
        ),
        inArray(membershipRoles.role, [
          "TPO",
          "COLLEGE_ADMIN",
        ]),
      ),
    )
    .orderBy(asc(users.displayName));

  const owners = new Map<
    string,
    {
      membershipId: string;
      displayName: string | null;
      email: string | null;
      roles: string[];
    }
  >();

  for (const row of rows) {
    const current = owners.get(
      row.membershipId,
    );
    if (current) {
      if (!current.roles.includes(row.role)) {
        current.roles.push(row.role);
      }
      continue;
    }
    owners.set(row.membershipId, {
      membershipId: row.membershipId,
      displayName: row.displayName,
      email: row.email,
      roles: [row.role],
    });
  }

  return [...owners.values()];
}

export async function createPlacementCompany(
  context: RequestContext,
  rawInput: CreatePlacementCompanyInput,
) {
  const input =
    createPlacementCompanyInputSchema.parse(rawInput);
  if (!can(context, "placements.manage", { collegeId: input.collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId: input.collegeId });
  await requirePlacementManageScope(context, input.collegeId);
  const db = getDb();

  return db.transaction(async (tx) => {
    const identityFilter = input.primaryDomain
      ? or(
          ilike(placementCompanies.name, input.name),
          ilike(
            placementCompanies.primaryDomain,
            input.primaryDomain,
          ),
        )
      : ilike(placementCompanies.name, input.name);

    const matches = await tx
      .select()
      .from(placementCompanies)
      .where(identityFilter)
      .limit(2);

    const distinctIds = new Set(
      matches.map((company) => company.id),
    );
    if (distinctIds.size > 1) {
      throw new PlacementsServiceError(
        "PLACEMENT_COMPANY_IDENTITY_CONFLICT",
      );
    }

    let company = matches[0] ?? null;
    if (
      company &&
      input.primaryDomain &&
      company.primaryDomain &&
      company.primaryDomain.toLowerCase() !==
        input.primaryDomain
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_COMPANY_IDENTITY_CONFLICT",
      );
    }

    if (!company) {
      const [created] = await tx
        .insert(placementCompanies)
        .values({
          name: input.name,
          websiteUrl: input.websiteUrl ?? null,
          primaryDomain: input.primaryDomain ?? null,
          createdByUserId: context.user.id,
        })
        .onConflictDoNothing()
        .returning();

      company = created ?? null;

      if (!company) {
        const [concurrent] = await tx
          .select()
          .from(placementCompanies)
          .where(identityFilter)
          .limit(1);
        company = concurrent ?? null;
      }
    } else if (
      (!company.primaryDomain && input.primaryDomain) ||
      (!company.websiteUrl && input.websiteUrl)
    ) {
      const [enriched] = await tx
        .update(placementCompanies)
        .set({
          primaryDomain:
            company.primaryDomain ??
            input.primaryDomain ??
            null,
          websiteUrl:
            company.websiteUrl ??
            input.websiteUrl ??
            null,
          updatedAt: new Date(),
        })
        .where(eq(placementCompanies.id, company.id))
        .returning();
      company = enriched ?? company;
    }

    if (!company) {
      throw new PlacementsServiceError(
        "PLACEMENT_COMPANY_IDENTITY_CONFLICT",
      );
    }

    const now = new Date();
    const [relationship] = await tx
      .insert(placementCompanyRelationships)
      .values({
        collegeId: input.collegeId,
        companyId: company.id,
        isTrusted: input.isTrusted,
        createdByUserId: context.user.id,
      })
      .onConflictDoUpdate({
        target: [
          placementCompanyRelationships.collegeId,
          placementCompanyRelationships.companyId,
        ],
        set: {
          status: "ACTIVE",
          archivedAt: null,
          updatedAt: now,
        },
      })
      .returning();

    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_LINKED,
      collegeId: input.collegeId,
      subjectType: "placement_company_relationship",
      subjectId: relationship.id,
      subjectLabel: company.name,
      summary: "Placement employer linked to college",
      metadata: {
        companyId: company.id,
        relationshipId: relationship.id,
        companyStatus: company.status,
      },
      groupKey: "placement-companies:" + input.collegeId,
    });

    return { company, relationship };
  });
}

export async function updatePlacementCompanyRelationship(
  context: RequestContext,
  relationshipIdInput: string,
  rawInput: UpdatePlacementCompanyRelationshipInput,
) {
  const relationshipId =
    placementCompanyRelationshipIdSchema.parse(
      relationshipIdInput,
    );
  const input =
    updatePlacementCompanyRelationshipInputSchema.parse(
      rawInput,
    );
  const current = await loadRelationship(relationshipId);

  await requirePlacementManageScope(
    context,
    current.relationship.collegeId,
  );

  if (input.ownerMembershipId) {
    await requireValidOwner(
      current.relationship.collegeId,
      input.ownerMembershipId,
    );
  }

  const [updated] = await getDb()
    .update(placementCompanyRelationships)
    .set({
      ...(input.isTrusted === undefined
        ? {}
        : { isTrusted: input.isTrusted }),
      ...(input.ownerMembershipId === undefined
        ? {}
        : { ownerMembershipId: input.ownerMembershipId }),
      updatedAt: new Date(),
    })
    .where(
      eq(
        placementCompanyRelationships.id,
        relationshipId,
      ),
    )
    .returning();

  return { company: current.company, relationship: updated };
}

export async function archivePlacementCompanyRelationship(
  context: RequestContext,
  relationshipIdInput: string,
) {
  const relationshipId =
    placementCompanyRelationshipIdSchema.parse(
      relationshipIdInput,
    );
  const current = await loadRelationship(relationshipId);

  await requirePlacementManageScope(
    context,
    current.relationship.collegeId,
  );

  if (current.relationship.status === "ARCHIVED") {
    return current;
  }

  const [dependentJob] = await getDb()
    .select({ id: placementJobs.id })
    .from(placementJobs)
    .where(
      and(
        eq(
          placementJobs.companyRelationshipId,
          relationshipId,
        ),
        isNull(placementJobs.archivedAt),
      ),
    )
    .limit(1);

  if (dependentJob) {
    throw new PlacementsServiceError(
      "PLACEMENT_COMPANY_RELATIONSHIP_HAS_JOBS",
    );
  }

  const now = new Date();
  const [relationship] = await getDb()
    .update(placementCompanyRelationships)
    .set({
      status: "ARCHIVED",
      archivedAt: now,
      updatedAt: now,
    })
    .where(
      eq(
        placementCompanyRelationships.id,
        relationshipId,
      ),
    )
    .returning();

  return { company: current.company, relationship };
}

/** COL-placements-15: recovery revives only the selected college's archived
 * relationship, never an archived global company or another tenant's link. */
export async function restorePlacementCompanyRelationship(
 context: RequestContext, relationshipIdInput: string,
){
 const relationshipId=placementCompanyRelationshipIdSchema.parse(relationshipIdInput);
 const current=await loadRelationship(relationshipId);
 await requirePlacementManageScope(context,current.relationship.collegeId);
 if(current.company.status!=="ACTIVE")
  throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
 if(current.relationship.status==="ACTIVE")return current;
 return getDb().transaction(async tx=>{
  const [restored]=await tx.update(placementCompanyRelationships).set({
   status:"ACTIVE",archivedAt:null,updatedAt:new Date(),
  }).where(and(eq(placementCompanyRelationships.id,relationshipId),
   eq(placementCompanyRelationships.collegeId,current.relationship.collegeId),
   eq(placementCompanyRelationships.status,"ARCHIVED"))).returning();
  if(!restored)throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_LINKED,
   collegeId:current.relationship.collegeId,
   subjectType:"placement_company_relationship",subjectId:restored.id,
   subjectLabel:current.company.name,summary:"Placement employer restored",
   metadata:{companyId:current.company.id,relationshipId:restored.id,action:"RESTORE"},
  });
  return {company:current.company,relationship:restored};
 });
}
