import { Disclosure } from "@/components/ui/disclosure";
import type { RequestContext } from "@/modules/identity/context";
import {
  listPlacementCompanies,
  listPlacementRelationshipOwners,
} from "@/modules/placements/company-service";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import { listPlacementRecruiterGrants } from "@/modules/placements/recruiter-service";
import { listPlacementSeasons } from "@/modules/placements/season-service";
import { PlacementEmployerRelationships } from "./placement-employer-relationships";
import { PlacementRecruiterAccess } from "./placement-recruiter-access";
import { PlacementOperationsOverview } from "./placement-operations-overview";
import { PlacementSeasonManager } from "./placement-season-manager";

export async function PlacementOperationsWorkspace({
  context,
  collegeId,
  basePath,
  staleDays = 7,
}: {
  context: RequestContext;
  collegeId: string;
  basePath: string;
  staleDays?: number;
}) {
  const [
    operations,
    relationships,
    owners,
    recruiterGrants,
    seasons,
  ] = await Promise.all([
    getPlacementTpoOperations(
      context,
      collegeId,
      undefined,
      staleDays,
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
  ]);

  return (
    <div className="min-w-0 space-y-5">
      <PlacementOperationsOverview
        operations={operations}
        basePath={basePath}
        showDriveSearch={basePath.startsWith("/admin/")}
        staleDays={staleDays}
      />
      <Disclosure title="Placement season" defaultOpen={!seasons.some(season=>season.status==="ACTIVE")} className="border-b border-[var(--lms-canvas-border)]">
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
      </Disclosure>
      <Disclosure title="Companies" className="border-b border-[var(--lms-canvas-border)]">
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
      </Disclosure>
      <Disclosure title="Recruiter access" className="border-b border-[var(--lms-canvas-border)]">
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
      </Disclosure>
    </div>
  );
}
