import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { Alert } from "@/components/ui/alert";
import { Tabs } from "@/components/ui/tabs";
import { getCollegeApplicationPipeline } from "@/modules/placements/college-application-stage-service";
import { CollegeApplicationPipelineControls } from "@/components/placements/college-application-pipeline-controls";
import {
  DRIVE_APPLICATION_EXPORT_CAP,
  driveApplicationsHref,
  driveApplicationsParams,
  type DriveApplicationsQuery,
} from "@/modules/placements/college-drive-applications-model";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { listCollegeDriveApplicationFilters } from "@/modules/placements/college-drive-applications-options-service";

/**
 * Legacy Shortlisted workbench. Pipeline stage (ASSESSMENT by default) is the
 * authoritative filter; screening SHORTLISTED is only a historical decision,
 * not the current interview/offer/hire status.
 */
export default async function CollegeDriveShortlistedPage({
  params, searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "COLLEGE_ADMIN")) {
    // Do not expose drive details outside the selected College Admin workspace.
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Shortlisted" />
      <ErrorState title="College assignment required"
        description="Your account is not assigned to this College Admin workspace. Ask your college administrator to assign the appropriate college role, then sign in again."
        action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to dashboard</Link>} />
    </div>;
  }
  const { jobId } = await params;
  const requested = await searchParams;
  const query = driveApplicationsParams({
    ...requested,
    stage: requested.stage ?? "ASSESSMENT",
    status: "SUBMITTED",
    screening: "ALL",
  });
  const href = (selection: DriveApplicationsQuery) =>
    driveApplicationsHref(jobId, selection).replace("/applications", "/shortlisted");

  if (!query) return <div className="min-w-0 space-y-4">
    <PageHeader title="Shortlisted" />
    <ErrorState title="Invalid applicant filters"
      description="The requested search, pipeline stage or page is invalid."
      action={<Link href={href({
        q: "", status: "SUBMITTED", stage: "ASSESSMENT", screening: "ALL",
        source: "ALL", page: 1,
      })} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Clear filters</Link>} />
  </div>;

  const result = await Promise.all([
    getCollegeApplicationPipeline(context, jobId, query),
    listCollegeDriveApplicationFilters(context),
  ]).catch(() => null);
  if (!result) return <div className="min-w-0 space-y-4">
    <PageHeader title="Shortlisted" />
    <ErrorState title="Could not load applications"
      description="The requested applications are temporarily unavailable. No changes were made."
      action={<Link href={href({ ...query, page: 1 })}
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>} />
  </div>;
  const [data, filters] = result;
  if (query.page > data.totalPages) redirect(href({ ...query, page: data.totalPages }));
  const stages = ["ASSESSMENT", "INTERVIEW", "OFFERED", "HIRED", "SHORTLISTED", "WAITLISTED", "REJECTED", "APPLIED"] as const;
  const stageName = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
  const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
  const external = data.items.filter(row => row.source === "EXTERNAL");
  const internal = data.items.filter(row => row.source !== "EXTERNAL");
  // Current shared pipeline controls do not safely exclude external candidates
  // from bulk matching across pages. Limit mutation selection to the current
  // internal page. External entries remain visible but strictly read-only.
  const externalColumns: DataTableColumn<(typeof data.items)[number]>[] = [
    { key: "name", header: "Learner Name", mobilePriority: "primary", cell: row => row.name ?? "Unnamed learner" },
    { key: "email", header: "Email", cell: row => row.email ?? "Not provided" },
    { key: "college", header: "College", cell: row => row.collegeName },
    { key: "source", header: "Source", cell: row => row.source },
    { key: "status", header: "Current Status", cell: row => <StatusBadge tone="neutral">{row.stage}</StatusBadge> },
    { key: "date", header: "Applied Date", cell: row => date.format(new Date(row.submittedAt)) },
    { key: "actions", header: "Actions", cell: () => "View only" },
  ];

  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Shortlisted" description={data.drive.title}
      actions={<div className="flex flex-wrap gap-3">
        <Link href={"/college/placements/jobs/" + encodeURIComponent(jobId) + "/overview"}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Drive overview</Link>
        <Link href={driveApplicationsHref(jobId, {
        ...query, stage: "ALL", screening: "ALL", status: "ALL", page: 1,
      })} className="inline-flex min-h-11 items-center font-semibold text-link underline hover:text-[var(--lms-primary-text)] md:min-h-9">All applications</Link></div>} />
    <Tabs ariaLabel="Shortlisted pipeline stages" renderPanel={false} value={query.stage}
      items={stages.map(stage => ({
        value: stage,
        label: stageName(stage),
        count: data.stageCounts[stage] ?? 0,
        href: href({ ...query, stage, page: 1 }),
      }))} />
    <form method="get" role="search" aria-label="Shortlisted application filters"
      className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto] lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto_auto]">
      <input type="hidden" name="stage" value={query.stage} />
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        Name, email, roll or role
        <Input name="q" type="search" maxLength={100} defaultValue={query.q} className="min-h-11 min-w-0 md:min-h-9" />
      </label>
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        Source
        <Select name="source" defaultValue={query.source} className="min-h-11 min-w-0 md:min-h-9">
          <option value="ALL">All sources</option>
          <option value="INTERNAL">Internal</option>
          <option value="EXTERNAL">External</option>
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        Department
        <Select name="departmentId" defaultValue={query.departmentId ?? ""}>
          <option value="">All departments</option>
          {filters.departments.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        Program
        <Select name="programId" defaultValue={query.programId ?? ""}>
          <option value="">All programs</option>
          {filters.programs.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        Batch
        <Select name="cohortId" defaultValue={query.cohortId ?? ""}>
          <option value="">All batches</option>
          {filters.cohorts.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
        </Select>
      </label>
      <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Filter</Button>
      {query.q || query.source !== "ALL" || query.departmentId || query.programId || query.cohortId
        ? <Link href={href({ ...query, q: "", source: "ALL", departmentId: undefined, programId: undefined, cohortId: undefined, page: 1 })}
            className="inline-flex min-h-11 items-center justify-center font-semibold text-link underline md:min-h-9">Clear filters</Link>
        : null}
    </form>
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm">
      <span role="status">{data.total.toLocaleString("en-IN")} matching {stageName(query.stage).toLowerCase()} applications</span>
      <a href={"/api/college/placements/jobs/" + encodeURIComponent(jobId) + "/applications/export" +
        (driveApplicationsHref(jobId, query, true).split("/export")[1] ?? "")}
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
        Export CSV (up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")})
      </a>
    </div>
    {query.stage === "ASSESSMENT"
      ? <Alert tone="info">Assessment candidates receive in-app notifications when their application stage is updated. An optional assessment-link distribution workflow is not yet available here.</Alert>
      : null}
    {internal.length ? (
      <CollegeApplicationPipelineControls
        key={jobId + ":" + JSON.stringify(query)}
        jobId={jobId} rows={internal} total={internal.length}
        query={{ ...query, source: "INTERNAL" }} />
    ) : null}
    {external.length ? <section className="min-w-0 space-y-3">
      <h2 className="text-[18px] font-semibold text-[var(--lms-heading)]">External applications</h2>
      <Alert tone="info">Externally sourced candidates are visible for review only. Bulk selection and stage changes are disabled here.</Alert>
      <DataTable caption="External shortlisted applications" rows={external} columns={externalColumns}
        getRowKey={row => row.id} />
    </section> : null}
    {!data.items.length ? <EmptyState
      title={query.q || query.source !== "ALL" || query.departmentId || query.programId || query.cohortId ? "No applications match these filters." : "No applications yet"}
      description={query.q || query.source !== "ALL" || query.departmentId || query.programId || query.cohortId
        ? "Try clearing search and source filters."
        : "There are no applications in this pipeline stage yet."}
      action={<Link href={href({ ...query, q: "", source: "ALL", departmentId: undefined, programId: undefined, cohortId: undefined, page: 1 })}
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Clear filters</Link>} /> : null}
    <nav aria-label="Shortlisted pages" className="flex min-w-0 flex-col gap-3 border-t border-[var(--lms-canvas-border)] pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span>Page {query.page} of {data.totalPages}</span>
      <div className="flex min-w-0 flex-wrap gap-3">
        {query.page > 1 ? <Link href={href({ ...query, page: query.page - 1 })}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Previous</Link> : null}
        {query.page < data.totalPages ? <Link href={href({ ...query, page: query.page + 1 })}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Next</Link> : null}
      </div>
    </nav>
    <p className="text-xs leading-5 text-muted-foreground">
      Stage moves require confirmation and are checked against the latest saved screening and offer history.
      The current internal-page selection is bounded; historical cross-page bulk matching is not yet enabled on this view.
    </p>
  </div>;
}
