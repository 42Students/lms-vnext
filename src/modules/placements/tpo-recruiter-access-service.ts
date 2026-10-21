import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  gt,
  lte,
  isNull,
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
import {escapeLiteralApplicantSearch} from "./company-share/public-filter-model";
import {requirePersistedTpoMembership} from "./tpo-persisted-actor-service";

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
  options: {exportAll?:boolean} = {},
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
  await requirePersistedTpoMembership(context,collegeId);

  const query =
    tpoRecruiterAccessQuerySchema.parse(
      rawQuery,
    );

  const db = getDb();
  const now=new Date(),ending=new Date(now.getTime()+30*86400000);

  const scopedGrants = db
    .select({
      grantId:
        placementRecruiterCollegeGrants.id,
      updatedAt: placementRecruiterCollegeGrants.updatedAt,
      displayName:
        users.displayName,
      designation:placementRecruiterProfiles.title,
      companyName:
        placementCompanies.name,
      status:
        placementRecruiterCollegeGrants.status,
      grantedAt:
        placementRecruiterCollegeGrants.createdAt,
      revokedAt:
        placementRecruiterCollegeGrants.revokedAt,
      validUntil:placementRecruiterCollegeGrants.validUntil,
      capabilities:placementRecruiterCollegeGrants.capabilities,
      verificationStatus:placementRecruiterCollegeGrants.verificationStatus,
      grantedByType:placementRecruiterCollegeGrants.grantedByType,
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
        query.q ? or(
          ilike(users.displayName,"%"+escapeLiteralApplicantSearch(query.q)+"%"),
          ilike(placementCompanies.name,"%"+escapeLiteralApplicantSearch(query.q)+"%"),
          ilike(placementRecruiterProfiles.title,"%"+escapeLiteralApplicantSearch(query.q)+"%"),
        ) : undefined,
        query.status==="ENDING_SOON"?and(
          eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
          gt(placementRecruiterCollegeGrants.validUntil,now),
          lte(placementRecruiterCollegeGrants.validUntil,ending),
        ):query.status==="ENDED_OR_REMOVED"?or(
          eq(placementRecruiterCollegeGrants.status,"REVOKED"),
          and(eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
           or(isNull(placementRecruiterCollegeGrants.validUntil),lte(placementRecruiterCollegeGrants.validUntil,now))),
        ):query.status==="ALL"?undefined:eq(placementRecruiterCollegeGrants.status,query.status),
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
          grantId: scopedGrants.grantId,
          updatedAt: scopedGrants.updatedAt,
          displayName:
            scopedGrants.displayName,
          designation:scopedGrants.designation,
          companyName:
            scopedGrants.companyName,
          status:
            scopedGrants.status,
          grantedAt:
            scopedGrants.grantedAt,
          revokedAt:
            scopedGrants.revokedAt,
          validUntil:scopedGrants.validUntil,
          capabilities:scopedGrants.capabilities,
          verificationStatus:scopedGrants.verificationStatus,
          grantedByType:scopedGrants.grantedByType,
        })
        .from(scopedGrants)
        .orderBy(asc(scopedGrants.grantedAt),asc(scopedGrants.grantId))
        .limit(options.exportAll?500:PAGE_SIZE)
        .offset(options.exportAll?0:(query.page - 1) * PAGE_SIZE),
    ]);

  const total =
    totals[0]?.total ?? 0;

  return {
    query,
    items: rows.map(
      toTpoRecruiterGrantView,
    ),
    page: options.exportAll?1:query.page,
    pageSize: options.exportAll?500:PAGE_SIZE,
    truncated:options.exportAll===true&&total>500,
    total,
    totalPages: Math.max(
      1,
      Math.ceil(
        total / PAGE_SIZE,
      ),
    ),
  };
}
