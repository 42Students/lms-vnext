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
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Tabs} from "@/components/ui/tabs";

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
  return <div className="min-w-0 space-y-6">
    <PageHeader title={"Applications · " + data.drive.title}
      description="Review applications, move candidates through hiring stages and notify them about decisions."
      actions={<Link href={`/college/placements/jobs/${jobId}/overview`} className="text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-[var(--lms-control-height)] inline-flex items-center">Drive overview</Link>} />
    <form method="get" role="search" aria-label="Application filters" className="grid min-w-0 grid-cols-1 gap-3 border-b border-[var(--lms-canvas-border)] pb-4 min-[768px]:grid-cols-2 min-[992px]:grid-cols-4">
      <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name, email, roll or role
        <Input name="q" defaultValue={query.q} maxLength={100} />
      </label>
      <label className="grid gap-1 text-sm">Application
        <Select name="status" defaultValue={query.status} >
          {["ALL","SUBMITTED","WITHDRAWN"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Screening
        <Select name="screening" defaultValue={query.screening} >
          {["ALL","PENDING","HOLD","SHORTLISTED","REJECTED","UNRECORDED"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Source
        <Select name="source" defaultValue={query.source} >
          {["ALL","INTERNAL","EXTERNAL"].map(item=><option key={item} value={item}>{item==="ALL"?"All sources":item}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Department
        <Select name="departmentId" defaultValue={query.departmentId??""} >
          <option value="">All departments</option>
          {query.departmentId&&!filters.departments.some(item=>item.id===query.departmentId)&&
            <option value={query.departmentId}>Selected department</option>}
          {filters.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Program
        <Select name="programId" defaultValue={query.programId??""} >
          <option value="">All programs</option>
          {query.programId&&!filters.programs.some(item=>item.id===query.programId)&&
            <option value={query.programId}>Selected program</option>}
          {filters.programs.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Batch
        <Select name="cohortId" defaultValue={query.cohortId??""} >
          <option value="">All batches</option>
          {query.cohortId&&!filters.cohorts.some(item=>item.id===query.cohortId)&&
            <option value={query.cohortId}>Selected batch</option>}
          {filters.cohorts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>
      <Button type="submit" className="self-end">Filter</Button>
    </form>
    <Tabs ariaLabel="Application pipeline stages" renderPanel={false} value={query.stage}
      items={(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"] as const).map(stage=>({
        value:stage,
        label:stage==="ALL"?"All":stage.charAt(0)+stage.slice(1).toLowerCase(),
        count:stage==="ALL"?Object.values(data.stageCounts).reduce((sum,num)=>sum+num,0):data.stageCounts[stage]??0,
        href:driveApplicationsHref(jobId,{...query,stage,page:1}),
      }))}/>
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-[13px] text-[var(--lms-body-text)]">
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
    <nav aria-label="Application pagination" className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-[13px] text-[var(--lms-body-text)]">
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
