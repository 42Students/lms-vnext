import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import {CollegeDriveAttentionCards} from "@/components/placements/college-drive-attention-cards";
import {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { COLLEGE_LEGACY_PAGE_TITLES } from "@/modules/people/college-page-title-model";

export default async function CollegePlacementsPage() {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(
      context,
      "COLLEGE_ADMIN",
    )
  ) {
    redirect("/dashboard");
  }
  const attention=await getCollegeDriveAttention(context);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title={COLLEGE_LEGACY_PAGE_TITLES.drives}
        description="Placement operations inside your active college membership."
        actions={
          <Link
            href="/college/placements/new"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover"
          >
            New opportunity
          </Link>
        }
      />
      <nav aria-label="Placement workspaces" className="flex flex-wrap gap-3">
      <Link href="/college/placements/interviews" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Interviews</Link>
      <Link href="/college/placements/drives" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Browse drives</Link>
      </nav>
      <CollegeDriveAttentionCards data={attention}/>
      <PlacementOperationsWorkspace
        context={context}
        collegeId={context.membership.collegeId}
        basePath="/college/placements"
      />
    </div>
  );
}
