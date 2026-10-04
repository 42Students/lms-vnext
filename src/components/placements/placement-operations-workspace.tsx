import type { RequestContext } from "@/modules/identity/context";
import {
  listPlacementCompanies,
  listPlacementRelationshipOwners,
} from "@/modules/placements/company-service";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import { listPlacementRecruiterGrants } from "@/modules/placements/recruiter-service";
import { listPlacementSeasons } from "@/modules/placements/season-service";
import { listPlacementLearnerRequests } from "@/modules/placements/request-service";
import { PlacementEmployerRelationships } from "./placement-employer-relationships";
import { PlacementRecruiterAccess } from "./placement-recruiter-access";
import { PlacementOperationsOverview } from "./placement-operations-overview";
import { PlacementSeasonManager } from "./placement-season-manager";
import { PlacementRequestQueue } from "./placement-request-queue";

export async function PlacementOperationsWorkspace({
  context,
  collegeId,
  basePath,
}: {
  context: RequestContext;
  collegeId: string;
  basePath: string;
}) {
  const [
    operations,
    relationships,
    owners,
    recruiterGrants,
    seasons,
    learnerRequests,
  ] = await Promise.all([
    getPlacementTpoOperations(
      context,
      collegeId,
    ),
    listPlacementCompanies(
      context,
      collegeId,
    ),
    listPlacementRelationshipOwners(
      context,
      collegeId,
    ),
    listPlacementRecruiterGrants(
      context,
      collegeId,
    ),
    listPlacementSeasons(
      context,
      collegeId,
    ),
    listPlacementLearnerRequests(
      context,
      collegeId,
    ),
  ]);

  return (
    <div className="space-y-6">
      <PlacementOperationsOverview
        operations={operations}
        basePath={basePath}
      />
      <PlacementRequestQueue
        requests={learnerRequests.map(
          (row) => ({
            requestId:
              row.request.id,
            requestType:
              row.request.requestType,
            status:
              row.request.status,
            reason:
              row.request.reason,
            decisionReason:
              row.request.decisionReason,
            requestedPayload:
              row.request.requestedPayload,
            createdAt:
              row.request.createdAt.toISOString(),
            jobTitle:
              row.job.title,
            learnerName:
              row.learner.displayName ??
              row.learner.email ??
              "Learner",
          }),
        )}
      />
      <PlacementSeasonManager
        collegeId={collegeId}
        seasons={seasons.map((season) => ({
          id: season.id,
          name: season.name,
          code: season.code,
          startDate: season.startDate,
          endDate: season.endDate,
          status:
            season.status as
              | "ACTIVE"
              | "CLOSED",
        }))}
      />
      <PlacementEmployerRelationships
        relationships={relationships.map(
          (item) => ({
            relationshipId:
              item.relationshipId,
            companyId: item.companyId,
            name: item.name,
            websiteUrl: item.websiteUrl,
            primaryDomain:
              item.primaryDomain,
            isTrusted: item.isTrusted,
            ownerMembershipId:
              item.ownerMembershipId,
          }),
        )}
        owners={owners}
      />
      <PlacementRecruiterAccess
        relationships={relationships.map(
          (item) => ({
            relationshipId:
              item.relationshipId,
            name: item.name,
          }),
        )}
        grants={recruiterGrants.map(
          (grant) => ({
            grantId: grant.grantId,
            recruiterUserId:
              grant.recruiterUserId,
            companyRelationshipId:
              grant.companyRelationshipId,
            companyId: grant.companyId,
            companyName:
              grant.companyName,
            displayName:
              grant.displayName,
            email: grant.email,
            title: grant.title,
          }),
        )}
      />
    </div>
  );
}
