import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { listSuperAdminCompanyDriveHistory } from "@/modules/placements/admin-company-drive-history-service";

export default async function SuperAdminCompanyDrivesPage({params}:{
  params: Promise<{companyId:string}>;
}) {
  const context=await getCurrentRequestContext();
  if(!context.adminScope?.collegeId)redirect("/admin/companies");
  const {companyId}=await params;
  const history=await listSuperAdminCompanyDriveHistory(context,companyId)
    .then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const}));
  if(!history.ok)return <div className="min-w-0 space-y-4">
    <PageHeader title="Company drive history" actions={<PageBackLink href="/admin/companies" label="Companies"/>}/>
    <ErrorState title="Could not load company drive history"
      description="The selected college's drive history is temporarily unavailable. Your company selection has not changed."
      action={<Link className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9"
        href={"/admin/companies/"+encodeURIComponent(companyId)+"/drives"}>Retry</Link>}/>
  </div>;
  const data=history.value;
  if(!data)notFound();
  return <div className="min-w-0 space-y-[var(--lms-space-6)]">
    <PageHeader title={data.company.name}
      description="Drive history and recorded joining outcomes within the selected college only."
      actions={<PageBackLink href="/admin/companies" label="Companies"/>} />
    <section aria-label="Company history totals" className="grid min-w-0 grid-cols-2 divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
      {([["Drives run",data.totals.drives],["Total applications",data.totals.applicants],
        ["Total hired",data.totals.hired]] as const).map(([label,value])=>
        <div key={label} className="min-w-0 bg-surface px-[var(--lms-space-4)] py-[var(--lms-space-3)]">
          <p className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}</p>
          <p className="mt-2 text-[24px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">{value}</p>
        </div>)}
    </section>
    <DataTable<(typeof data.items)[number]> caption="Company drive history"
      rows={data.items} getRowKey={job=>job.id}
      empty={<EmptyState title="No drives recorded" description="This company has no placement drives in the selected college."/>}
      columns={[
        {key:"job",header:"Job",mobilePriority:"primary",cell:job=><strong>{job.title}</strong>},
        {key:"status",header:"Status",mobilePriority:"secondary",cell:job=><StatusBadge tone={job.status==="ACTIVE"||job.status==="LIVE"?"success":"neutral"}>{job.status}</StatusBadge>},
        {key:"posted",header:"Posted",mobilePriority:"secondary",cell:job=>job.publishedAt?.toISOString().slice(0,10)??"—"},
        {key:"deadline",header:"Deadline",mobilePriority:"secondary",cell:job=>job.deadline?.toISOString().slice(0,10)??"—"},
        {key:"applicants",header:"Applicants",mobilePriority:"secondary",cell:job=>job.applicants},
        {key:"hired",header:"Hired",mobilePriority:"secondary",cell:job=>job.hired},
        {key:"actions",header:"Actions",mobilePriority:"action",cell:job=><Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
          href={`/admin/placements/jobs/${job.id}`}>Open drive →</Link>},
      ]}/>
    {data.truncated ? <p className="text-sm text-muted-foreground">
      Showing first 500 drives. More historical records may exist. Totals above cover the displayed drives only.
    </p> : null}
  </div>;
}
