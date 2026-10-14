import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { driveApplicationsHref, driveApplicationsParams, DRIVE_APPLICATION_EXPORT_CAP } from "@/modules/placements/college-drive-applications-model";
import { listCollegeDriveApplications } from "@/modules/placements/college-drive-applications-service";

export default async function CollegeDriveApplicationsPage({ params, searchParams }: {
  params: Promise<{jobId:string}>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const {jobId} = await params;
  const query = driveApplicationsParams(await searchParams);
  if (!query) return <ErrorState title="Invalid applicant filters" description="The requested search, status, screening or page is invalid." />;
  const data = await listCollegeDriveApplications(context,jobId,query);
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin · Placements" title={"Applications · " + data.drive.title}
      description="Read-only scoped applicant register. Private fields are limited to the TPO-approved roster."
      actions={<Link href={`/college/placements/jobs/${jobId}/overview`} className="text-primary-text underline">Drive overview</Link>} />
    <form method="get" className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-4">
      <label className="grid gap-1 text-sm">Name, roll or role
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
      <button type="submit" className="min-h-10 self-end rounded-md bg-primary px-4 font-semibold text-on-primary">Filter</button>
    </form>
    <div className="flex flex-wrap justify-between gap-3 text-sm">
      <span>{data.total} matching applications</span>
      <a href={`/api/college/placements/jobs/${encodeURIComponent(jobId)}/applications/export${driveApplicationsHref(jobId,query,true).split("/export")[1] ?? ""}`}
        className="font-semibold text-primary-text underline">Export CSV (up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")})</a>
    </div>
    <section className="overflow-x-auto rounded-xl border border-border">
      {data.items.length?<table className="w-full min-w-[45rem] text-left text-sm">
        <thead><tr className="border-b border-border bg-muted">
          <th className="p-3">Student</th><th className="p-3">Roll</th><th className="p-3">Role</th>
          <th className="p-3">Application</th><th className="p-3">Screening</th>
        </tr></thead>
        <tbody>{data.items.map(item=><tr key={item.id} className="border-b border-border">
          <td className="p-3">{item.name ?? "Unnamed learner"}</td>
          <td className="p-3">{item.rollNumber ?? "Not recorded"}</td>
          <td className="p-3">{item.roleTitle}</td><td className="p-3">{item.status}</td>
          <td className="p-3">{item.screening ?? "Not recorded"}</td>
        </tr>)}</tbody>
      </table>:<p className="p-6 text-sm text-body">
        {data.total===0?"No persisted applications match these filters.":"No rows on this page; choose an earlier page."}
      </p>}
    </section>
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
