import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {listCollegeAdminHistory} from "@/modules/colleges/admin-session-service";
export const dynamic="force-dynamic";
export default async function AdministratorHistoryPage({params}:{
 params:Promise<{collegeId:string;userId:string}>;
}){
 const {collegeId,userId}=await params;
 const data=await listCollegeAdminHistory(await getCurrentRequestContext(),collegeId,userId);
 const base="/admin/colleges/"+encodeURIComponent(collegeId)+"/admins";
 const format=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(date);
 return <main className="min-w-0 space-y-5">
  <Link href={base} className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">← College admins</Link>
  <PageHeader eyebrow="Super Admin · Tenant" title={data.target.name+" · History"}
   description="Recorded identity, college-admin lifecycle and platform actions concerning this administrator in this college. Cross-college and raw event metadata are excluded."/>
  <p role="status" className="text-sm text-body">
   {data.events.length} recorded event(s){data.truncated?" · latest 100 shown":""}.
  </p>
  {data.events.length?<div className="overflow-x-auto rounded-xl border border-border bg-surface">
   <table className="w-full min-w-[38rem] text-left text-sm">
    <thead className="bg-surface-subtle text-body"><tr>
     <th scope="col" className="p-3">When (IST)</th>
     <th scope="col" className="p-3">Event</th>
     <th scope="col" className="p-3">Summary</th>
    </tr></thead>
    <tbody>{data.events.map(event=><tr key={event.id} className="border-t border-border">
     <td className="whitespace-nowrap p-3">{format(event.occurredAt)}</td>
     <td className="break-all p-3 font-mono text-xs">{event.eventType}</td>
     <td className="break-words p-3">{event.summary}</td>
    </tr>)}</tbody>
   </table>
  </div>:<p role="status" className="rounded-xl border border-border p-5 text-sm">
   No matching identity or platform history was recorded for this administrator in the current college.
  </p>}
 </main>;
}
