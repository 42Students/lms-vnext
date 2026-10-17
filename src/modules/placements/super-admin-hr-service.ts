import {superAdminHrLiteralSearchPattern} from "./super-admin-hr-search-model";
import { recordActivityEvent, recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  and,
  asc,
  count,
  eq,
  exists,
  ilike,
  inArray,
  or,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  colleges,
  organizations,
  placementCompanies,
  placementCompanyRelationships,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  requirePermission,
} from "@/modules/permissions/policy";
import {
  assertPersistedPlatformPermission,
} from "@/modules/permissions/persisted-actor";
import {
  provisionPlatformIdentityWithRuntime,
} from "@/modules/people/runtime";
import { PeopleServiceError } from "@/modules/people/errors";
import { PlacementsServiceError } from "./errors";
import {
  assertSuperAdminHrCompanyMatch,
  createSuperAdminHrInputSchema,
  effectiveSuperAdminHrStatus,
  grantSuperAdminHrCollegeInputSchema,
  superAdminHrGrantIdSchema,
  superAdminHrListQuerySchema,
  superAdminHrRelationshipIdSchema,
  superAdminHrUserIdSchema,
  updateSuperAdminHrInputSchema,
} from "./super-admin-hr-validation";

function requireHrAdmin(context: RequestContext) {
  // This centrally defined permission is available only
  // to an active SUPER_ADMIN, including one using a
  // selected administrative college scope.
  requirePermission(
    context,
    "admin-scope.select",
  );
}

function requireHrCollege(
  context: RequestContext,
  organizationId: string,
  collegeId: string,
) {
  requireHrAdmin(context);

  requirePermission(
    context,
    "placements.manage",
    {
      organizationId,
      collegeId,
    },
  );
}

function visibilityClause(context: RequestContext) {
  const scope = context.adminScope;

  if (!scope?.collegeId && !scope?.organizationId) {
    return undefined;
  }

  const db = getDb();

  const scopedGrants = db
    .select({
      id: placementRecruiterCollegeGrants.id,
    })
    .from(placementRecruiterCollegeGrants)
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementRecruiterCollegeGrants.companyRelationshipId,
      ),
    )
    .innerJoin(
      colleges,
      eq(
        colleges.id,
        placementCompanyRelationships.collegeId,
      ),
    )
    .where(
      and(
        eq(
          placementRecruiterCollegeGrants.recruiterUserId,
          placementRecruiterProfiles.userId,
        ),
        eq(
          placementRecruiterCollegeGrants.status,
          "ACTIVE",
        ),
        eq(
          placementCompanyRelationships.status,
          "ACTIVE",
        ),
        eq(
          colleges.status,
          "ACTIVE",
        ),
        eq(
          placementCompanyRelationships.companyId,
          placementRecruiterProfiles.companyId,
        ),
        scope.collegeId
          ? eq(
              colleges.id,
              scope.collegeId,
            )
          : eq(
              colleges.organizationId,
              scope.organizationId!,
            ),
      ),
    );

  return exists(scopedGrants);
}

function outsideHrScopeCondition(context:RequestContext){
 const selected=context.adminScope;
 if(selected?.collegeId)return ne(colleges.id,selected.collegeId);
 if(selected?.organizationId)return ne(colleges.organizationId,selected.organizationId);
 return undefined;
}
/** Account-wide identity changes must never spill outside a selected college/org. */
export async function hrAccountManageability(context:RequestContext,userIds:readonly string[]){
 requireHrAdmin(context);
 const outside=outsideHrScopeCondition(context);
 if(!outside||!userIds.length)return new Map(userIds.map(id=>[id,true]));
 const grants=await getDb().select({recruiterUserId:placementRecruiterCollegeGrants.recruiterUserId})
  .from(placementRecruiterCollegeGrants)
  .innerJoin(placementCompanyRelationships,eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId))
  .innerJoin(colleges,eq(colleges.id,placementCompanyRelationships.collegeId))
  .where(and(inArray(placementRecruiterCollegeGrants.recruiterUserId,[...userIds]),
   eq(placementRecruiterCollegeGrants.status,"ACTIVE"),outside));
 const outsideIds=new Set(grants.map(row=>row.recruiterUserId));
 return new Map(userIds.map(id=>[id,!outsideIds.has(id)]));
}

