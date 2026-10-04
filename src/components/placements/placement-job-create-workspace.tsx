import { PlacementJobCreateForm } from "./placement-job-create-form";
import { PageHeader } from "@/components/ui/page-header";
import type { RequestContext } from "@/modules/identity/context";
import { listPlacementCompanies } from "@/modules/placements/company-service";

export async function PlacementJobCreateWorkspace({
  context,
  collegeId,
  eyebrow,
  basePath,
}: {
  context: RequestContext;
  collegeId: string;
  eyebrow: string;
  basePath: string;
}) {
  const companies =
    await listPlacementCompanies(
      context,
      collegeId,
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title="New placement opportunity"
        description="Create or reuse an employer, define the job and lock explainable eligibility before the drive begins."
      />
      <PlacementJobCreateForm
        collegeId={collegeId}
        basePath={basePath}
        companies={companies.map(
          (company) => ({
            relationshipId:
              company.relationshipId,
            name: company.name,
            primaryDomain:
              company.primaryDomain,
            isTrusted: company.isTrusted,
          }),
        )}
      />
    </div>
  );
}
