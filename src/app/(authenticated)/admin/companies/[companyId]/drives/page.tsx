import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
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
    <Link href="/admin/companies" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text hover:bg-primary-subtle">
      ← Companies
    </Link>
    <section aria-label="Company history totals" className="grid gap-3 sm:grid-cols-3">
      {([["Drives run",data.totals.drives],["Total applications",data.totals.applicants],
        ["Total hired",data.totals.hired]] as const).map(([label,value])=>
        <div key={label} className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
        </div>)}
    </section>
    <DataTable<(typeof data.items)[number]> caption="Company drive history"
      rows={data.items} getRowKey={job=>job.id}
      empty={<EmptyState title="No drives recorded" description="This company has no placement drives in the selected college."/>}
      columns={[
        {key:"job",header:"Job",mobilePriority:"primary",cell:job=><strong>{job.title}</strong>},
        {key:"status",header:"Status",mobilePriority:"secondary",cell:job=><StatusBadge>{job.status}</StatusBadge>},
        {key:"posted",header:"Posted",mobilePriority:"secondary",cell:job=>job.publishedAt?.toISOString().slice(0,10)??"—"},
        {key:"deadline",header:"Deadline",mobilePriority:"secondary",cell:job=>job.deadline?.toISOString().slice(0,10)??"—"},
        {key:"applicants",header:"Applicants",mobilePriority:"secondary",cell:job=>job.applicants},
        {key:"hired",header:"Hired",mobilePriority:"secondary",cell:job=>job.hired},
        {key:"actions",header:"Actions",mobilePriority:"action",cell:job=><Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline"
          href={`/admin/placements/jobs/${job.id}`}>Open drive →</Link>},
      ]}/>
    {data.truncated ? <p className="text-sm text-muted-foreground">
      Showing first 500 drives. More historical records may exist. Totals above cover the displayed drives only.
    </p> : null}
  </div>;
}
