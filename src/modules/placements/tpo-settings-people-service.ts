import {
  and,
  asc,
  eq,
  inArray,
  or,
} from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import {
  collegeMemberships,
  membershipRoles,
  placementDriveDayCoordinatorAssignments,
  placementJobs,
  users,
} from "@/db/schema";
import {
  placementTpoTeamMembers,
  placementTpoTrustedDomains,
} from "@/db/schema/tpo-collaboration";

import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {hasPlacementTeamMembership} from "./placement-team-access-model";

import { listPlacementCompanies } from "./company-service";
import { requirePlacementManageScope } from "./scope";
import { placementTableExists } from "./staged-tables";
import {
  buildTpoTeamRoster,
  buildTpoTrustedCompanies,
  buildTpoTrustedDomains,
  summarizeTpoTeam,
  type TpoTeamEvidenceRow,
  type TpoTeamEvidenceRole,
} from "./tpo-settings-read-model";

export const tpoSettingsCollegeIdSchema = z.string().uuid();

/**
 * Both checks are deliberate:
 * - The caller must be an active TPO membership in this college.
 * - The existing centralized placement permission must authorize
 *   the college scope before any business-data reads.
 */
async function requireTpoSettingsScope(
  context: RequestContext,
  rawCollegeId: unknown,
) {
  const collegeId = tpoSettingsCollegeIdSchema.parse(
    rawCollegeId,
  );

  if (
    !hasPlacementTeamMembership(context) ||
    context.membership?.collegeId !== collegeId
  ) {
    throw new AuthorizationError("placements.manage");
  }

  await requirePlacementManageScope(context, collegeId);

  return collegeId;
}

/**
 * Read only. A base TPO membership does not become TPO_ADMIN
 * unless the dedicated team-assignment row exists.
 *
 * The dedicated team table is currently source-authored but may
 * be absent from the registered PostgreSQL migration chain.
 * The Drive Day coordinator table is a distinct source of
 * date-scoped learner coordinator assignments.
 */
