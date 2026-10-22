import Link from "next/link";
import { listPlatformPlacementPolicy } from "@/modules/placements/platform-placement-policy-service";
import {getSuperAdminCompanyHiringReport} from "@/modules/admin-ui/super-admin-hiring-report-service";
import { SuperAdminPlatformPlacementPolicy } from "@/components/placements/super-admin-platform-placement-policy";
import { SuperAdminPlacementOversightNav } from "@/components/admin/super-admin-placement-oversight-nav";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import {Alert} from "@/components/ui/alert";
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
  "inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-[var(--lms-on-primary)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-[var(--lms-on-primary)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9";

export default async function AdminPlacementsPage({ searchParams }: {
  searchParams: Promise<{ staleDays?: string }>;
}) {
  const raw = await searchParams;
  const staleDays = [3, 7, 14, 30].includes(Number(raw.staleDays)) ? Number(raw.staleDays) : 7;
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId ?? null;
  const policy = await listPlatformPlacementPolicy(context);
  // Organization-only Super Admin scope may read an aggregate directory
  // across its verified colleges. Mutations still require selecting one college.
  const organizationJobs = !collegeId&&context.adminScope?.organizationId
    ?await getSuperAdminCompanyHiringReport(context,{})
      .then(data=>({ok:true as const,data}))
      .catch(()=>({ok:false as const}))
    :null;

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
          title="Placement Drives"
          description="Placement administration requires a college safety scope."
          actions={<Link href="/admin/placements/drives" className={secondaryActionClass}>
            Open All drives table →
          </Link>}
        />
        <SuperAdminPlacementOversightNav />
        <SuperAdminPlatformPlacementPolicy initial={policy} />
        {organizationJobs?.ok?<section aria-label="Organization placement jobs" className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Organization drives · read-only</h2>
            <span className="text-sm text-muted-foreground">{organizationJobs.data.matchingJobCount} jobs · {organizationJobs.data.fullTotals.totalApplications} applications</span>
          </div>
          <p className="text-sm text-body">
            Verified organization-wide hiring summary. You can inspect these
            drives across your organization; choose a college to manage or change a drive.
          </p>
          {organizationJobs.data.rows.length?<div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">Organization drives and application counts</caption>
              <thead><tr className="border-b border-[var(--lms-canvas-border)]">
                <th scope="col" className="px-3 py-3 font-semibold">Job title</th>
                <th scope="col" className="px-3 py-3 font-semibold">Company</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Applications</th>
              </tr></thead>
              <tbody>{organizationJobs.data.rows.slice(0,25).map(job=>
                <tr key={job.jobId} className="border-b border-border">
                  <th scope="row" className="px-3 py-3 font-semibold">{job.jobTitle}</th>
                  <td className="px-3 py-3">{job.companyName}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{job.totalApplications}</td>
                </tr>)}</tbody>
            </table>
            {organizationJobs.data.matchingJobCount>25?<p className="mt-2 text-xs text-muted-foreground">
              Showing the first 25 jobs. Choose a college for the full filtered jobs table.
            </p>:null}
          </div>:<EmptyState title="No organization drives" description="No placement drives have been created in your authorized organization colleges."/>}
        </section>:null}
        {organizationJobs&&!organizationJobs.ok?<Alert tone="warning" title="Organization jobs unavailable">
          The organization-wide drive summary could not be loaded. No unverified rows are shown.
          Select a college to continue with its authorized workspace.
        </Alert>:null}
        <Alert tone="warning" title="Select a college to continue">
          Choose a college in the header to manage its drives. Platform-wide policy is shown above.
          <Link href="/admin/colleges" className="ml-2 font-semibold text-link underline">
            Choose a college
          </Link>
        </Alert>
        <Disclosure title="Related directories" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-[var(--lms-space-3)]">
          {directoryActions}
        </Disclosure>
      </div>
    );
  }

  const actionRows = (await getPlacementTpoOperations(context, collegeId, undefined, staleDays)).jobs;

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
      <PageHeader
        title="Placement Drives"
        description="Run active hiring drives from one operational view. Attention items surface decisions that need action; closed and draft drives remain available in the full archive."
        actions={<div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link
            href="/admin/placements/new"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-on-primary motion-safe:transition-colors motion-reduce:transition-none md:min-h-9 hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] active:border-[var(--lms-button-primary-hover)] active:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
          >
            New drive
          </Link>
          <Link href="/admin/placements/drives" className={secondaryActionClass}>All drives</Link>
        </div>}
      />
      <SuperAdminPlacementOversightNav />
      <section aria-label="Placements policy" className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
        <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Placements policy</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Platform-wide — clear the college selection in the header to edit.
        </p>
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {policy.map(setting=><div key={setting.key} className="min-w-0 border-b border-border pb-2">
            <dt className="text-sm font-semibold text-foreground">{setting.label}</dt>
            <dd className="mt-1 text-sm text-body">{setting.value} {setting.unit}
              <span className="ml-2 text-xs text-muted-foreground">
                {setting.isOverridden?"Platform override":"Platform default"}
              </span>
            </dd>
          </div>)}
        </dl>
      </section>

      <PlacementOperationsWorkspace
        context={context}
        collegeId={collegeId}
        basePath="/admin/placements"
        staleDays={staleDays}
      />
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
      <Disclosure title="Related directories" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-[var(--lms-space-3)]">
        {directoryActions}
      </Disclosure>
    </div>
  );
}
