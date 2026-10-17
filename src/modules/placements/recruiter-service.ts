import {
  and,
  asc,
  desc,
  eq,
  inArray,
} from "drizzle-orm";
import { equalsIgnoreCase } from "@/lib/sql-match";
import { getDb } from "@/db/client";
import {
  colleges,
  placementCompanies,
  placementCompanyRelationships,
  placementJobs,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  users,
} from "@/db/schema";
import {
  hasActiveRecruiter,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import { isExactRecruiterEmployerRow } from "./recruiter-own-company-policy";
import { requirePlacementManageScope } from "./scope";
import {
  createPlacementCompanyInputSchema,
  placementRecruiterGrantIdSchema,
  placementRecruiterGrantInputSchema,
  type PlacementRecruiterGrantInput,
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

export async function listPlacementRecruiterGrants(
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
      grantId: placementRecruiterCollegeGrants.id,
      recruiterUserId:
        placementRecruiterCollegeGrants.recruiterUserId,
      companyRelationshipId:
        placementCompanyRelationships.id,
      companyId: placementCompanies.id,
      companyName: placementCompanies.name,
      displayName: users.displayName,
      email: users.email,
      title: placementRecruiterProfiles.title,
      createdAt: placementRecruiterCollegeGrants.createdAt,
    })
    .from(placementRecruiterCollegeGrants)
    .innerJoin(
      placementRecruiterProfiles,
      eq(
        placementRecruiterProfiles.userId,
        placementRecruiterCollegeGrants.recruiterUserId,
      ),
    )
    .innerJoin(
      users,
      eq(
        users.id,
        placementRecruiterCollegeGrants.recruiterUserId,
      ),
    )
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementRecruiterCollegeGrants.companyRelationshipId,
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
          placementCompanyRelationships.collegeId,
          collegeId,
        ),
        eq(
          placementCompanyRelationships.companyId,
          placementRecruiterProfiles.companyId,
        ),
        eq(
          placementRecruiterCollegeGrants.status,
          "ACTIVE",
        ),
        eq(
          placementRecruiterProfiles.status,
          "ACTIVE",
        ),
        eq(
          placementCompanyRelationships.status,
          "ACTIVE",
        ),
        eq(placementCompanies.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
      ),
    )
    .orderBy(
      asc(placementCompanies.name),
      asc(users.displayName),
    );
}

export async function grantPlacementRecruiter(
  context: RequestContext,
  rawInput: PlacementRecruiterGrantInput,
) {
  const input =
    placementRecruiterGrantInputSchema.parse(rawInput);
  const current = await loadRelationship(
    input.companyRelationshipId,
  );

  await requirePlacementManageScope(
    context,
    current.relationship.collegeId,
  );

  if (
    current.relationship.status !== "ACTIVE" ||
    current.company.status !== "ACTIVE"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_RECRUITER_RELATIONSHIP_INACTIVE",
    );
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const [recruiterUser] = await tx
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
      })
      .from(users)
      .where(
        and(
          equalsIgnoreCase(users.email, input.email),
          eq(users.platformStatus, "ACTIVE"),
        ),
      )
      .limit(1);

    if (!recruiterUser) {
      throw new PlacementsServiceError(
        "PLACEMENT_RECRUITER_USER_NOT_FOUND",
      );
    }

    await tx
      .insert(placementRecruiterProfiles)
      .values({
        userId: recruiterUser.id,
        companyId: current.company.id,
        title: input.title ?? null,
        createdByUserId: context.user.id,
      })
      .onConflictDoNothing();

    const [lockedProfile] = await tx
      .select()
      .from(placementRecruiterProfiles)
      .where(
        eq(
          placementRecruiterProfiles.userId,
          recruiterUser.id,
        ),
      )
      .for("update")
      .limit(1);

    if (
      !lockedProfile ||
      lockedProfile.companyId !== current.company.id
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_RECRUITER_COMPANY_CONFLICT",
      );
    }

    let profile = lockedProfile;
    if (
      profile.status !== "ACTIVE" ||
      input.title !== undefined
    ) {
      const [updated] = await tx
        .update(placementRecruiterProfiles)
        .set({
          status: "ACTIVE",
          archivedAt: null,
          ...(input.title === undefined
            ? {}
            : { title: input.title }),
          updatedAt: new Date(),
        })
        .where(
          eq(
            placementRecruiterProfiles.userId,
            recruiterUser.id,
          ),
        )
        .returning();
      profile = updated ?? profile;
    }

    const [existing] = await tx
      .select()
      .from(placementRecruiterCollegeGrants)
      .where(
        and(
          eq(
            placementRecruiterCollegeGrants.recruiterUserId,
            recruiterUser.id,
          ),
          eq(
            placementRecruiterCollegeGrants.companyRelationshipId,
            current.relationship.id,
          ),
          eq(
            placementRecruiterCollegeGrants.status,
            "ACTIVE",
          ),
        ),
      )
      .limit(1);

    if (existing) {
      return {
        grant: existing,
        recruiter: {
          userId: recruiterUser.id,
          displayName: recruiterUser.displayName,
          email: recruiterUser.email,
          title: profile.title,
        },
        company: current.company,
      };
    }

    const [grant] = await tx
      .insert(placementRecruiterCollegeGrants)
      .values({
        recruiterUserId: recruiterUser.id,
        companyRelationshipId:
          current.relationship.id,
        grantedByUserId: context.user.id,
      })
      .returning();

    return {
      grant,
      recruiter: {
        userId: recruiterUser.id,
        displayName: recruiterUser.displayName,
        email: recruiterUser.email,
        title: profile.title,
      },
      company: current.company,
    };
  });
}

