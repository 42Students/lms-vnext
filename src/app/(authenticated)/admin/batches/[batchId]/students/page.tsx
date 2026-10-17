import Link from "next/link";
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
 return <main className="space-y-5">
  <nav aria-label="Breadcrumbs" className="flex flex-wrap gap-2 text-sm"><Link href="/admin/batches" className="font-semibold text-primary-text">Batches</Link><span>›</span><span>{data.batch.name}</span></nav>
  <div><h1 className="text-2xl font-semibold">Manage students · {data.batch.name}</h1>
   <p className="mt-1 text-sm text-body">{data.batch.programName} · {data.batch.code} · {total} active class assignments</p></div>
  <p className="rounded-md border border-border bg-surface p-4 text-sm text-body">Select a class to search its roster by learner name, roll number or email and move learners through the existing capacity-checked class assignment controls. A learner may have distinct period-based assignments.</p>
  <section className="overflow-x-auto rounded-xl border border-border bg-surface" aria-label="Batch classes">
   <table className="w-full min-w-[36rem] text-left text-sm"><thead><tr className="border-b border-border">
    <th scope="col" className="p-3">Class</th><th scope="col" className="p-3">Status</th><th scope="col" className="p-3">Students</th><th scope="col" className="p-3">Capacity</th><th scope="col" className="p-3">Actions</th></tr></thead>
    <tbody>{data.classes.map(section=><tr key={section.id} className="border-b border-border">
      <td className="p-3">{section.name} ({section.code})</td><td className="p-3">{section.status}</td>
      <td className="p-3 tabular-nums">{section.learnerCount}</td><td className="p-3 tabular-nums">{section.capacity??"—"}</td>
      <td className="p-3"><Link className="font-semibold text-primary-text underline" href={"/admin/academics/sections/"+encodeURIComponent(section.id)}>Manage roster and schedule →</Link></td>
    </tr>)}</tbody></table>
  </section>
  <SuperAdminBatchRosterManager classes={data.classes} students={data.roster}/>
  {!data.classes.length?<p role="status">No classes exist for this batch. Create a class before managing its roster.</p>:null}
  <Link href={"/admin/classes?cohortCode="+encodeURIComponent(data.batch.code)} className="inline-flex min-h-10 items-center font-semibold text-primary-text underline">Manage batch classes →</Link>
 </main>;
}
