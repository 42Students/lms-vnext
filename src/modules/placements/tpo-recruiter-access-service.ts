import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  placementCompanies,
  placementCompanyRelationships,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
} from "@/modules/permissions/policy";

import {
  tpoRecruiterAccessQuerySchema,
  toTpoRecruiterGrantView,
} from "./tpo-recruiter-access-model";
import {
  requirePlacementManageScope,
} from "./scope";

const PAGE_SIZE = 25;

/**
 * College-scoped historical recruiter grants.
 *
 * The college is exclusively the TPO's active
 * membership college, never a URL or filter value.
 *
 * Revoked grants and archived recruiter profiles
 * are retained because this is an access-history
 * view, not a list of currently usable sessions.
 */
export async function listTpoRecruiterAccess(
  context: RequestContext,
  rawQuery: unknown = {},
) {
  if (
    !hasMembershipRole(context, "TPO") ||
    !context.membership
  ) {
    throw new AuthorizationError(
      "placements.manage",
    );
  }

  const collegeId =
    context.membership.collegeId;

  // Central, persisted-college authorization occurs
  // before any recruiter data is queried.
  await requirePlacementManageScope(
    context,
    collegeId,
  );

  const query =
    tpoRecruiterAccessQuerySchema.parse(
      rawQuery,
    );

  const db = getDb();

  const scopedGrants = db
    .select({
      grantId:
        placementRecruiterCollegeGrants.id,
      displayName:
        users.displayName,
      companyName:
        placementCompanies.name,
      status:
        placementRecruiterCollegeGrants.status,
      grantedAt:
        placementRecruiterCollegeGrants.createdAt,
      revokedAt:
        placementRecruiterCollegeGrants.revokedAt,
    })
    .from(
      placementRecruiterCollegeGrants,
    )
    .innerJoin(
      placementRecruiterProfiles,
      eq(
        placementRecruiterProfiles.userId,
        placementRecruiterCollegeGrants.recruiterUserId,
      ),
    )
    .innerJoin(
      placementCompanyRelationships,
      and(
        eq(
          placementCompanyRelationships.id,
          placementRecruiterCollegeGrants.companyRelationshipId,
        ),
        eq(
          placementCompanyRelationships.companyId,
          placementRecruiterProfiles.companyId,
        ),
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
      users,
      eq(
        users.id,
        placementRecruiterProfiles.userId,
      ),
    )
    .where(
      and(
        eq(
          placementCompanyRelationships.collegeId,
          collegeId,
        ),
        query.status === "ALL"
          ? undefined
          : eq(
              placementRecruiterCollegeGrants.status,
              query.status,
            ),
      ),
    )
    .as("tpo_scoped_recruiter_grants");

  const [totals, rows] =
    await Promise.all([
      db
        .select({
          total: count(),
        })
        .from(scopedGrants),

      db
        .select({
          displayName:
            scopedGrants.displayName,
          companyName:
            scopedGrants.companyName,
          status:
            scopedGrants.status,
          grantedAt:
            scopedGrants.grantedAt,
          revokedAt:
            scopedGrants.revokedAt,
        })
        .from(scopedGrants)
        .orderBy(
          asc(
            scopedGrants.companyName,
          ),
          asc(
            scopedGrants.displayName,
          ),
          desc(
            scopedGrants.grantedAt,
          ),
          asc(
            scopedGrants.grantId,
          ),
        )
        .limit(PAGE_SIZE)
        .offset(
          (query.page - 1) *
            PAGE_SIZE,
        ),
    ]);

  const total =
    totals[0]?.total ?? 0;

  return {
    query,
    items: rows.map(
      toTpoRecruiterGrantView,
    ),
    page: query.page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(
      1,
      Math.ceil(
        total / PAGE_SIZE,
      ),
    ),
  };
}