function grantScopeClause(context: RequestContext) {
  const scope = context.adminScope;

  if (scope?.collegeId) {
    return eq(colleges.id, scope.collegeId);
  }

  if (scope?.organizationId) {
    return eq(
      colleges.organizationId,
      scope.organizationId,
    );
  }

  return undefined;
}

const accountColumns = {
  userId: users.id,
  displayName: users.displayName,
  phoneE164: users.phoneE164,
  email: users.email,
  platformStatus: users.platformStatus,
  companyId: placementCompanies.id,
  companyName: placementCompanies.name,
  title: placementRecruiterProfiles.title,
  recruiterStatus: placementRecruiterProfiles.status,
  createdAt: placementRecruiterProfiles.createdAt,
  updatedAt: placementRecruiterProfiles.updatedAt,
};

type AccountRow = {
  userId: string;
  displayName: string | null;
  phoneE164: string | null;
  email: string | null;
  platformStatus: "ACTIVE" | "DISABLED";
  companyId: string;
  companyName: string;
  title: string | null;
  recruiterStatus: string;
  createdAt: Date;
  updatedAt: Date;
};

function toAccount(row: AccountRow) {
  return {
    ...row,
    status: effectiveSuperAdminHrStatus(
      row.platformStatus,
      row.recruiterStatus,
    ),
  };
}

async function loadAccountGrants(
  context: RequestContext,
  userIds: string[],
) {
  if (userIds.length === 0) {
    return [];
  }

  return getDb()
    .select({
      id: placementRecruiterCollegeGrants.id,
      recruiterUserId:
        placementRecruiterCollegeGrants.recruiterUserId,
      companyRelationshipId:
        placementCompanyRelationships.id,
      companyId:
        placementCompanyRelationships.companyId,
      collegeId: colleges.id,
      collegeName: colleges.name,
      organizationId: colleges.organizationId,
      status: placementRecruiterCollegeGrants.status,
      validUntil: placementRecruiterCollegeGrants.validUntil,
      verificationStatus: placementRecruiterCollegeGrants.verificationStatus,
      createdAt: placementRecruiterCollegeGrants.createdAt,
    })
    .from(placementRecruiterCollegeGrants)
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementRecruiterCollegeGrants.companyRelationshipId,
      ),
    )
    .innerJoin(
      colleges,
      eq(
        colleges.id,
        placementCompanyRelationships.collegeId,
      ),
    )
    .where(
      and(
        inArray(
          placementRecruiterCollegeGrants.recruiterUserId,
          userIds,
        ),
        eq(
          placementRecruiterCollegeGrants.status,
          "ACTIVE",
        ),
        grantScopeClause(context),
      ),
    )
    .orderBy(
      asc(colleges.name),
      asc(placementRecruiterCollegeGrants.id),
    );
}

