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
    description="The requested search or page is invalid." />;
  const query=driveApplicationsQuerySchema.parse({...parsed.data,status:"SUBMITTED",screening:"SHORTLISTED"});
  const data=await listCollegeDriveApplications(context,jobId,query);
  if(query.page>data.totalPages) {
    redirect(collegeShortlistedHref(jobId,{q:query.q,page:data.totalPages}));
  }
  const columns:DataTableColumn<(typeof data.items)[number]>[]=[
    {key:"student",header:"Student",mobilePriority:"primary",cell:item=>item.name},
    {key:"roll",header:"Roll",cell:item=>item.rollNumber},
    {key:"role",header:"Role",cell:item=>item.roleTitle},
  ];
  return <div className="space-y-6">
    <PageHeader title="Shortlisted"
      description={data.drive.title}
      actions={<Link href={driveApplicationsHref(jobId,{...query,screening:"ALL"})}
        className="font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-11 md:min-h-9 inline-flex items-center">Applications</Link>} />
    <form method="get" role="search" aria-label="Shortlisted student filters" className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
      <label className="grid min-w-0 flex-1 gap-1 text-sm">Student
        <Input type="search" name="q" maxLength={100} defaultValue={query.q}
          />
      </label>
      <Button type="submit" className="min-h-11 md:min-h-9">Filter</Button>
    </form>
    <p role="status" className="text-sm">{data.total} shortlisted</p>
    {query.q&&data.total===0?<Link href={collegeShortlistedHref(jobId,{q:"",page:1})}
      className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear filters</Link>:null}
    <a className="text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-11 inline-flex items-center lms-inline-link" href={
      "/api/college/placements/jobs/"+encodeURIComponent(jobId)+"/applications/export"+
      (driveApplicationsHref(jobId,query,true).split("/export")[1]??"")
    }>Export CSV (up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")})</a>
    <DataTable caption="Shortlisted students" rows={data.items} columns={columns}
      getRowKey={item=>item.id}
      empty={<EmptyState title="No shortlisted students" description="No shortlisted students match these filters."/>} />
    <nav aria-label="Shortlisted pages" className="flex flex-wrap items-center gap-4 text-sm">
      <span>Page {query.page} of {data.totalPages}</span>
      {query.page>1 ? <Link href={collegeShortlistedHref(jobId,{q:query.q,page:query.page-1})} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Previous</Link>:null}
      {query.page<data.totalPages ? <Link href={collegeShortlistedHref(jobId,{q:query.q,page:query.page+1})} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Next</Link>:null}
    </nav>
  </div>;
}
