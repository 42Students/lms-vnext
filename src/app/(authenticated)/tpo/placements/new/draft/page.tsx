import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { can, requirePermission } from "@/modules/permissions/policy";
import { listPlacementCompanies } from "@/modules/placements/company-service";
import { listPlacementSeasons } from "@/modules/placements/season-service";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { TpoDraftDriveStepOneForm } from "@/components/tpo/tpo-draft-drive-step-one-form";

export default async function TpoQuickDraftStepOnePage() {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    redirect("/dashboard");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  const [seasons, companies] = await Promise.all([
    listPlacementSeasons(context, collegeId),
    listPlacementCompanies(context, collegeId),
  ]);
  const active = seasons.find((season) => season.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <Link href="/tpo/placements/new" className="text-sm font-semibold text-primary-text">
        ← Full drive creation form
      </Link>
      <PageHeader
        eyebrow="TPO · Drive creation"
        title="Draft drive · Step 1"
        description="Save the core employer, season and role details as a draft. No learner can apply until publication."
      />
      {!active ? (
        <section role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          No active placement season exists. Create or activate a season before
          saving a draft drive.
        </section>
      ) : companies.length === 0 ? (
        <section role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          No company relationships are available in this college.
          <Link href="/tpo/companies" className="ml-2 font-semibold text-primary-text">
            Add a company →
          </Link>
        </section>
      ) : (
        <TpoDraftDriveStepOneForm
          season={{ id: active.id, name: active.name, startDate: active.startDate, endDate: active.endDate }}
          companies={companies.map((company) => ({
            relationshipId: company.relationshipId,
            name: company.name,
          }))}
        />
      )}
    </div>
  );
}
