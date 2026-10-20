import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { listCollegeDriveApplications } from "@/modules/placements/college-drive-applications-service";
import { DRIVE_APPLICATION_EXPORT_CAP, driveApplicationsHref, driveApplicationsQuerySchema } from "@/modules/placements/college-drive-applications-model";
import { collegeShortlistedQuery, collegeShortlistedHref } from "@/modules/placements/college-shortlisted-query";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

/** Dedicated legacy shortlisted surface, with persisted college-scoped applicant status. */
export default async function CollegeDriveShortlistedPage({
  params, searchParams,
}: {
  params: Promise<{jobId:string}>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context,"COLLEGE_ADMIN")) {
    redirect("/dashboard");
  }
  const {jobId}=await params;
  const parsed=collegeShortlistedQuery(await searchParams);
  if (!parsed.success) return <ErrorState title="Invalid applicant filters"
    description="The requested search or page is invalid." action={<Link href={collegeShortlistedHref(jobId,{q:"",page:1})} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link>}/>;
  const query=driveApplicationsQuerySchema.parse({...parsed.data,status:"SUBMITTED",screening:"SHORTLISTED"});
  const data=await listCollegeDriveApplications(context,jobId,query);
  if(query.page>data.totalPages) {
    redirect(collegeShortlistedHref(jobId,{q:query.q,page:data.totalPages}));
  }
  const columns:DataTableColumn<(typeof data.items)[number]>[]=[
    {key:"student",header:"Student",mobilePriority:"primary",cell:item=><strong className="break-words [overflow-wrap:anywhere]">{item.name??"Unnamed learner"}</strong>},
    {key:"roll",header:"Roll",cell:item=>item.rollNumber},
    {key:"role",header:"Role",cell:item=>item.roleTitle},
  ];
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Shortlisted"
      description={data.drive.title}
      actions={<Link href={driveApplicationsHref(jobId,{...query,screening:"ALL"})}
        className="font-semibold text-link underline min-h-11 md:min-h-9 inline-flex items-center hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Applications</Link>} />
    <form method="get" role="search" aria-label="Shortlisted student filters" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-[minmax(0,2fr)_auto_auto]">
      <label className="grid min-w-0 flex-1 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Student
        <Input type="search" name="q" maxLength={100} defaultValue={query.q} className="min-h-11 min-w-0 md:min-h-9" />
      </label>
      <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Filter</Button>
      {query.q ? <Link href={collegeShortlistedHref(jobId,{q:"",page:1})} className="inline-flex min-h-11 items-center justify-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link> : null}
    </form>
    <p role="status" className="text-sm">{data.total} shortlisted</p>
    <a className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 lms-inline-link hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" href={
      "/api/college/placements/jobs/"+encodeURIComponent(jobId)+"/applications/export"+
      (driveApplicationsHref(jobId,query,true).split("/export")[1]??"")
    }>Export CSV (up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")})</a>
    <DataTable caption="Shortlisted students" rows={data.items} columns={columns}
      getRowKey={item=>item.id}
      empty={<EmptyState title="No shortlisted students" description="No shortlisted students match these filters." action={<Link href={query.q?collegeShortlistedHref(jobId,{q:"",page:1}):driveApplicationsHref(jobId,{...query,status:"ALL",screening:"ALL",source:"ALL",stage:"ALL",departmentId:undefined,programId:undefined,cohortId:undefined})} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">{query.q?"Clear filters":"View applications"}</Link>}/>} />
    <nav aria-label="Shortlisted pages" className="flex min-w-0 flex-col items-stretch justify-between gap-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-sm sm:flex-row sm:items-center">
      <span>Page {query.page} of {data.totalPages}</span>
      <div className="flex min-w-0 flex-wrap gap-3 max-[767px]:[&_a]:flex-1 max-[767px]:[&_a]:justify-center">
      {query.page>1 ? <Link href={collegeShortlistedHref(jobId,{q:query.q,page:query.page-1})} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Previous</Link>:null}
      {query.page<data.totalPages ? <Link href={collegeShortlistedHref(jobId,{q:query.q,page:query.page+1})} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Next</Link>:null}
      </div>
    </nav>
  </div>;
}