export async function listSuperAdminHrAccounts(
  context: RequestContext,
  rawQuery: unknown = {},
) {
  requireHrAdmin(context);

  const query =
    superAdminHrListQuerySchema.parse(rawQuery);

  const pattern = query.q ? superAdminHrLiteralSearchPattern(query.q) : null;
  const search = pattern
    ? or(
        ilike(
          users.displayName,
          pattern,
        ),
        ilike(
          users.phoneE164,
          pattern,
        ),
        ilike(
          users.email,
          pattern,
        ),
        ilike(
          placementCompanies.name,
          pattern,
        ),
      )
    : undefined;

  const statusCondition =
    query.status === "DISABLED"
      ? eq(
          users.platformStatus,
          "DISABLED",
        )
      : query.status === "ARCHIVED"
        ? and(
            eq(
              users.platformStatus,
              "ACTIVE",
            ),
            eq(
              placementRecruiterProfiles.status,
              "ARCHIVED",
            ),
          )
        : query.status === "ACTIVE"
          ? and(
              eq(
                users.platformStatus,
                "ACTIVE",
              ),
              eq(
                placementRecruiterProfiles.status,
                "ACTIVE",
              ),
            )
          : undefined;

  const where = and(
    search,
    statusCondition,
    visibilityClause(context),
  );

  const db = getDb();

  const [totalRows, rows] = await Promise.all([
    db
      .select({
        value: count(),
      })
      .from(placementRecruiterProfiles)
      .innerJoin(
        users,
        eq(
          users.id,
          placementRecruiterProfiles.userId,
        ),
      )
      .innerJoin(
        placementCompanies,
        eq(
          placementCompanies.id,
          placementRecruiterProfiles.companyId,
        ),
      )
      .where(where),
    db
      .select(accountColumns)
      .from(placementRecruiterProfiles)
      .innerJoin(
        users,
        eq(
          users.id,
          placementRecruiterProfiles.userId,
        ),
      )
      .innerJoin(
        placementCompanies,
        eq(
          placementCompanies.id,
          placementRecruiterProfiles.companyId,
        ),
      )
      .where(where)
      .orderBy(
        asc(users.displayName),
        asc(users.id),
      )
      .limit(query.pageSize)
      .offset(
        (query.page - 1) * query.pageSize,
      ),
  ]);

  const grants = await loadAccountGrants(
    context,
    rows.map((row) => row.userId),
  );

  const manageable=await hrAccountManageability(context,rows.map(item=>item.userId));
  const total = Number(
    totalRows[0]?.value ?? 0,
  );

  return {
    items: rows.map((row) => ({
      ...toAccount(row),
      accountManageable:manageable.get(row.userId)??false,
      grants: grants.filter(
        (grant) =>
          grant.recruiterUserId === row.userId &&
          grant.companyId === row.companyId,
      ),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(
      1,
      Math.ceil(total / query.pageSize),
    ),
  };
}

export async function getSuperAdminHrAccount(
  context: RequestContext,
  rawUserId: string,
) {
  requireHrAdmin(context);

  const userId =
    superAdminHrUserIdSchema.parse(rawUserId);

  const [row] = await getDb()
    .select(accountColumns)
    .from(placementRecruiterProfiles)
    .innerJoin(
      users,
      eq(
        users.id,
        placementRecruiterProfiles.userId,
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementRecruiterProfiles.companyId,
      ),
    )
    .where(
      and(
        eq(
          placementRecruiterProfiles.userId,
          userId,
        ),
        visibilityClause(context),
      ),
    )
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_RECRUITER_USER_NOT_FOUND",
    );
  }

  const grants = await loadAccountGrants(
    context,
    [userId],
  );

  return {
    ...toAccount(row),
    accountManageable:(await hrAccountManageability(context,[userId])).get(userId)??false,
    grants: grants.filter(
      (grant) =>
        grant.companyId === row.companyId,
    ),
  };
}

export async function listSuperAdminHrRelationshipOptions(
  context: RequestContext,
  rawCollegeId?: string,
) {
  requireHrAdmin(context);

  const collegeId = rawCollegeId
    ? superAdminHrRelationshipIdSchema.parse(
        rawCollegeId,
      )
    : undefined;

  return getDb()
    .select({
      companyRelationshipId:
        placementCompanyRelationships.id,
      companyId: placementCompanies.id,
      companyName: placementCompanies.name,
      collegeId: colleges.id,
      collegeName: colleges.name,
      organizationId: colleges.organizationId,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .innerJoin(
      colleges,
      eq(
        colleges.id,
        placementCompanyRelationships.collegeId,
      ),
    )
    .innerJoin(
      organizations,
      eq(
        organizations.id,
        colleges.organizationId,
      ),
    )
    .where(
      and(
        eq(
          placementCompanyRelationships.status,
          "ACTIVE",
        ),
        eq(
          placementCompanies.status,
          "ACTIVE",
        ),
        eq(
          colleges.status,
          "ACTIVE",
        ),
        eq(
          organizations.status,
          "ACTIVE",
        ),
        collegeId
          ? eq(colleges.id, collegeId)
          : undefined,
        grantScopeClause(context),
      ),
    )
    .orderBy(
      asc(colleges.name),
      asc(placementCompanies.name),
    )
    .limit(200);
}

async function loadActiveRelationship(
  relationshipId: string,
) {
  const [row] = await getDb()
    .select({
      relationshipId:
        placementCompanyRelationships.id,
      companyId:
        placementCompanyRelationships.companyId,
      companyStatus: placementCompanies.status,
      relationshipStatus:
        placementCompanyRelationships.status,
      collegeId: colleges.id,
      collegeStatus: colleges.status,
      organizationId: colleges.organizationId,
      organizationStatus: organizations.status,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .innerJoin(
      colleges,
      eq(
        colleges.id,
        placementCompanyRelationships.collegeId,
      ),
    )
    .innerJoin(
      organizations,
      eq(
        organizations.id,
        colleges.organizationId,
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

  if (
    row.relationshipStatus !== "ACTIVE" ||
    row.companyStatus !== "ACTIVE" ||
    row.collegeStatus !== "ACTIVE" ||
    row.organizationStatus !== "ACTIVE"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_RECRUITER_RELATIONSHIP_INACTIVE",
    );
  }

  return row;
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code ===
        "23505",
  );
}

export async function createSuperAdminHrAccount(
  context: RequestContext,
  rawInput: unknown,
) {
  requireHrAdmin(context);

  const input =
    createSuperAdminHrInputSchema.parse(rawInput);

  const relationship =
    await loadActiveRelationship(
      input.companyRelationshipId,
    );

  requireHrCollege(
    context,
    relationship.organizationId,
    relationship.collegeId,
  );
  const selectedIds=[...new Set([
    input.companyRelationshipId,...(input.companyRelationshipIds??[]),
  ])];
  if(selectedIds.length>20)throw new PlacementsServiceError("PLACEMENT_RECRUITER_OUTSIDE_ADMIN_SCOPE");
  const additionalRelationships=await Promise.all(selectedIds.slice(1).map(loadActiveRelationship));
  for(const candidate of additionalRelationships){
    if(candidate.companyId!==relationship.companyId)
      throw new PlacementsServiceError("PLACEMENT_RECRUITER_COMPANY_CONFLICT");
    requireHrCollege(context,candidate.organizationId,candidate.collegeId);
  }
  const selectedRelationships=[relationship,...additionalRelationships];

  // Resolve and persist the canonical platform user
  // through the established first-party people path.
  // A recruiter does not require an academic membership.
  const identity =
    await provisionPlatformIdentityWithRuntime({
      displayName: input.displayName,
      phoneE164: input.phoneE164,
      email: input.email,
    });

  if (identity.platformStatus !== "ACTIVE") {
    throw new PlacementsServiceError(
      "PLACEMENT_RECRUITER_COMPANY_CONFLICT",
    );
  }

  const db = getDb();
  let reusedExisting = false;
  const grantTime = new Date();
  // Explicit expiry for newly created and reused recruiter grants.
  const grantExpiry = new Date(Date.UTC(grantTime.getUTCFullYear(),
    grantTime.getUTCMonth() + 3, grantTime.getUTCDate(), grantTime.getUTCHours()));

  try {
    await db.transaction(async (tx) => {
      await assertPersistedPlatformPermission(
        tx,
        context,
        "admin-scope.select",
      );

      // Lock and recheck every selected relationship before creating any grant.
      for(const candidate of selectedRelationships){
      const [lockedRelationship] = await tx
        .select({
          id: placementCompanyRelationships.id,
          companyId:
            placementCompanyRelationships.companyId,
          collegeId:
            placementCompanyRelationships.collegeId,
          status:
            placementCompanyRelationships.status,
        })
        .from(placementCompanyRelationships)
        .where(
          eq(
            placementCompanyRelationships.id,
            candidate.relationshipId,
          ),
        )
        .for("share")
        .limit(1);

      if (
        !lockedRelationship ||
        lockedRelationship.status !== "ACTIVE" ||
        lockedRelationship.companyId !==
          candidate.companyId ||
        lockedRelationship.collegeId !==
          candidate.collegeId
      ) {
        throw new PlacementsServiceError(
          "PLACEMENT_RECRUITER_RELATIONSHIP_INACTIVE",
        );
      }

      requireHrCollege(
        context,
        candidate.organizationId,
        candidate.collegeId,
      );

      }
      const [currentUser] = await tx
        .select({
          id: users.id,
          status: users.platformStatus,
        })
        .from(users)
        .where(
          eq(
            users.id,
            identity.userId,
          ),
        )
        .for("update")
        .limit(1);

      if (
        !currentUser ||
        currentUser.status !== "ACTIVE"
      ) {
        throw new PlacementsServiceError(
          "PLACEMENT_RECRUITER_USER_NOT_FOUND",
        );
      }

      const [profile] = await tx
        .insert(placementRecruiterProfiles)
        .values({
          userId: identity.userId,
          companyId: relationship.companyId,
          title: input.title ?? null,
          createdByUserId: context.user.id,
        })
        .onConflictDoNothing()
        .returning({
          userId: placementRecruiterProfiles.userId,
        });

      if (!profile) {
        const [existing] = await tx.select({
          companyId: placementRecruiterProfiles.companyId,
          status: placementRecruiterProfiles.status,
        }).from(placementRecruiterProfiles)
          .where(eq(placementRecruiterProfiles.userId, identity.userId))
          .for("update").limit(1);
        if (!existing || existing.companyId !== relationship.companyId ||
          existing.status !== "ACTIVE") {
          throw new PlacementsServiceError("PLACEMENT_RECRUITER_COMPANY_CONFLICT");
        }
        reusedExisting = true;
      }

      for(const candidate of selectedRelationships){
      const [newGrant] = await tx.insert(placementRecruiterCollegeGrants)
        .values({
          recruiterUserId: identity.userId,
          companyRelationshipId: candidate.relationshipId,
          grantedByUserId: context.user.id,
          validUntil: grantExpiry,
        }).onConflictDoNothing().returning({id: placementRecruiterCollegeGrants.id});
      if (!newGrant) {
        const [existingGrant] = await tx.select({
          id: placementRecruiterCollegeGrants.id,
          validUntil: placementRecruiterCollegeGrants.validUntil,
        }).from(placementRecruiterCollegeGrants)
          .where(and(eq(placementRecruiterCollegeGrants.recruiterUserId, identity.userId),
            eq(placementRecruiterCollegeGrants.companyRelationshipId, candidate.relationshipId),
            eq(placementRecruiterCollegeGrants.status, "ACTIVE")))
          .for("update").limit(1);
        if (!existingGrant) {
          throw new PlacementsServiceError("PLACEMENT_RECRUITER_COMPANY_CONFLICT");
        }
        if (!existingGrant.validUntil || existingGrant.validUntil <= grantTime) {
          await tx.update(placementRecruiterCollegeGrants)
            .set({validUntil: grantExpiry, updatedAt: grantTime})
            .where(eq(placementRecruiterCollegeGrants.id, existingGrant.id));
        }
      }
      if (profile || newGrant) {
        await recordActivityEventInTransaction(tx, context, {
          eventType: profile ? ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_CREATED
            : ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_COLLEGE_GRANTED,
          collegeId: candidate.collegeId,
          organizationId: candidate.organizationId,
          subjectType: "recruiter", subjectId: identity.userId,
          summary: profile ? "Recruiter account created" : "Existing recruiter granted college access",
          metadata: {companyRelationshipId: candidate.relationshipId,
            validUntil: grantExpiry.toISOString()},
        });
      }

      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new PeopleServiceError(
        "IDENTITY_COLLISION",
      );
    }
    throw error;
  }

  const account = await getSuperAdminHrAccount(context, identity.userId);
  return {...account, reusedExisting};
}

export async function updateSuperAdminHrAccount(
  context: RequestContext,
  rawUserId: string,
  rawInput: unknown,
) {
  requireHrAdmin(context);

  const userId =
    superAdminHrUserIdSchema.parse(rawUserId);
  const input =
    updateSuperAdminHrInputSchema.parse(
      rawInput,
    );

  const db = getDb();

  try {
    await db.transaction(async (tx) => {
      await assertPersistedPlatformPermission(
        tx,
        context,
        "admin-scope.select",
      );

      const [current] = await tx
        .select({
          userId: placementRecruiterProfiles.userId,
          status: placementRecruiterProfiles.status,
          archivedAt:
            placementRecruiterProfiles.archivedAt,
        })
        .from(placementRecruiterProfiles)
        .where(
          and(
            eq(
              placementRecruiterProfiles.userId,
              userId,
            ),
            visibilityClause(context),
          ),
        )
        .for("update")
        .limit(1);

      if (!current) {
        throw new PlacementsServiceError(
          "PLACEMENT_RECRUITER_USER_NOT_FOUND",
        );
      }

      const outside=outsideHrScopeCondition(context);
      if(outside){
       const outOfScope=await tx.select({id:placementRecruiterCollegeGrants.id})
        .from(placementRecruiterCollegeGrants)
        .innerJoin(placementCompanyRelationships,
          eq(placementCompanyRelationships.id,placementRecruiterCollegeGrants.companyRelationshipId))
        .innerJoin(colleges,eq(colleges.id,placementCompanyRelationships.collegeId))
        .where(and(eq(placementRecruiterCollegeGrants.recruiterUserId,userId),
          eq(placementRecruiterCollegeGrants.status,"ACTIVE"),outside))
        .for("share",{of:placementRecruiterCollegeGrants}).limit(1);
       if(outOfScope.length)throw new PlacementsServiceError("PLACEMENT_RECRUITER_OUTSIDE_ADMIN_SCOPE");
      }

      const now = new Date();

      if (
        input.displayName !== undefined ||
        input.phoneE164 !== undefined ||
        input.email !== undefined
      ) {
        await tx
          .update(users)
          .set({
            ...(input.displayName === undefined
              ? {}
              : {
                  displayName:
                    input.displayName,
                }),
            ...(input.phoneE164 === undefined
              ? {}
              : {
                  phoneE164:
                    input.phoneE164,
                }),
            ...(input.email === undefined
              ? {}
              : {
                  email:
                    input.email,
                }),
            updatedAt: now,
          })
          .where(
            eq(users.id, userId),
          );
      }

      if (
        input.title !== undefined ||
        input.status !== undefined
      ) {
        await tx
          .update(placementRecruiterProfiles)
          .set({
            ...(input.title === undefined
              ? {}
              : {
                  title: input.title,
                }),
            ...(input.status === undefined
              ? {}
              : {
                  status: input.status,
                  archivedAt:
                    input.status === "ARCHIVED"
                      ? current.archivedAt ?? now
                      : null,
                }),
            updatedAt: now,
          })
          .where(
            eq(
              placementRecruiterProfiles.userId,
              userId,
            ),
          );
      }

      // Suspend the account, not the college relationships.
      // Sign-in is disabled by the archived recruiter profile; retained grants
      // become available immediately after an explicit reactivation.
      const eventType = input.status === "ARCHIVED"
        ? ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_SUSPENDED
        : input.status === "ACTIVE" && current.status === "ARCHIVED"
          ? ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_REACTIVATED
          : ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_UPDATED;
      await recordActivityEventInTransaction(tx, context, {
        eventType,
        collegeId: context.adminScope?.collegeId ?? null,
        organizationId: context.adminScope?.organizationId ?? null,
        subjectType: "recruiter", subjectId: userId,
        summary: input.status === "ARCHIVED" ? "Recruiter suspended"
          : input.status === "ACTIVE" && current.status === "ARCHIVED"
            ? "Recruiter reactivated" : "Recruiter account updated",
        metadata: {changedFields: Object.keys(input), previousStatus: current.status,
          nextStatus: input.status ?? current.status},
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new PeopleServiceError(
        "IDENTITY_COLLISION",
      );
    }
    throw error;
  }

  // A suspension signs out existing sessions without deleting the college grants.
  // The revocation helper also writes the session-audit event.
  if(input.status==="ARCHIVED") {
    await terminateSuperAdminHrSessions(context,userId);
  }

  return getSuperAdminHrAccount(
    context,
    userId,
  );
}

export async function grantSuperAdminHrCollegeAccess(
  context: RequestContext,
  rawUserId: string,
  rawInput: unknown,
) {
  requireHrAdmin(context);

  const userId =
    superAdminHrUserIdSchema.parse(rawUserId);
  const input =
    grantSuperAdminHrCollegeInputSchema.parse(
      rawInput,
    );

  // Unspecified expiry uses a clearly disclosed, fail-closed three-month grant.
  const now=new Date();
  const expiration=input.validUntil?new Date(input.validUntil):
    new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+3,now.getUTCDate(),now.getUTCHours()));
  if(!Number.isFinite(expiration.getTime())||expiration<=now||
      expiration.getTime()>now.getTime()+5*366*24*60*60*1000)
    throw new Error("GRANT_EXPIRY_INVALID");
  const relationship =
    await loadActiveRelationship(
      input.companyRelationshipId,
    );

  requireHrCollege(
    context,
    relationship.organizationId,
    relationship.collegeId,
  );

  return getDb().transaction(async (tx) => {
    await assertPersistedPlatformPermission(
      tx,
      context,
      "admin-scope.select",
    );

    const [profile] = await tx
      .select({
        companyId:
          placementRecruiterProfiles.companyId,
        status:
          placementRecruiterProfiles.status,
        platformStatus:
          users.platformStatus,
      })
      .from(placementRecruiterProfiles)
      .innerJoin(
        users,
        eq(
          users.id,
          placementRecruiterProfiles.userId,
        ),
      )
      .where(
        eq(
          placementRecruiterProfiles.userId,
          userId,
        ),
      )
      .for("update")
      .limit(1);

    if (!profile) {
      throw new PlacementsServiceError(
        "PLACEMENT_RECRUITER_USER_NOT_FOUND",
      );
    }

    if (
      profile.status !== "ACTIVE" ||
      profile.platformStatus !== "ACTIVE"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_RECRUITER_RELATIONSHIP_INACTIVE",
      );
    }

    if (
      !assertSuperAdminHrCompanyMatch(
        profile.companyId,
        relationship.companyId,
      )
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_RECRUITER_COMPANY_CONFLICT",
      );
    }

    const [activeRelationship] = await tx
      .select({
        id:
          placementCompanyRelationships.id,
        status:
          placementCompanyRelationships.status,
        companyId:
          placementCompanyRelationships.companyId,
      })
      .from(placementCompanyRelationships)
      .where(
        eq(
          placementCompanyRelationships.id,
          relationship.relationshipId,
        ),
      )
      .for("share")
      .limit(1);

    if (
      !activeRelationship ||
      activeRelationship.status !== "ACTIVE" ||
      activeRelationship.companyId !==
        profile.companyId
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_RECRUITER_RELATIONSHIP_INACTIVE",
      );
    }

    const [created] = await tx
      .insert(placementRecruiterCollegeGrants)
      .values({
        recruiterUserId: userId,
        companyRelationshipId:
          relationship.relationshipId,
        grantedByUserId: context.user.id,
        validUntil: expiration,
      })
      .onConflictDoNothing()
      .returning();

    if (created) {
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_COLLEGE_GRANTED,
        collegeId: relationship.collegeId, organizationId: relationship.organizationId,
        subjectType: "recruiter", subjectId: userId,
        summary: "Recruiter college access granted",
        metadata: {companyRelationshipId: relationship.relationshipId,
          grantId: created.id, validUntil: expiration.toISOString()},
      });
      return created;
    }

    const [existing] = await tx
      .select()
      .from(placementRecruiterCollegeGrants)
      .where(
        and(
          eq(
            placementRecruiterCollegeGrants.recruiterUserId,
            userId,
          ),
          eq(
            placementRecruiterCollegeGrants.companyRelationshipId,
            relationship.relationshipId,
          ),
          eq(
            placementRecruiterCollegeGrants.status,
            "ACTIVE",
          ),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new PlacementsServiceError(
        "PLACEMENT_RECRUITER_COMPANY_CONFLICT",
      );
    }

    // Grant exists already; never return an expired/non-authorizing row as
    // if fresh access had been created. Refresh its explicit expiry.
    const [renewed]=await tx.update(placementRecruiterCollegeGrants)
      .set({validUntil:expiration,updatedAt:new Date()})
      .where(eq(placementRecruiterCollegeGrants.id,existing.id)).returning();
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_COLLEGE_GRANTED,
      collegeId: relationship.collegeId, organizationId: relationship.organizationId,
      subjectType: "recruiter", subjectId: userId,
      summary: "Recruiter college access renewed",
      metadata: {companyRelationshipId: relationship.relationshipId,
        grantId: existing.id, validUntil: expiration.toISOString()},
    });
    return renewed??existing;
  });
}

export async function revokeSuperAdminHrCollegeAccess(
  context: RequestContext,
  rawUserId: string,
  rawGrantId: string,
) {
  requireHrAdmin(context);

  const userId =
    superAdminHrUserIdSchema.parse(rawUserId);
  const grantId =
    superAdminHrGrantIdSchema.parse(rawGrantId);

  return getDb().transaction(async (tx) => {
    await assertPersistedPlatformPermission(
      tx,
      context,
      "admin-scope.select",
    );

    const [current] = await tx
      .select({
        grant: placementRecruiterCollegeGrants,
        collegeId:
          placementCompanyRelationships.collegeId,
        organizationId: colleges.organizationId,
      })
      .from(placementRecruiterCollegeGrants)
      .innerJoin(
        placementCompanyRelationships,
        eq(
          placementCompanyRelationships.id,
          placementRecruiterCollegeGrants.companyRelationshipId,
        ),
      )
      .innerJoin(
        colleges,
        eq(
          colleges.id,
          placementCompanyRelationships.collegeId,
        ),
      )
      .where(
        and(
          eq(
            placementRecruiterCollegeGrants.id,
            grantId,
          ),
          eq(
            placementRecruiterCollegeGrants.recruiterUserId,
            userId,
          ),
        ),
      )
      .for("update")
      .limit(1);

    if (!current) {
      throw new PlacementsServiceError(
        "PLACEMENT_RECRUITER_GRANT_NOT_FOUND",
      );
    }

    requireHrCollege(
      context,
      current.organizationId,
      current.collegeId,
    );

    if (current.grant.status === "REVOKED") {
      return current.grant;
    }

    const now = new Date();

    const [revoked] = await tx
      .update(placementRecruiterCollegeGrants)
      .set({
        status: "REVOKED",
        revokedByUserId: context.user.id,
        revokedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(
            placementRecruiterCollegeGrants.id,
            grantId,
          ),
          eq(
            placementRecruiterCollegeGrants.recruiterUserId,
            userId,
          ),
          eq(
            placementRecruiterCollegeGrants.status,
            "ACTIVE",
          ),
        ),
      )
      .returning();

    if (revoked) {
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_COLLEGE_REVOKED,
        collegeId: current.collegeId, organizationId: current.organizationId,
        subjectType: "recruiter", subjectId: userId,
        summary: "Recruiter college access revoked",
        metadata: {grantId, companyRelationshipId: current.grant.companyRelationshipId},
      });
    }
    return revoked ?? current.grant;
  });
}

