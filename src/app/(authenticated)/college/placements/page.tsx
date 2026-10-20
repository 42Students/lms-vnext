import Link from "next/link";
import { redirect } from "next/navigation";
import {EmptyState} from "@/components/ui/empty-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import {CollegeDriveAttentionCards} from "@/components/placements/college-drive-attention-cards";
import {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { Disclosure } from "@/components/ui/disclosure";

export default async function CollegePlacementsPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Placement Drives"/>
    <EmptyState title="Admin not assigned to a college" description="Contact your college administrator to request access to placement drives."/>
  </div>;
  if (!hasMembershipRole(context,"COLLEGE_ADMIN")) redirect("/dashboard");
  const attention=await getCollegeDriveAttention(context);
  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader
        title="Placement Drives"
        description="Placement operations inside your active college membership."
        actions={
          <Link
            href="/college/placements/new"
            className="inline-flex min-h-11 w-full items-center justify-center md:min-h-[var(--lms-control-height)] md:w-auto rounded-[var(--lms-control-radius)] border border-primary bg-primary px-3 text-sm font-semibold text-on-primary motion-safe:transition-colors hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] active:border-[var(--lms-button-primary-hover)] active:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
          >
            New drive
          </Link>
        }
      />
      <nav aria-label="Placement workspaces" className="flex min-w-0 flex-col gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)] sm:flex-row sm:flex-wrap">
      <Link href="/college/placements/interviews" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link lms-inline-link sm:w-auto md:min-h-[var(--lms-control-height)] hover:bg-[rgba(38,186,199,0.07)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Interviews</Link>
      <Link href="/college/placements/drives" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link lms-inline-link sm:w-auto md:min-h-[var(--lms-control-height)] hover:bg-[rgba(38,186,199,0.07)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">All drives</Link>
      </nav>
      <Disclosure title={`Drive attention and quick view (${attention.total})`} defaultOpen={attention.total>0} className="min-w-0">
        <CollegeDriveAttentionCards data={attention}/>
      </Disclosure>
      <PlacementOperationsWorkspace
        context={context}
        collegeId={context.membership.collegeId}
        basePath="/college/placements"
      />
    </div>
  );
}
