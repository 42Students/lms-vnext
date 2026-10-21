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
import { CollegeApplicationDependentFilters } from "@/components/placements/college-application-dependent-filters";
import { listCollegeDriveApplicationFilters } from "@/modules/placements/college-drive-applications-options-service";
import { CollegeAssessmentLinkCopy } from "@/components/placements/college-assessment-link-copy";
import { getDb } from "@/db/client";
import { placementJobs, placementCompanyRelationships, placementCompanies } from "@/db/schema";
import { and, eq } from "drizzle-orm";

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

  const data = await getCollegeApplicationPipeline(context, jobId, query);
  const [job] = await getDb().select({
    status: placementJobs.status,
    locations: placementJobs.locations,
    company: placementCompanies.name,
    posting: placementJobs.legacyPostingDetails,
  }).from(placementJobs)
    .innerJoin(placementCompanyRelationships, eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId))
    .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,data.collegeId)))
    .limit(1);
  const filters = await listCollegeDriveApplicationFilters(context).catch(() => null);
  const filtered = Boolean(query.q || query.source !== "ALL" || query.departmentId || query.programId || query.cohortId);
  const assessmentLink = job?.posting?.assessmentUrl && /^https:\/\//i.test(job.posting.assessmentUrl)
    ? job.posting.assessmentUrl : null;
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
    { key: "name", header: "Learner Name", mobilePriority: "primary", cell: row => row.name || "-" },
    { key: "email", header: "Email", cell: row => row.email || "-" },
    { key: "college", header: "College", cell: row => row.collegeName },
    { key: "source", header: "Source", cell: row => row.source },
    { key: "status", header: "Current Status", cell: row => row.stage },
    { key: "date", header: "Applied Date", cell: row => date.format(new Date(row.submittedAt)) },
    { key: "actions", header: "Actions", cell: () => "View only" },
  ];

  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <nav aria-label="Drive breadcrumbs" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Link href="/college/placements/drives" className="font-semibold text-link hover:underline">Drives</Link>
      <span aria-hidden="true">/</span>
      <Link href={"/college/placements/jobs/"+encodeURIComponent(jobId)}
        className="font-semibold text-link hover:underline">{data.drive.title}</Link>
      <span aria-hidden="true">/</span>
      <Link href={driveApplicationsHref(jobId,{...query,stage:"ALL",status:"ALL",page:1})}
        className="font-semibold text-link hover:underline">Applications</Link>
      <span aria-hidden="true">/</span><span aria-current="page">Shortlisted</span>
    </nav>
    <PageHeader title="Shortlisted" description={data.drive.title}
      actions={<Link href={driveApplicationsHref(jobId, {
        ...query, stage: "ALL", screening: "ALL", status: "ALL", page: 1,
      })} className="inline-flex min-h-11 items-center font-semibold text-link underline hover:text-[var(--lms-primary-text)] md:min-h-9">All applications</Link>} />
    <Tabs ariaLabel="Drive workspace" renderPanel={false} value="Applications" items={[
      {value:"Overview",label:"Overview",href:"/college/placements/jobs/"+encodeURIComponent(jobId)},
      {value:"Applications",label:"Applications",href:driveApplicationsHref(jobId,{...query,stage:"ALL",status:"ALL",page:1})},
      {value:"Interviews",label:"Interviews",href:"/college/placements/jobs/"+encodeURIComponent(jobId)+"/interviews"},
    ]}/>
    <section aria-label="Drive summary" className="rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-[var(--lms-heading)]">{data.drive.title}</h2>
        <span className={"rounded-full px-3 py-1 text-xs font-semibold " +
          (job?.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700")}>
          {job?.status ?? "Status unavailable"}
        </span>
      </div>
      <p className="mt-2 text-sm text-body">
        {job?.company ?? "Company unavailable"} · {job?.locations?.length ? job.locations.join(", ") : "Location not specified"}
      </p>
      <div className="mt-4 flex flex-wrap gap-2" role="list" aria-label="Applicant stage totals">
        {stages.filter(stage => (data.stageCounts[stage] ?? 0) > 0).map(stage=><span role="listitem" key={stage}
          className="rounded border border-[var(--lms-canvas-border)] bg-[#f7fbfb] px-3 py-2 text-xs font-semibold text-[var(--lms-heading)]">
          {stageName(stage)} <strong className="ml-1 tabular-nums">{data.stageCounts[stage]}</strong>
        </span>)}
      </div>
    </section>
    {assessmentLink && query.stage==="ASSESSMENT" ? <Alert tone="info">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1"><p className="font-semibold">Assessment link</p>
          <a href={assessmentLink} target="_blank" rel="noopener noreferrer"
            className="break-all font-mono text-sm text-link underline">{assessmentLink}</a></div>
        <CollegeAssessmentLinkCopy url={assessmentLink}/>
      </div>
    </Alert> : null}
    <section aria-labelledby="shortlisted-applications-title" className="space-y-2">
      <h2 id="shortlisted-applications-title" className="text-lg font-semibold text-[var(--lms-heading)]">Applications · {data.total.toLocaleString("en-IN")}</h2>
      <p className="text-sm text-muted-foreground">Shortlisted is an Applications subview; review and manage each candidate using the stage tabs.</p>
    </section>
    <Tabs ariaLabel="Shortlisted pipeline stages" renderPanel={false} value={query.stage}
      items={stages.map(stage => ({
        value: stage,
        label: stageName(stage),
        count: data.stageCounts[stage] ?? 0,
        href: href({ ...query, stage, page: 1 }),
      }))} />
    <form method="get" role="search" aria-label="Shortlisted application filters"
      className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-2 lg:grid-cols-4">
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
      {filters ? <CollegeApplicationDependentFilters
        initial={{departmentId:query.departmentId,programId:query.programId,cohortId:query.cohortId}}
        departments={filters.departments} programs={filters.programs} cohorts={filters.cohorts}/> :
        <p role="alert" className="text-sm text-amber-700 lg:col-span-2">Department, program and batch options could not be loaded. <Link className="underline" href={href({...query,page:1})}>Retry options</Link></p>}
      <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Filters</Button>
      <Link href={href({...query,page:query.page})} className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link md:min-h-9">Refresh</Link>
      {filtered
        ? <Link href={href({ ...query, q: "", source: "ALL", departmentId:undefined, programId:undefined,cohortId:undefined, page: 1 })}
            className="inline-flex min-h-11 items-center justify-center font-semibold text-link underline md:min-h-9">Clear filters</Link>
        : null}
    </form>
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm">
      <span role="status">{data.total.toLocaleString("en-IN")} matching {stageName(query.stage).toLowerCase()} applications</span>
      <a download href={"/api/college/placements/jobs/" + encodeURIComponent(jobId) + "/applications/export" +
        (driveApplicationsHref(jobId, query, true).split("/export")[1] ?? "")}
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
        Export CSV (up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")})
      </a>
    </div>
    {query.stage === "ASSESSMENT" && !assessmentLink
      ? <Alert tone="info">Assessment candidates receive in-app notifications when their application stage is updated. No registered assessment link is available for this drive.</Alert>
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
        getRowKey={row => row.id} empty={<EmptyState title="No external applications" description="No externally sourced applications match these filters."/>} />
    </section> : null}
    {!data.items.length ? <EmptyState
      title={filtered ? "No applications match these filters." : "No applications yet"}
      description={filtered
        ? "Try another status, search, or cohort filter."
        : "There are no applications in this pipeline stage yet."}
      action={<Link href={href({ ...query, q: "", source: "ALL", departmentId:undefined,programId:undefined,cohortId:undefined,page: 1 })}
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
