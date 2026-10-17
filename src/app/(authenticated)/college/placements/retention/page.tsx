import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {getCollegeApplicationRetentionReport} from "@/modules/placements/college-retention-report-service";
const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
export default async function CollegeRetentionPage(){
 const data=await getCollegeApplicationRetentionReport(await getCurrentRequestContext());
 return <div className="space-y-6">
  <PageHeader eyebrow="College Admin · Placements" title="Data retention report"
   description="Rejected or withdrawn applications idle for 180+ days."
   actions={<Link href="/college/hiring-dashboard" className="font-semibold text-primary-text underline">Analytics</Link>}/>
  <section className="rounded-xl border border-border bg-surface p-5">
   <h2 className="text-lg font-semibold">Review candidates ({data.total})</h2>
   <p className="my-2 text-sm text-muted-foreground">Cutoff: {fmt.format(data.cutoff)} IST. {data.note}</p>
   {!data.rows.length?<p>No applications currently match the retention review criteria.</p>:
   <div className="overflow-x-auto"><table className="w-full min-w-[45rem] text-left text-sm">
    <thead><tr className="border-b border-border"><th className="p-3">Learner</th>
     <th className="p-3">Drive</th><th className="p-3">Application</th>
     <th className="p-3">Screening</th><th className="p-3">Last changed</th></tr></thead>
    <tbody>{data.rows.map(row=><tr key={row.id} className="border-b border-border">
      <td className="p-3">{row.learner??"Unnamed student"}</td>
      <td className="p-3">{row.jobTitle}</td>
      <td className="p-3">{row.status}</td><td className="p-3">{row.screening??"Not reviewed"}</td>
      <td className="p-3">{fmt.format(row.lastChange)}</td></tr>)}</tbody>
   </table></div>}
   {data.truncated?<p className="mt-3 text-xs text-muted-foreground">Showing the newest 200; narrow your retention review in the placement admin workspace.</p>:null}
  </section>
 </div>;
}
