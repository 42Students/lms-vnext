import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { listCollegeDriveApplications } from "@/modules/placements/college-drive-applications-service";
import { DRIVE_APPLICATION_EXPORT_CAP, driveApplicationsHref, driveApplicationsQuerySchema } from "@/modules/placements/college-drive-applications-model";
import { collegeShortlistedQuery, collegeShortlistedHref } from "@/modules/placements/college-shortlisted-query";

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
  return <div className="space-y-6">
    <PageHeader eyebrow="Drives" title="Shortlisted"
      description={data.drive.title}
      actions={<Link href={driveApplicationsHref(jobId,{...query,screening:"ALL"})}
        className="font-semibold text-primary-text underline">Applications</Link>} />
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
      <label className="grid min-w-0 flex-1 gap-1 text-sm">Student
        <input type="search" name="q" maxLength={100} defaultValue={query.q}
          className="min-h-10 rounded-md border border-border px-3"/>
      </label>
      <button type="submit" className="min-h-10 rounded-md bg-primary px-4 font-semibold text-on-primary">Filter</button>
    </form>
    <p role="status" className="text-sm">{data.total} shortlisted</p>
    {query.q&&data.total===0?<Link href={collegeShortlistedHref(jobId,{q:"",page:1})}
      className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">Clear filters</Link>:null}
    <a className="text-sm font-semibold text-primary-text underline" href={
      "/api/college/placements/jobs/"+encodeURIComponent(jobId)+"/applications/export"+
      (driveApplicationsHref(jobId,query,true).split("/export")[1]??"")
    }>Export CSV (up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")})</a>
    {data.items.length ? <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[36rem] text-left text-sm"><thead>
        <tr className="border-b border-border"><th className="p-3">Student</th>
          <th className="p-3">Roll</th><th className="p-3">Role</th></tr>
      </thead><tbody>{data.items.map(item=><tr key={item.id} className="border-b border-border">
        <td className="p-3">{item.name}</td><td className="p-3">{item.rollNumber}</td>
        <td className="p-3">{item.roleTitle}</td></tr>)}</tbody></table>
    </div> : <p role="status" className="rounded-lg border p-4">No shortlisted students</p>}
    <nav aria-label="Shortlisted pages" className="flex flex-wrap items-center gap-4 text-sm">
      <span>Page {query.page} of {data.totalPages}</span>
      {query.page>1 ? <Link href={collegeShortlistedHref(jobId,{q:query.q,page:query.page-1})}>Previous</Link>:null}
      {query.page<data.totalPages ? <Link href={collegeShortlistedHref(jobId,{q:query.q,page:query.page+1})}>Next</Link>:null}
    </nav>
  </div>;
}
