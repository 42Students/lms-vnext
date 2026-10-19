import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
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
    getCollegeApplicationPipeline(context,jobId,query),
    listCollegeDriveApplicationFilters(context),
  ]);
  const formatter = new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
  const columns:DataTableColumn<(typeof data.items)[number]>[]=[
    {key:"student",header:"Student",mobilePriority:"primary",cell:row=>row.name??"Unnamed learner"},
    {key:"email",header:"Email",cell:row=>row.email??"Not provided"},
    {key:"roll",header:"Roll",cell:row=>row.rollNumber??"Not recorded"},
    {key:"role",header:"Role",cell:row=>row.roleTitle},
    {key:"source",header:"Source",cell:row=>row.source},
    {key:"applied",header:"Applied (IST)",cell:row=>formatter.format(new Date(row.submittedAt))},
    {key:"application",header:"Application",cell:row=>row.status},
    {key:"screening",header:"Screening",cell:row=>row.screening??"Not recorded"},
  ];
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin · Placements" title={"Applications · " + data.drive.title}
      description="Review applications, move candidates through hiring stages and notify them about decisions."
      actions={<Link href={`/college/placements/jobs/${jobId}/overview`} className="text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-[var(--lms-control-height)] inline-flex items-center">Drive overview</Link>} />
    <form method="get" role="search" aria-label="Application filters" className="grid gap-3 rounded-[8px] border border-border p-4 sm:grid-cols-2 xl:grid-cols-4">
      <label className="grid gap-1 text-sm">Name, email, roll or role
        <input name="q" defaultValue={query.q} maxLength={100} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm" />
      </label>
      <label className="grid gap-1 text-sm">Application
        <select name="status" defaultValue={query.status} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm">
          {["ALL","SUBMITTED","WITHDRAWN"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Screening
        <select name="screening" defaultValue={query.screening} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm">
          {["ALL","PENDING","HOLD","SHORTLISTED","REJECTED","UNRECORDED"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Source
        <select name="source" defaultValue={query.source} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm">
          {["ALL","INTERNAL","EXTERNAL"].map(item=><option key={item} value={item}>{item==="ALL"?"All sources":item}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Department
        <select name="departmentId" defaultValue={query.departmentId??""} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm">
          <option value="">All departments</option>
          {query.departmentId&&!filters.departments.some(item=>item.id===query.departmentId)&&
            <option value={query.departmentId}>Selected department</option>}
          {filters.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Program
        <select name="programId" defaultValue={query.programId??""} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm">
          <option value="">All programs</option>
          {query.programId&&!filters.programs.some(item=>item.id===query.programId)&&
            <option value={query.programId}>Selected program</option>}
          {filters.programs.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Batch
        <select name="cohortId" defaultValue={query.cohortId??""} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm">
          <option value="">All batches</option>
          {query.cohortId&&!filters.cohorts.some(item=>item.id===query.cohortId)&&
            <option value={query.cohortId}>Selected batch</option>}
          {filters.cohorts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <button type="submit" className="min-h-[var(--lms-control-height)] self-end rounded-[var(--lms-control-radius)] bg-primary px-4 font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary inline-flex items-center">Filter</button>
    </form>
    <nav aria-label="Application pipeline stages" className="flex flex-wrap gap-2">
      {(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"] as const).map(stage=>
        <Link key={stage} href={driveApplicationsHref(jobId,{...query,stage,page:1})}
          aria-current={query.stage===stage?"page":undefined}
          className={"inline-flex min-h-[var(--lms-control-height)] items-center gap-2 rounded-[var(--lms-control-radius)] border px-3 text-sm font-semibold "+
            (query.stage===stage?"border-primary bg-primary-subtle text-link":"border-border text-body")}>
          {stage==="ALL"?"All":stage.charAt(0)+stage.slice(1).toLowerCase()}
          <span className="tabular-nums">{stage==="ALL"?
            Object.values(data.stageCounts).reduce((sum,num)=>sum+num,0):
            data.stageCounts[stage]??0}</span>
        </Link>)}
    </nav>
    <div className="flex flex-wrap justify-between gap-3 text-sm">
      <span>{data.total} matching applications</span>
      <a href={`/api/college/placements/jobs/${encodeURIComponent(jobId)}/applications/export${driveApplicationsHref(jobId,query,true).split("/export")[1] ?? ""}`}
        className="font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-[var(--lms-control-height)] inline-flex items-center">Export CSV (up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")})</a>
    </div>
    {!data.storageReady?<section className="space-y-3">
      <p role="status" className="border-b border-border pb-5 text-sm">
        Application stage actions are awaiting migration registration. You can still review the scoped applicant register.
      </p>
      <DataTable caption="College drive applicant register" columns={columns}
        rows={data.items} getRowKey={row=>row.id}
        empty={<p role="status" className="text-sm text-body">No applications match these filters.</p>} />
     </section>:
     <CollegeApplicationPipelineControls key={jobId+":"+JSON.stringify(query)} jobId={jobId} rows={data.items} total={data.total} query={query}/>}
    <nav aria-label="Application pagination" className="flex flex-wrap justify-between gap-3 text-sm">
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
