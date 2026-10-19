import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {Breadcrumbs} from "@/components/ui/breadcrumbs";
import {DataTable} from "@/components/ui/data-table";
import {SuperAdminBatchRosterManager} from "@/components/admin/super-admin-batch-roster-manager";
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
 return <div className="min-w-0 space-y-5">
  <Breadcrumbs items={[{label:"Batches",href:"/admin/batches"},{label:data.batch.name}]}/>
  <PageHeader eyebrow="Super Admin · Academic Setup" title={"Manage students · "+data.batch.name} description={`${data.batch.programName} · ${data.batch.code} · ${total} active class assignments`}/>
  <a href={"/api/admin/batches/"+encodeURIComponent(batchId)+"/students/export"} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Export batch students (CSV)</a>
  <p className="text-sm leading-6 text-body">Select a class to search its roster by learner name, roll number or email and move learners through the existing capacity-checked class assignment controls. A learner may have distinct period-based assignments.</p>
  <section className="min-w-0 space-y-3" aria-label="Batch classes">
    <DataTable<(typeof data.classes)[number]> caption="Batch classes" rows={data.classes} getRowKey={row=>row.id}
      empty={<p role="status">No classes exist for this batch. Create a class before managing its roster.</p>}
      columns={[
        {key:"class",header:"Class",mobilePriority:"primary",cell:row=><strong>{row.name} ({row.code})</strong>},
        {key:"status",header:"Status",mobilePriority:"secondary",cell:row=>row.status},
        {key:"students",header:"Students",mobilePriority:"secondary",cell:row=><span className="tabular-nums">{row.learnerCount}</span>},
        {key:"capacity",header:"Capacity",mobilePriority:"secondary",cell:row=><span className="tabular-nums">{row.capacity??"—"}</span>},
        {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline" href={"/admin/academics/sections/"+encodeURIComponent(row.id)}>Manage roster and schedule →</Link>},
      ]}/>
  </section>
  <SuperAdminBatchRosterManager classes={data.classes} students={data.roster}/>
  <Link href={"/admin/classes?cohortCode="+encodeURIComponent(data.batch.code)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Manage batch classes →</Link>
 </div>;
}
