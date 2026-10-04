import type { RequestContext } from "@/modules/identity/context";
import {
  listPlacementCompanies,
  listPlacementRelationshipOwners,
} from "@/modules/placements/company-service";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import { PlacementEmployerRelationships } from "./placement-employer-relationships";
import { PlacementOperationsOverview } from "./placement-operations-overview";

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
  ]);

  return (
    <div className="space-y-6">
      <PlacementOperationsOverview
        operations={operations}
        basePath={basePath}
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
    </div>
  );
}
