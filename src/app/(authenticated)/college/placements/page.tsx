import Link from "next/link";
import { redirect } from "next/navigation";
import {EmptyState} from "@/components/ui/empty-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import {CollegeDriveAttentionCards} from "@/components/placements/college-drive-attention-cards";
import {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function CollegePlacementsPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="space-y-5">
    <PageHeader eyebrow="College Admin" title="Placement Drives"/>
    <EmptyState title="Admin not assigned to a college" description="Contact your college administrator to request access to placement drives."/>
  </div>;
  if (!hasMembershipRole(context,"COLLEGE_ADMIN")) redirect("/dashboard");
  const attention=await getCollegeDriveAttention(context);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Placement Drives"
        description="Placement operations inside your active college membership."
        actions={
          <Link
            href="/college/placements/new"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-3 text-sm font-semibold text-on-primary motion-safe:transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            New drive
          </Link>
        }
      />
      <nav aria-label="Placement workspaces" className="flex min-w-0 flex-wrap gap-3">
      <Link href="/college/placements/interviews" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lms-inline-link">Interviews</Link>
      <Link href="/college/placements/drives" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lms-inline-link">All drives</Link>
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