export async function revokePlacementRecruiterGrant(
  context: RequestContext,
  grantIdInput: string,
) {
  const grantId =
    placementRecruiterGrantIdSchema.parse(
      grantIdInput,
    );

  const [current] = await getDb()
    .select({
      grant: placementRecruiterCollegeGrants,
      collegeId: placementCompanyRelationships.collegeId,
    })
    .from(placementRecruiterCollegeGrants)
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementRecruiterCollegeGrants.companyRelationshipId,
      ),
    )
    .where(
      eq(
        placementRecruiterCollegeGrants.id,
        grantId,
      ),
    )
    .limit(1);

  if (!current) {
    throw new PlacementsServiceError(
      "PLACEMENT_RECRUITER_GRANT_NOT_FOUND",
    );
  }

  await requirePlacementManageScope(
    context,
    current.collegeId,
  );

  if (current.grant.status === "REVOKED") {
    return current.grant;
  }

  const now = new Date();
  const [revoked] = await getDb()
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
          placementRecruiterCollegeGrants.status,
          "ACTIVE",
        ),
      ),
    )
    .returning();

  return revoked ?? current.grant;
}

import {recruiterOwnJobPredicate} from "./recruiter-job-ownership";

export async function listOwnRecruiterPlacementJobs(
  context: RequestContext,
  collegeId?: string,
  options: {limit?:number;jobIds?:readonly string[]} = {},
) {
  if (!hasActiveRecruiter(context)) {
    throw new AuthorizationError(
      "placements.recruiter.read",
    );
  }

  const grants = context.recruiter?.grants ?? [];
  if (collegeId && !grants.some(grant => grant.collegeId === collegeId)) {
    throw new AuthorizationError("placements.recruiter.read");
  }
  if (grants.length === 0) {
    return [];
  }
  if (options.jobIds?.length === 0) return [];

  const relationshipIds = grants.map(
    (grant) => grant.companyRelationshipId,
  );

  const selection = getDb()
    .select({
      job: placementJobs,
      relationshipId:
        placementCompanyRelationships.id,
      collegeId: colleges.id,
      collegeName: colleges.name,
      companyId: placementCompanies.id,
      companyName: placementCompanies.name,
    })
    .from(placementJobs)
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementJobs.companyRelationshipId,
      ),
    )
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
        placementJobs.collegeId,
      ),
    )
    .where(
      and(
        inArray(
          placementJobs.companyRelationshipId,
          relationshipIds,
        ),
        ...(collegeId ? [eq(placementJobs.collegeId, collegeId)] : []),
        recruiterOwnJobPredicate(context.user.id),
        ...(options.jobIds ? [inArray(placementJobs.id,[...new Set(options.jobIds)])] : []),
        eq(
          placementCompanyRelationships.collegeId,
          placementJobs.collegeId,
        ),
        inArray(placementJobs.status, [
          "PUBLISHED",
          "CLOSED",
        ]),
        eq(
          placementCompanyRelationships.status,
          "ACTIVE",
        ),
        eq(placementCompanies.status, "ACTIVE"),
        // Do not trust a grant without the recruiter's persisted employer identity.
        eq(placementCompanies.id, context.recruiter!.companyId),
        eq(colleges.status, "ACTIVE"),
      ),
    )
    .orderBy(desc(placementJobs.createdAt))
    .$dynamic();
  const rows = options.limit === undefined ? await selection :
    await selection.limit(Math.max(1,Math.min(500,Math.trunc(options.limit))));

  // A row whose relationship/college pair is not an exact grant (e.g. a grant
  // id paired with another college) is silently excluded, never surfaced.
  const visibleRows = rows.filter((row) =>
    isExactRecruiterEmployerRow(context.recruiter!, row),
  );

  for (const row of visibleRows) {
    requirePermission(
      context,
      "placements.recruiter.read",
      {
        collegeId: row.collegeId,
        placementCompanyRelationshipId:
          row.relationshipId,
      },
    );
  }

  return visibleRows;
}
