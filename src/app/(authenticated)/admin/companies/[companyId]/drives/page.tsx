import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { listSuperAdminCompanyDriveHistory } from "@/modules/placements/admin-company-drive-history-service";

export default async function SuperAdminCompanyDrivesPage({params}:{
  params: Promise<{companyId:string}>;
}) {
  const context=await getCurrentRequestContext();
  if(!context.adminScope?.collegeId)redirect("/admin/companies");
  const {companyId}=await params;
  const data=await listSuperAdminCompanyDriveHistory(context,companyId);
  if(!data)notFound();
  return <div className="min-w-0 space-y-5">
    <PageHeader eyebrow="Super Admin · Companies" title={data.company.name}
      description="Drive history and recorded joining outcomes within the selected college only." />
    <Link href="/admin/companies" className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)]">
      ← Companies
    </Link>
    <section aria-label="Company history totals" className="grid gap-3 sm:grid-cols-3">
      {([["Drives run",data.totals.drives],["Total applications",data.totals.applicants],
        ["Total hired",data.totals.hired]] as const).map(([label,value])=>
        <div key={label} className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
        </div>)}
    </section>
    {!data.items.length ? <EmptyState title="No drives recorded"
      description="This company has no placement drives in the selected college." /> :
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead><tr className="border-b border-border bg-muted">
            <th className="p-3">Job</th><th className="p-3">Status</th>
            <th className="p-3">Posted</th><th className="p-3">Deadline</th>
            <th className="p-3">Applicants</th><th className="p-3">Hired</th>
            <th className="p-3">Actions</th>
          </tr></thead>
          <tbody>{data.items.map(job=><tr key={job.id} className="border-b border-border">
            <td className="p-3 font-semibold">{job.title}</td>
            <td className="p-3"><StatusBadge>{job.status}</StatusBadge></td>
            <td className="p-3">{job.publishedAt?.toISOString().slice(0,10)??"—"}</td>
            <td className="p-3">{job.deadline?.toISOString().slice(0,10)??"—"}</td>
            <td className="p-3">{job.applicants}</td><td className="p-3">{job.hired}</td>
            <td className="p-3"><Link className="font-semibold text-[var(--lms-teal-deep)]"
              href={`/admin/placements/jobs/${job.id}`}>Open drive →</Link></td>
          </tr>)}</tbody>
        </table>
      </div>}
    {data.truncated ? <p className="text-sm text-muted-foreground">
      Showing first 500 drives. More historical records may exist.
    </p> : null}
  </div>;
}
