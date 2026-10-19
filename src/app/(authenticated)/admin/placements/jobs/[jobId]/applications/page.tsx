import {SuperAdminDriveTabs} from "@/components/placements/super-admin-drive-tabs";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { ErrorState } from "@/components/ui/error-state";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { driveApplicationsHref, driveApplicationsParams, DRIVE_APPLICATION_EXPORT_CAP } from "@/modules/placements/college-drive-applications-model";
import { getCollegeApplicationPipeline } from "@/modules/placements/college-application-stage-service";
import { CollegeApplicationPipelineControls } from "@/components/placements/college-application-pipeline-controls";
import { listCollegeDriveApplicationFilters } from "@/modules/placements/college-drive-applications-options-service";

function adminHref(...args: Parameters<typeof driveApplicationsHref>) {
 return driveApplicationsHref(...args).replace("/college/placements/","/admin/placements/");
}
export default async function SuperAdminDriveApplicationsPage({ params, searchParams }: {
  params: Promise<{jobId:string}>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader eyebrow="Super Admin" title="Placement Drives" description="Placement administration requires a college safety scope." />
    <EmptyState title="Choose a college" description="Select a college in the Super Admin scope selector to manage its drives."/>
  </div>;
  requireSuperAdminSelectedCollege(context,"placements.manage");
  const {jobId} = await params;
  const query = driveApplicationsParams(await searchParams);
  if (!query) return <ErrorState title="Invalid applicant filters" description="The requested search, status, screening or page is invalid." />;
  const [data,filters] = await Promise.all([
    getCollegeApplicationPipeline(context,jobId,query),
    listCollegeDriveApplicationFilters(context),
  ]);
  return <div className="min-w-0 space-y-6">
    <SuperAdminDriveTabs jobId={jobId} active="Applications"/>
    <PageHeader eyebrow="Super Admin · Placements" title={"Applications · " + data.drive.title}
      description="Review applications, move candidates through hiring stages and notify them about decisions."
      actions={<Link href={`/admin/placements/jobs/${jobId}`} className="inline-flex min-h-11 items-center text-primary-text underline">Drive overview</Link>} />
    <form method="get" className="grid gap-3 border-b border-border pb-4 sm:grid-cols-2 xl:grid-cols-4">
      <label className="grid gap-1 text-sm">Name, email, roll or role
        <Input name="q" defaultValue={query.q} maxLength={100} className="w-full" />
      </label>
      <label className="grid gap-1 text-sm">Application
        <Select name="status" defaultValue={query.status} className="w-full">
          {["ALL","SUBMITTED","WITHDRAWN"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Screening
        <Select name="screening" defaultValue={query.screening} className="w-full">
          {["ALL","PENDING","HOLD","SHORTLISTED","REJECTED","UNRECORDED"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Source
        <Select name="source" defaultValue={query.source} className="w-full">
          {["ALL","INTERNAL","EXTERNAL"].map(item=><option key={item} value={item}>{item==="ALL"?"All sources":item}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Department
        <Select name="departmentId" defaultValue={query.departmentId??""} className="w-full">
          <option value="">All departments</option>
          {query.departmentId&&!filters.departments.some(item=>item.id===query.departmentId)&&
            <option value={query.departmentId}>Selected department</option>}
          {filters.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Program
        <Select name="programId" defaultValue={query.programId??""} className="w-full">
          <option value="">All programs</option>
          {query.programId&&!filters.programs.some(item=>item.id===query.programId)&&
            <option value={query.programId}>Selected program</option>}
          {filters.programs.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Batch
        <Select name="cohortId" defaultValue={query.cohortId??""} className="w-full">
          <option value="">All batches</option>
          {query.cohortId&&!filters.cohorts.some(item=>item.id===query.cohortId)&&
            <option value={query.cohortId}>Selected batch</option>}
          {filters.cohorts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>
      <Button type="submit" className="self-end">Filter</Button>
    </form>
    <nav aria-label="Application pipeline stages" className="flex flex-wrap gap-2 border-b border-border">
      {(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"] as const).map(stage=>
        <Link key={stage} href={adminHref(jobId,{...query,stage,page:1})}
          aria-current={query.stage===stage?"page":undefined}
          className={"inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold sm:min-h-9 "+
            (query.stage===stage?"border-primary text-primary-text":"border-transparent text-body hover:text-primary-text")}>
          {stage==="ALL"?"All":stage.charAt(0)+stage.slice(1).toLowerCase()}
          <span className="tabular-nums">{stage==="ALL"?
            Object.values(data.stageCounts).reduce((sum,num)=>sum+num,0):
            data.stageCounts[stage]??0}</span>
        </Link>)}
    </nav>
    <div className="flex flex-wrap justify-between gap-3 text-sm">
      <span>{data.total} matching applications</span>
      <a href={`/api/college/placements/jobs/${encodeURIComponent(jobId)}/applications/export${adminHref(jobId,query,true).split("/export")[1] ?? ""}`}
        className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Export CSV (up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")})</a>
    </div>
    {!data.storageReady?<section className="space-y-3">
      <p role="status" className="border-b border-border py-4 text-sm">
        Application stage actions are awaiting migration registration. You can still review the scoped applicant register.
      </p>
      <DataTable<(typeof data.items)[number]> rows={data.items} getRowKey={row=>row.id}
       caption="Drive applications" columns={[
        {key:"student",header:"Student",mobilePriority:"primary",cell:row=>row.name??"Unnamed learner"},
        {key:"roll",header:"Roll",mobilePriority:"secondary",cell:row=>row.rollNumber??"Not recorded"},
        {key:"role",header:"Role",mobilePriority:"secondary",cell:row=>row.roleTitle},
        {key:"application",header:"Application",mobilePriority:"secondary",cell:row=>row.status},
        {key:"screening",header:"Screening",mobilePriority:"secondary",cell:row=>row.screening??"Not recorded"},
       ]} empty={<p role="status" className="text-sm text-body">No applications match these filters.</p>}/>
     </section>:
     <CollegeApplicationPipelineControls jobId={jobId} rows={data.items} total={data.total} query={query} basePath="/admin/placements"/>}
    <p role="status" className="text-sm text-muted-foreground">Page {query.page} of {data.totalPages}</p>
    <Pagination page={query.page} pageCount={data.totalPages} label="Application pagination"
      hrefForPage={page=>adminHref(jobId,{...query,page})}/>
    <p className="text-xs text-muted-foreground">
      CSV uses formula-neutralized cells, includes filtered rows up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")},
      and includes a truncation notice if more matching rows exist.
    </p>
  </div>;
}