export async function terminateSuperAdminHrSessions(
  context: RequestContext,
  rawUserId: string,
) {
  requireHrAdmin(context);

  const userId =
    superAdminHrUserIdSchema.parse(rawUserId);

  // The target must be an actual recruiter account
  // visible in the active administrative scope.
  await getSuperAdminHrAccount(
    context,
    userId,
  );

  const access=await hrAccountManageability(context,[userId]);
  if(access.get(userId)===false)throw new PlacementsServiceError("PLACEMENT_RECRUITER_OUTSIDE_ADMIN_SCOPE");

  const {
    revokeAllSessionsForUser,
  } = await import(
    "@/modules/auth/session-service"
  );

  await revokeAllSessionsForUser(
    userId,
    context.user.id,
    "SUPER_ADMIN_HR_TERMINATE_ALL",
  );

  await recordActivityEvent(context, {
    eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_SESSIONS_REVOKED,
    collegeId: context.adminScope?.collegeId ?? null,
    organizationId: context.adminScope?.organizationId ?? null,
    subjectType: "recruiter", subjectId: userId,
    summary: "Recruiter signed out everywhere",
    metadata: {reason: "SUPER_ADMIN_HR_TERMINATE_ALL"},
  });

  return {
    userId,
    terminated: true,
  };
}

/** Current-scope status totals, independently counted across the full directory. */
export async function getSuperAdminHrStatusSummary(context:RequestContext){
  requireHrAdmin(context);
  const rows=await getDb().select({
    platformStatus:users.platformStatus,
    recruiterStatus:placementRecruiterProfiles.status,
    total:count(),
  }).from(placementRecruiterProfiles)
   .innerJoin(users,eq(users.id,placementRecruiterProfiles.userId))
   .where(visibilityClause(context))
   .groupBy(users.platformStatus,placementRecruiterProfiles.status);
  const totals={accounts:0,active:0,archived:0,disabled:0};
  for(const row of rows){
    totals.accounts+=row.total;
    if(row.platformStatus==="DISABLED")totals.disabled+=row.total;
    else if(row.recruiterStatus==="ARCHIVED")totals.archived+=row.total;
    else totals.active+=row.total;
  }
  return totals;
}
