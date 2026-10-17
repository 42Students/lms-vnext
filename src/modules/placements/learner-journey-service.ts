import {
  and,
  desc,
  eq,
  inArray,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications,
  placementApplicationScreenings,
  placementCompanyRelationships,
  placementCompanies,
  placementJobRoleOptions,
  placementJobs,
  placementOffers,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listOwnAppliedPlacementResults } from "./result-service";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import {learnerStaffApplicationOptOut} from "./learner-staff-application-optout-model";

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
  await requireLearnerPlacementAccess(context);

  const [applications, results, offers] =
    await Promise.all([
      getDb()
        .select({
          application: placementApplications,
          screening:
            placementApplicationScreenings,
          job: {
            id: placementJobs.id,
            title:
              placementJobRoleOptions.title,
            driveTitle: placementJobs.title,
            driveStatus: placementJobs.status,
            closedAt: placementJobs.closedAt,
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
          placementJobRoleOptions,
          eq(
            placementJobRoleOptions.id,
            placementApplications.roleOptionId,
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
      getDb().select({
        applicationId: placementApplications.id,
        status: placementOffers.status,
      }).from(placementOffers)
        .innerJoin(placementApplications,
          eq(placementApplications.id, placementOffers.applicationId))
        .innerJoin(placementJobs,
          eq(placementJobs.id, placementApplications.jobId))
        .where(and(
          eq(placementApplications.membershipId, membership.id),
          eq(placementJobs.collegeId, membership.collegeId),
          eq(placementOffers.kind, "OFFER"),
          inArray(placementOffers.status, ["ISSUED", "ACCEPTED"]),
        )),
    ]);

  const resultsByApplication = new Map<
    string,
    typeof results
  >();
  for (const result of results) {
    const current =
      resultsByApplication.get(
        result.applicationId,
      ) ?? [];
    current.push(result);
    resultsByApplication.set(
      result.applicationId,
      current,
    );
  }

  const offerStatusByApplication = new Map<string,string>();
  for (const offer of offers) {
    if (offer.status === "ACCEPTED" ||
        !offerStatusByApplication.has(offer.applicationId)) {
      offerStatusByApplication.set(offer.applicationId, offer.status);
    }
  }

  const snapshotNow=new Date();
  return applications.map((row) => {
    const optOut=learnerStaffApplicationOptOut({
      submittedAt:row.application.submittedAt,
      submittedByUserId:row.application.submittedByUserId,
      learnerUserId:context.user.id,now:snapshotNow,
    });
    const terminal =
      row.screening.status ===
        "SHORTLISTED" ||
      row.screening.status === "REJECTED";

    return {
      applicationId: row.application.id,
      applicationStatus:
        row.application.status,
      offerStatus: offerStatusByApplication.get(row.application.id) ?? null,
      channel: optOut.staffApplied?"PLACEMENT_CELL":row.application.channel,
      staffOptOutUntil:optOut.expiresAt,
      mayStaffOptOut:optOut.canOptOut,
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
        resultsByApplication.get(
          row.application.id,
        ) ?? [],
    };
  });
}
