import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
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
  if (!hasActiveRecruiter(context) || !context.recruiter) {
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
      placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    .where(and(
      eq(placementCompanyRelationships.id, scope.grant.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, scope.grant.collegeId),
      eq(placementCompanyRelationships.companyId, recruiter.companyId),
      eq(placementCompanyRelationships.status, "ACTIVE"),
      eq(placementCompanies.status, "ACTIVE"),
    ))
    .limit(1);

  if (!company) throw new AuthorizationError("placements.recruiter.read");

  const team = await db
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
      eq(placementRecruiterProfiles.companyId, company.id),
      eq(placementRecruiterProfiles.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
    ))
    .orderBy(asc(users.displayName), asc(users.email));

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
