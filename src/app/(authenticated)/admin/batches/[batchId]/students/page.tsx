import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {Breadcrumbs} from "@/components/ui/breadcrumbs";
import {DataTable} from "@/components/ui/data-table";
import {StatusBadge} from "@/components/ui/status-badge";
import {Disclosure} from "@/components/ui/disclosure";
import {EmptyState} from "@/components/ui/empty-state";
import {SuperAdminBatchStudentsDialog} from "@/components/admin/super-admin-batch-students-dialog";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getSuperAdminBatchRosterOverview} from "@/modules/admin-ui/super-admin-batch-roster-service";

export default async function SuperAdminBatchStudentsPage({params}:{
 params:Promise<{batchId:string}>;
}){
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)redirect("/admin/batches");
 const {batchId}=await params;
 const data=await getSuperAdminBatchRosterOverview(context,batchId);
 if(!data)notFound();
 const total=data.classes.reduce((sum,section)=>sum+section.learnerCount,0);
 return <div className="min-w-0 space-y-[var(--lms-space-6)]">
  <Breadcrumbs items={[{label:"Batches",href:"/admin/batches"},{label:data.batch.name}]}/>
  <PageHeader eyebrow="Super Admin · Academic Setup" title={"Manage students · "+data.batch.name} description={`${data.batch.programName} · ${data.batch.code} · ${total} active class assignments`}
   actions={<a href={"/api/admin/batches/"+encodeURIComponent(batchId)+"/students/export"} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] px-4 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:w-auto hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Export batch students (CSV)</a>}/>
  <p className="max-w-3xl text-sm leading-6 text-body">Select a class to search its roster by learner name, roll number or email and move learners through the existing capacity-checked class assignment controls. A learner may have distinct period-based assignments.</p>
  <section aria-label="Batch students"><SuperAdminBatchStudentsDialog name={data.batch.name} classes={data.classes} students={data.roster}/></section>
  <section className="min-w-0 space-y-[var(--lms-space-3)]" aria-label="Batch classes">
    <Disclosure title="Batch classes" contentClassName="pb-[var(--lms-space-4)]">
    <DataTable<(typeof data.classes)[number]> caption="Batch classes" rows={data.classes} getRowKey={row=>row.id}
      empty={<EmptyState title="No classes exist for this batch. Create a class before managing its roster." />}
      columns={[
        {key:"class",header:"Class",mobilePriority:"primary",cell:row=><strong>{row.name} ({row.code})</strong>},
        {key:"status",header:"Status",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.status==="ACTIVE"?"success":"neutral"}>{row.status}</StatusBadge>},
        {key:"students",header:"Students",mobilePriority:"secondary",cell:row=><span className="tabular-nums">{row.learnerCount}</span>},
        {key:"capacity",header:"Capacity",mobilePriority:"secondary",cell:row=><span className="tabular-nums">{row.capacity??"—"}</span>},
        {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)]" href={"/admin/academics/sections/"+encodeURIComponent(row.id)}>Manage roster and schedule →</Link>},
      ]}/>
    </Disclosure>
  </section>

  <Link href={"/admin/classes?cohortCode="+encodeURIComponent(data.batch.code)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)]">Manage batch classes →</Link>
 </div>;
}
