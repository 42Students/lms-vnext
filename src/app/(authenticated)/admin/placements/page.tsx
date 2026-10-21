import Link from "next/link";
import { listPlatformPlacementPolicy } from "@/modules/placements/platform-placement-policy-service";
import { SuperAdminPlatformPlacementPolicy } from "@/components/placements/super-admin-platform-placement-policy";
import { SuperAdminPlacementOversightNav } from "@/components/admin/super-admin-placement-oversight-nav";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import { SuperAdminDriveDeadline } from "@/components/placements/super-admin-drive-deadline";
import { SuperAdminDriveDuplicate } from "@/components/placements/super-admin-drive-duplicate";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminRetentionInlinePreview } from "@/components/placements/admin-retention-inline-preview";

const secondaryActionClass =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9";

export default async function AdminPlacementsPage({ searchParams }: {
  searchParams: Promise<{ staleDays?: string }>;
}) {
  const raw = await searchParams;
  const staleDays = [3, 7, 14, 30].includes(Number(raw.staleDays)) ? Number(raw.staleDays) : 7;
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId ?? null;
  const policy = await listPlatformPlacementPolicy(context);

  const directoryActions = (
    <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap">
      <Link href="/admin/placements/student-lookup" className={secondaryActionClass}>
        Look up a student&apos;s placement status →
      </Link>
      <Link href="/admin/companies" className={secondaryActionClass}>
        Companies directory →
      </Link>
      <Link href="/admin/placements/retention" className={secondaryActionClass}>
        Data retention report →
      </Link>
    </div>
  );

  // The policy API persists GLOBAL/GLOBAL only, never the acting college.
  // Offer the override editor exclusively in the unscoped platform view.
  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
        <PageHeader
          title="Drives"
          description="Placement administration requires a college safety scope."
          actions={<Link href="/admin/placements/drives" className={secondaryActionClass}>
            Open All drives table →
          </Link>}
        />
        <SuperAdminPlacementOversightNav />
        <EmptyState
          title="Select a college to continue"
          description="To manage drives, choose an Organization + College in the header. Platform-wide policy remains available below without a college selected."
        />
        <Disclosure title="Related directories" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-[var(--lms-space-3)]">
          {directoryActions}
        </Disclosure>
        <Disclosure title="Placements policy" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-[var(--lms-space-3)]">
          <SuperAdminPlatformPlacementPolicy initial={policy} />
        </Disclosure>
      </div>
    );
  }

  const actionRows = (await getPlacementTpoOperations(context, collegeId, undefined, staleDays)).jobs;

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
      <PageHeader
        title="Drives"
        description="Run active hiring drives from one operational view. Attention items surface decisions that need action; closed and draft drives remain available in the full archive."
        actions={<Link
            href="/admin/placements/new"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-on-primary motion-safe:transition-colors motion-reduce:transition-none md:min-h-9 hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] active:border-[var(--lms-button-primary-hover)] active:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
          >
            New drive
          </Link>}
      />
      <SuperAdminPlacementOversightNav />
      <Disclosure title="Related directories" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-[var(--lms-space-3)]">
        {directoryActions}
      </Disclosure>
      <Disclosure title="Drive actions" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-[var(--lms-space-3)]">
        <p className="mb-[var(--lms-space-3)] text-sm text-body">
          Open, duplicate or extend a published drive from this overview. All actions remain scoped to the selected college.
        </p>
        {actionRows.length === 0 ? (
          <EmptyState title="No drives found" description="Create a drive to begin placement operations." />
        ) : (
          <div className="divide-y divide-border">
            {actionRows.slice(0, 20).map(({ job }) => (
              <details key={job.id} className="group min-w-0 py-[var(--lms-space-3)]">
                <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                  <span className="min-w-0 break-words">{job.title} · {job.company.name}</span>
                  <StatusBadge tone={job.status === "PUBLISHED" ? "success" : job.status === "DRAFT" ? "warning" : "neutral"}>{job.status}</StatusBadge>
                </summary>
                <div className="min-w-0 space-y-[var(--lms-space-3)] pt-[var(--lms-space-3)]">
                  <Link href={"/admin/placements/jobs/" + encodeURIComponent(job.id)} className={secondaryActionClass}>
                    Open drive →
                  </Link>
                  <SuperAdminDriveDuplicate jobId={job.id} title={job.title} />
                  {job.status === "PUBLISHED" ? (
                    <SuperAdminDriveDeadline jobId={job.id} deadline={job.applicationDeadline?.toISOString() ?? null} />
                  ) : null}
                </div>
              </details>
            ))}
            {actionRows.length > 20 ? (
              <Link href="/admin/placements/drives" className={secondaryActionClass}>View all {actionRows.length} drives →</Link>
            ) : null}
          </div>
        )}
      </Disclosure>
      <PlacementOperationsWorkspace
        context={context}
        collegeId={collegeId}
        basePath="/admin/placements"
        staleDays={staleDays}
      />
      <AdminRetentionInlinePreview key={collegeId} collegeId={collegeId} />
      <section aria-label="Student placement lookup" className="min-w-0 border-b border-border pb-4">
        <h2 className="mb-2 font-semibold text-foreground">Find a student's placement status</h2>
        <form method="get" action="/admin/placements/student-lookup" role="search" className="flex min-w-0 flex-col items-end gap-2 sm:flex-row">
          <label className="grid min-w-0 w-full gap-1 text-sm text-body">Name, roll number or email
            <Input type="search" name="q" minLength={3} maxLength={150} required
             placeholder="Find one student in this college"/>
          </label>
          <Button type="submit" className="min-h-11 w-full shrink-0 sm:w-auto">Search students</Button>
        </form>
      </section>
      <Disclosure title="Platform-wide placement policy" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-[var(--lms-space-3)]">
        <p className="text-sm text-body">
          Clear the college selection in the header to edit GLOBAL placement policy. This view does not edit college policy.
        </p>
      </Disclosure>
    </div>
  );
}
