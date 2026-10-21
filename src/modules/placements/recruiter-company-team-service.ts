import { and, asc, eq, gt, sql } from "drizzle-orm";
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
import {
  hasActiveRecruiter,
  type RecruiterGrant,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";

export type RecruiterCompanyScope =
  | { status: "NO_ACCESS"; choices: readonly RecruiterGrant[] }
  | { status: "CHOOSE_COLLEGE"; choices: readonly RecruiterGrant[] }
  | { status: "READY"; grant: RecruiterGrant; choices: readonly RecruiterGrant[] };

/**
 * Recruiter sessions must never guess a college when more than one grant is active.
 * One grant may be selected implicitly because there is no ambiguity.
 */
export function resolveRecruiterCompanyScope(
  context: RequestContext,
  requestedCollegeId?: string | null,
): RecruiterCompanyScope {
  if (!hasActiveRecruiter(context) || !context.recruiter ||
      context.recruiter.userId !== context.user.id) {
    throw new AuthorizationError("placements.recruiter.read");
  }
  const choices = context.recruiter.grants;
  if (choices.length === 0) return { status: "NO_ACCESS", choices };
  if (requestedCollegeId) {
    const grant = choices.find((item) => item.collegeId === requestedCollegeId);
    if (!grant) throw new AuthorizationError("placements.recruiter.read");
    return { status: "READY", grant, choices };
  }
  if (choices.length === 1) return { status: "READY", grant: choices[0]!, choices };
  return { status: "CHOOSE_COLLEGE", choices };
}

export async function getRecruiterCompanyTeam(
  context: RequestContext,
  requestedCollegeId?: string | null,
  includeTeam = true,
) {
  const scope = resolveRecruiterCompanyScope(context, requestedCollegeId);
  if (scope.status !== "READY") return scope;
  const recruiter = context.recruiter!;
  const db = getDb();
  const [company] = await db
    .select({
      id: placementCompanies.id,
      name: placementCompanies.name,
      websiteUrl: placementCompanies.websiteUrl,
      primaryDomain: placementCompanies.primaryDomain,
      logoObjectPath: placementCompanies.logoObjectPath,
      relationshipId: placementCompanyRelationships.id,
      trusted: placementCompanyRelationships.isTrusted,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      colleges,
      and(eq(colleges.id,placementCompanyRelationships.collegeId),
        eq(colleges.status,"ACTIVE")),
    )
    .innerJoin(organizations,and(
      eq(organizations.id,colleges.organizationId),
      eq(organizations.status,"ACTIVE"),
    ))
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    // A session grant may remain cached after revocation. The acting
    // recruiter's persisted profile and relationship must still be ACTIVE.
    .innerJoin(placementRecruiterProfiles,and(
      eq(placementRecruiterProfiles.userId,context.user.id),
      eq(placementRecruiterProfiles.companyId,placementCompanies.id),
      eq(placementRecruiterProfiles.status,"ACTIVE"),
    ))
    .innerJoin(placementRecruiterCollegeGrants,and(
      // A still-active sibling grant must never resurrect the exact selected
      // session grant after it is revoked.
      eq(placementRecruiterCollegeGrants.id,scope.grant.id),
      eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
      eq(placementRecruiterCollegeGrants.companyRelationshipId,placementCompanyRelationships.id),
      eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
      eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
      gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
    ))
    .innerJoin(users,and(
      eq(users.id,context.user.id),
      eq(users.platformStatus,"ACTIVE"),
    ))
    .where(and(
      eq(placementCompanyRelationships.id, scope.grant.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, scope.grant.collegeId),
      eq(placementCompanyRelationships.companyId, recruiter.companyId),
      eq(placementCompanyRelationships.status, "ACTIVE"),
      eq(placementCompanies.status, "ACTIVE"),
    ))
    .limit(1);

  if (!company) throw new AuthorizationError("placements.recruiter.read");

  // Company overview remains available even if the Team roster is slow or
  // unavailable; query colleagues only on the explicitly selected Team tab.
  const team = includeTeam ? await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      email: users.email,
      title: placementRecruiterProfiles.title,
    })
    .from(placementRecruiterCollegeGrants)
    .innerJoin(
      placementRecruiterProfiles,
      eq(placementRecruiterProfiles.userId, placementRecruiterCollegeGrants.recruiterUserId),
    )
    .innerJoin(users, eq(users.id, placementRecruiterCollegeGrants.recruiterUserId))
    .where(and(
      eq(placementRecruiterCollegeGrants.companyRelationshipId, company.relationshipId),
      eq(placementRecruiterCollegeGrants.status, "ACTIVE"),
      // HR-TEAM-RECIPIENT-45: expired/unverified colleagues are not active
      // placement-cell contacts even if their profile is still ACTIVE.
      eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
      gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
      eq(placementRecruiterProfiles.companyId, company.id),
      eq(placementRecruiterProfiles.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
    ))
    .orderBy(asc(users.displayName), asc(users.email)) : [];

  return {
    status: "READY" as const,
    grant: scope.grant,
    choices: scope.choices,
    company,
    team: team.map((member) => ({
      ...member,
      isYou: member.userId === context.user.id,
    })),
  };
}
