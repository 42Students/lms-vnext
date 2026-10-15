import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { PlacementEmployerRelationships } from "@/components/placements/placement-employer-relationships";
import {
  listPlacementCompanies,
  listPlacementRelationshipOwners,
} from "@/modules/placements/company-service";

/** College-only employer relationships. Never render the Super Admin directory. */
export default async function CollegeCompaniesPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "COLLEGE_ADMIN")) {
    redirect("/dashboard");
  }
  const collegeId = context.membership.collegeId;
  const [relationships, owners] = await Promise.all([
    listPlacementCompanies(context, collegeId),
    listPlacementRelationshipOwners(context, collegeId),
  ]);

  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="Placements" title="Companies" />
    <PlacementEmployerRelationships
      relationships={relationships.map(item => ({
        relationshipId: item.relationshipId,
        companyId: item.companyId,
        name: item.name,
        websiteUrl: item.websiteUrl,
        primaryDomain: item.primaryDomain,
        isTrusted: item.isTrusted,
        ownerMembershipId: item.ownerMembershipId,
      }))}
      owners={owners}
    />
  </div>;
}
