import {
  and,
  asc,
  eq,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications,
  placementCompanyRelationships,
  placementCompanies,
  placementJobs,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  evaluatePlacementEligibility,
  type PlacementEligibilityResult,
} from "./eligibility-service";

function requireLearner(context: RequestContext) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    throw new AuthorizationError("placements.read");
  }
  return context.membership;
}

export async function listLearnerPlacementJobs(
  context: RequestContext,
  now: Date = new Date(),
) {
  const membership = requireLearner(context);

  const rows = await getDb()
    .select({
      job: placementJobs,
      company: {
        id: placementCompanies.id,
        name: placementCompanies.name,
        websiteUrl: placementCompanies.websiteUrl,
        logoObjectPath:
          placementCompanies.logoObjectPath,
      },
      application: {
        id: placementApplications.id,
        channel: placementApplications.channel,
        status: placementApplications.status,
        eligibilityStatus:
          placementApplications.eligibilityStatus,
        submittedAt:
          placementApplications.submittedAt,
        withdrawnAt:
          placementApplications.withdrawnAt,
      },
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
    .leftJoin(
      placementApplications,
      and(
        eq(
          placementApplications.jobId,
          placementJobs.id,
        ),
        eq(
          placementApplications.membershipId,
          membership.id,
        ),
      ),
    )
    .where(
      and(
        eq(
          placementJobs.collegeId,
          membership.collegeId,
        ),
        eq(placementJobs.status, "PUBLISHED"),
        isNull(placementJobs.archivedAt),
        eq(
          placementCompanyRelationships.status,
          "ACTIVE",
        ),
        isNull(
          placementCompanyRelationships.archivedAt,
        ),
        eq(placementCompanies.status, "ACTIVE"),
      ),
    )
    .orderBy(
      asc(placementJobs.applicationDeadline),
      asc(placementJobs.title),
    );

  return Promise.all(
    rows.map(async (row) => {
      const application =
        row.application?.id
          ? row.application
          : null;
      const eligibility: PlacementEligibilityResult =
        application
          ? {
              status:
                application.eligibilityStatus as PlacementEligibilityResult["status"],
              checks: [],
              override: null,
            }
          : await evaluatePlacementEligibility(
            context,
            row.job.id,
          );
      const deadlinePassed = Boolean(
        row.job.applicationDeadline &&
          row.job.applicationDeadline.getTime() <
            now.getTime(),
      );

      return {
        job: row.job,
        company: row.company,
        application,
        eligibility,
        deadlinePassed,
        canApply:
          !application &&
          !deadlinePassed &&
          (eligibility.status === "ELIGIBLE" ||
            eligibility.status ===
              "ELIGIBLE_WITH_MISSING_EVIDENCE"),
      };
    }),
  );
}
