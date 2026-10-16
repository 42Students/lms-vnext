import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { driveApplicationsHref, driveApplicationsParams, DRIVE_APPLICATION_EXPORT_CAP } from "@/modules/placements/college-drive-applications-model";
import { getCollegeApplicationPipeline } from "@/modules/placements/college-application-stage-service";
import { CollegeApplicationPipelineControls } from "@/components/placements/college-application-pipeline-controls";
import { listCollegeDriveApplicationFilters } from "@/modules/placements/college-drive-applications-options-service";

export default async function CollegeDriveApplicationsPage({ params, searchParams }: {
  params: Promise<{jobId:string}>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const {jobId} = await params;
  const query = driveApplicationsParams(await searchParams);
  if (!query) return <ErrorState title="Invalid applicant filters" description="The requested search, status, screening or page is invalid." />;
  const [data,filters] = await Promise.all([
    listCollegeDriveApplications(context,jobId,query),
    listCollegeDriveApplicationFilters(context),
  ]);
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin · Placements" title={"Applications · " + data.drive.title}
      description="Review applications, move candidates through hiring stages and notify them about decisions."
      actions={<Link href={`/college/placements/jobs/${jobId}/overview`} className="text-primary-text underline">Drive overview</Link>} />
    <form method="get" className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2 xl:grid-cols-4">
      <label className="grid gap-1 text-sm">Name, email, roll or role
        <input name="q" defaultValue={query.q} maxLength={100} className="min-h-10 rounded-md border border-border px-2" />
      </label>
      <label className="grid gap-1 text-sm">Application
        <select name="status" defaultValue={query.status} className="min-h-10 rounded-md border border-border px-2">
          {["ALL","SUBMITTED","WITHDRAWN"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Screening
        <select name="screening" defaultValue={query.screening} className="min-h-10 rounded-md border border-border px-2">
          {["ALL","PENDING","HOLD","SHORTLISTED","REJECTED","UNRECORDED"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Source
        <select name="source" defaultValue={query.source} className="min-h-10 rounded-md border border-border px-2">
          {["ALL","INTERNAL","EXTERNAL"].map(item=><option key={item} value={item}>{item==="ALL"?"All sources":item}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Department
        <select name="departmentId" defaultValue={query.departmentId??""} className="min-h-10 rounded-md border border-border px-2">
          <option value="">All departments</option>
          {query.departmentId&&!filters.departments.some(item=>item.id===query.departmentId)&&
            <option value={query.departmentId}>Selected department</option>}
          {filters.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Program
        <select name="programId" defaultValue={query.programId??""} className="min-h-10 rounded-md border border-border px-2">
          <option value="">All programs</option>
          {query.programId&&!filters.programs.some(item=>item.id===query.programId)&&
            <option value={query.programId}>Selected program</option>}
          {filters.programs.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Batch
        <select name="cohortId" defaultValue={query.cohortId??""} className="min-h-10 rounded-md border border-border px-2">
          <option value="">All batches</option>
          {query.cohortId&&!filters.cohorts.some(item=>item.id===query.cohortId)&&
            <option value={query.cohortId}>Selected batch</option>}
          {filters.cohorts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <button type="submit" className="min-h-10 self-end rounded-md bg-primary px-4 font-semibold text-on-primary">Filter</button>
    </form>
    <div className="flex flex-wrap justify-between gap-3 text-sm">
      <span>{data.total} matching applications</span>
      <a href={`/api/college/placements/jobs/${encodeURIComponent(jobId)}/applications/export${driveApplicationsHref(jobId,query,true).split("/export")[1] ?? ""}`}
        className="font-semibold text-primary-text underline">Export CSV (up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")})</a>
    </div>
    {!data.storageReady?<p role="status" className="rounded border border-border bg-surface p-5 text-sm">
      Application stage actions are awaiting migration registration. The existing scoped applicant register remains available.</p>:
      <CollegeApplicationPipelineControls jobId={jobId} rows={data.items}/>}
    <nav aria-label="Application pagination" className="flex justify-between gap-3 text-sm">
      <span>Page {query.page} of {data.totalPages}</span><div className="flex gap-3">
        {query.page>1?<Link href={driveApplicationsHref(jobId,{...query,page:query.page-1})}>Previous</Link>:null}
        {query.page<data.totalPages?<Link href={driveApplicationsHref(jobId,{...query,page:query.page+1})}>Next</Link>:null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground">
      CSV uses formula-neutralized cells, includes filtered rows up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")},
      and includes a truncation notice if more matching rows exist.
    </p>
  </div>;
}
