import {
  desc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications,
  placementApplicationScreenings,
  placementCompanyRelationships,
  placementCompanies,
  placementJobs,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listOwnAppliedPlacementResults } from "./result-service";

function requireLearner(context: RequestContext) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    throw new AuthorizationError("placements.read");
  }
  return context.membership;
}

export async function getLearnerPlacementJourney(
  context: RequestContext,
) {
  const membership = requireLearner(context);

  const [applications, results] =
    await Promise.all([
      getDb()
        .select({
          application: placementApplications,
          screening:
            placementApplicationScreenings,
          job: {
            id: placementJobs.id,
            title: placementJobs.title,
          },
          company: {
            id: placementCompanies.id,
            name: placementCompanies.name,
          },
        })
        .from(placementApplications)
        .innerJoin(
          placementApplicationScreenings,
          eq(
            placementApplicationScreenings.applicationId,
            placementApplications.id,
          ),
        )
        .innerJoin(
          placementJobs,
          eq(
            placementJobs.id,
            placementApplications.jobId,
          ),
        )
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
        .where(
          eq(
            placementApplications.membershipId,
            membership.id,
          ),
        )
        .orderBy(
          desc(
            placementApplications.submittedAt,
          ),
        ),
      listOwnAppliedPlacementResults(context),
    ]);

  const resultsByJob = new Map<
    string,
    typeof results
  >();
  for (const result of results) {
    const current =
      resultsByJob.get(result.jobId) ?? [];
    current.push(result);
    resultsByJob.set(
      result.jobId,
      current,
    );
  }

  return applications.map((row) => {
    const terminal =
      row.screening.status ===
        "SHORTLISTED" ||
      row.screening.status === "REJECTED";

    return {
      applicationId: row.application.id,
      applicationStatus:
        row.application.status,
      channel: row.application.channel,
      submittedAt:
        row.application.submittedAt,
      withdrawnAt:
        row.application.withdrawnAt,
      job: row.job,
      company: row.company,
      screening: {
        status: terminal
          ? row.screening.status
          : "UNDER_REVIEW",
        candidateMessage: terminal
          ? row.screening.candidateMessage
          : null,
        decidedAt: terminal
          ? row.screening.decidedAt
          : null,
      },
      results:
        resultsByJob.get(row.job.id) ?? [],
    };
  });
}