export async function getTpoPlacementTeam(
  context: RequestContext,
  rawCollegeId: unknown,
) {
  const collegeId = await requireTpoSettingsScope(
    context,
    rawCollegeId,
  );

  const db = getDb();

  const [
    teamAssignmentsAvailable,
    studentAssignmentsAvailable,
  ] = await Promise.all([
    placementTableExists("placement_tpo_team_members"),
    placementTableExists(
      "placement_drive_day_coordinator_assignments",
    ),
  ]);

  const [
    tpoRows,
    staffAssignmentRows,
    studentAssignmentRows,
  ] = await Promise.all([
    db
      .select({
        membershipId: collegeMemberships.id,
        membershipRole:membershipRoles.role,
        displayName: users.displayName,
        membershipStatus: collegeMemberships.status,
        platformStatus: users.platformStatus,
      })
      .from(collegeMemberships)
      .innerJoin(
        users,
        eq(users.id, collegeMemberships.userId),
      )
      .innerJoin(
        membershipRoles,
        and(
          eq(
            membershipRoles.membershipId,
            collegeMemberships.id,
          ),
          inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"]),
        ),
      )
      .where(
        and(
          eq(collegeMemberships.collegeId, collegeId),
          eq(collegeMemberships.status, "ACTIVE"),
          eq(users.platformStatus, "ACTIVE"),
        ),
      )
      .orderBy(
        asc(users.displayName),
        asc(collegeMemberships.id),
      ),

    teamAssignmentsAvailable
      ? db
          .select({
            membershipId: collegeMemberships.id,
            displayName: users.displayName,
            membershipStatus: collegeMemberships.status,
            platformStatus: users.platformStatus,
            teamRole: placementTpoTeamMembers.role,
          })
          .from(placementTpoTeamMembers)
          .innerJoin(
            collegeMemberships,
            and(
              eq(
                collegeMemberships.id,
                placementTpoTeamMembers.membershipId,
              ),
              eq(collegeMemberships.collegeId, collegeId),
            ),
          )
          .innerJoin(
            users,
            eq(users.id, collegeMemberships.userId),
          )
          .innerJoin(
            membershipRoles,
            and(
              eq(
                membershipRoles.membershipId,
                collegeMemberships.id,
              ),
              or(
                and(
                  eq(
                    placementTpoTeamMembers.role,
                    "TPO_ADMIN",
                  ),
                  eq(membershipRoles.role, "TPO"),
                ),
                and(
                  eq(
                    placementTpoTeamMembers.role,
                    "FACULTY_COORDINATOR",
                  ),
                  eq(membershipRoles.role, "FACULTY"),
                ),
              ),
            ),
          )
          .where(
            and(
              eq(placementTpoTeamMembers.collegeId, collegeId),
              eq(collegeMemberships.status, "ACTIVE"),
              eq(users.platformStatus, "ACTIVE"),
            ),
          )
      : Promise.resolve([]),

    studentAssignmentsAvailable
      ? db
          .select({
            membershipId: collegeMemberships.id,
            displayName: users.displayName,
            membershipStatus: collegeMemberships.status,
            platformStatus: users.platformStatus,
            jobId: placementJobs.id,
            jobTitle: placementJobs.title,
            onDate: placementDriveDayCoordinatorAssignments.onDate,
          })
          .from(placementDriveDayCoordinatorAssignments)
          .innerJoin(
            placementJobs,
            and(
              eq(
                placementJobs.id,
                placementDriveDayCoordinatorAssignments.jobId,
              ),
              eq(placementJobs.collegeId, collegeId),
            ),
          )
          .innerJoin(
            collegeMemberships,
            and(
              eq(
                collegeMemberships.id,
                placementDriveDayCoordinatorAssignments.learnerMembershipId,
              ),
              eq(collegeMemberships.collegeId, collegeId),
            ),
          )
          .innerJoin(
            users,
            eq(users.id, collegeMemberships.userId),
          )
          .innerJoin(
            membershipRoles,
            and(
              eq(
                membershipRoles.membershipId,
                collegeMemberships.id,
              ),
              eq(membershipRoles.role, "LEARNER"),
            ),
          )
          .where(
            and(
              eq(
                placementDriveDayCoordinatorAssignments.collegeId,
                collegeId,
              ),
              eq(collegeMemberships.status, "ACTIVE"),
              eq(users.platformStatus, "ACTIVE"),
            ),
          )
      : Promise.resolve([]),
  ]);

  const evidence: TpoTeamEvidenceRow[] = [];

  for (const row of tpoRows) {
    evidence.push({
      ...row,
      role: row.membershipRole as "TPO"|"COLLEGE_ADMIN",
    });
  }

  for (const row of staffAssignmentRows) {
    evidence.push({
      membershipId: row.membershipId,
      displayName: row.displayName,
      membershipStatus: row.membershipStatus,
      platformStatus: row.platformStatus,
      role: row.teamRole as Extract<
        TpoTeamEvidenceRole,
        "TPO_ADMIN" | "FACULTY_COORDINATOR"
      >,
    });
  }

  for (const row of studentAssignmentRows) {
    evidence.push({
      membershipId: row.membershipId,
      displayName: row.displayName,
      membershipStatus: row.membershipStatus,
      platformStatus: row.platformStatus,
      role: "STUDENT_COORDINATOR",
      jobId: row.jobId,
      jobTitle: row.jobTitle,
      onDate: row.onDate,
    });
  }

  const members = buildTpoTeamRoster(evidence);

  return {
    collegeId,
    members,
    summary: summarizeTpoTeam(members),
    sources: {
      tpoMembershipsAvailable: true,
      teamAssignmentsAvailable,
      studentAssignmentsAvailable,
    },
  };
}

/**
 * Read-only trusted-companies and explicit trusted-domains view.
 *
 * Relationship.isTrusted belongs to this college; the company
 * primaryDomain is global company metadata and is NOT itself an
 * approved domain. Only placement_tpo_trusted_domains records
 * constitute the persisted explicit allowlist.
 */
export async function getTpoTrustedCompanies(
  context: RequestContext,
  rawCollegeId: unknown,
) {
  const collegeId = await requireTpoSettingsScope(
    context,
    rawCollegeId,
  );

  const explicitDomainsAvailable = await placementTableExists(
    "placement_tpo_trusted_domains",
  );

  const [companyRows, explicitDomainRows] = await Promise.all([
    listPlacementCompanies(context, collegeId),

    explicitDomainsAvailable
      ? getDb()
          .select({
            domain: placementTpoTrustedDomains.domain,
            createdAt: placementTpoTrustedDomains.createdAt,
          })
          .from(placementTpoTrustedDomains)
          .where(
            eq(placementTpoTrustedDomains.collegeId, collegeId),
          )
          .orderBy(
            asc(placementTpoTrustedDomains.domain),
          )
      : Promise.resolve([]),
  ]);

  const companies = buildTpoTrustedCompanies(
    companyRows.map((row) => ({
      companyId: row.companyId,
      relationshipId: row.relationshipId,
      name: row.name,
      primaryDomain: row.primaryDomain,
      isTrusted: row.isTrusted,
    })),
  );

  return {
    collegeId,
    companies: companies.companies,
    summary: {
      totalCompanies: companies.total,
      trustedCompanies: companies.trusted,
      notTrustedCompanies: companies.notTrusted,
      trustedDomainCount: explicitDomainsAvailable
        ? explicitDomainRows.length
        : null,
    },
    trustedDomains: buildTpoTrustedDomains(
      explicitDomainRows,
    ),
    explicitDomainsAvailable,
  };
}
