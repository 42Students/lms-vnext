import "server-only";

import {
  and,
  eq,
  gt,
  inArray,
  sql,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  colleges,
  organizations,
  placementCompanyRelationships,
  placementRecruiterCollegeGrants,
} from "@/db/schema";
import {
  hasActiveRecruiter,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";

import {
  buildRecruiterSelfGrantRows,
} from "./recruiter-self-grants-model";
import {
  getRecruiterSelfProfile,
} from "./recruiter-profile-service";

/**
 * Pending invitations are a separate lifecycle and must not be inferred from
 * an ACTIVE grant. Do not expose other leads by weakening the authenticated
 * recruiter grant predicate; pending invitation reads require a distinct
 * token/contact ownership proof and safe route outside active-grant shell.
 * Additional read-only detail for the already implemented
 * /hr/profile page.
 *
 * The signed-in user is the only recruiter key. No URL,
 * client-supplied user ID, grant ID or college ID is used.
 *
 * The existing self-profile reader independently checks
 * the active user, recruiter profile and company.
 *
 * Every grant must:
 * - be present in the trusted recruiter context;
 * - belong to the signed-in recruiter in persistence;
 * - reference that recruiter's own company;
 * - have an active grant, relationship, college and
 *   organization;
 * - satisfy central placements.recruiter.read.
 *
 * No other people's names, emails, phones or identities
 * are selected, nor are grant creator identities read.
 */
export async function getRecruiterSelfGrantOverview(
  context: RequestContext,
) {
  if (
    !hasActiveRecruiter(context) ||
    !context.recruiter ||
    context.recruiter.userId !== context.user.id
  ) {
    throw new AuthorizationError(
      "placements.recruiter.read",
    );
  }

  const profile =
    await getRecruiterSelfProfile(context);

  const authorizedGrants =
    context.recruiter.grants;

  // A recruiter can have an active employer profile
  // without a currently active college grant.
  if (authorizedGrants.length === 0) {
    return {
      profileStatus: "ACTIVE" as const,
      grants: [],
    };
  }

  const byId = new Map(
    authorizedGrants.map((grant) => [
      grant.id,
      grant,
    ]),
  );

  for (const grant of authorizedGrants) {
    requirePermission(
      context,
      "placements.recruiter.read",
      {
        collegeId: grant.collegeId,
        placementCompanyRelationshipId:
          grant.companyRelationshipId,
      },
    );
  }

  const rows = await getDb()
    .select({
      id: placementRecruiterCollegeGrants.id,
      collegeId: colleges.id,
      collegeName: colleges.name,
      collegeCode: colleges.code,
      relationshipId:
        placementCompanyRelationships.id,
      grantStatus:
        placementRecruiterCollegeGrants.status,
      relationshipStatus:
        placementCompanyRelationships.status,
      grantedAt:
        placementRecruiterCollegeGrants.createdAt,
      validUntil: placementRecruiterCollegeGrants.validUntil,
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
          placementRecruiterCollegeGrants.recruiterUserId,
          context.user.id,
        ),
        inArray(
          placementRecruiterCollegeGrants.id,
          authorizedGrants.map((grant) => grant.id),
        ),
        eq(
          placementRecruiterCollegeGrants.status,
          "ACTIVE",
        ),
        // HR-SELF-GRANTS-53: do not show a stale, expired or unverified
        // persisted grant as current employer access.
        eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
        gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
        eq(
          placementCompanyRelationships.status,
          "ACTIVE",
        ),
        eq(
          placementCompanyRelationships.companyId,
          profile.companyId,
        ),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    );

  // Validate each persisted row against the exact
  // trusted grant identity and its scope, not merely
  // against a matching company or college name.
  for (const row of rows) {
    const grant = byId.get(row.id);

    if (
      !grant ||
      grant.collegeId !== row.collegeId ||
      grant.companyRelationshipId !==
        row.relationshipId
    ) {
      throw new AuthorizationError(
        "placements.recruiter.read",
      );
    }

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

  return {
    profileStatus: "ACTIVE" as const,
    grants: buildRecruiterSelfGrantRows(rows),
  };
}
