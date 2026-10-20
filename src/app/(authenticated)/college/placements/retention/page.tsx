import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable, type DataTableColumn} from "@/components/ui/data-table";
import {EmptyState} from "@/components/ui/empty-state";
import {StatusBadge} from "@/components/ui/status-badge";
import {getCollegeApplicationRetentionReport} from "@/modules/placements/college-retention-report-service";
const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
export default async function CollegeRetentionPage(){
 const data=await getCollegeApplicationRetentionReport(await getCurrentRequestContext());
 const columns:DataTableColumn<(typeof data.rows)[number]>[]=[
  {key:"learner",header:"Learner",mobilePriority:"primary",cell:row=><strong className="break-words [overflow-wrap:anywhere]">{row.learner??"Unnamed student"}</strong>},
  {key:"drive",header:"Drive",cell:row=><span className="break-words [overflow-wrap:anywhere]">{row.jobTitle}</span>},
  {key:"application",header:"Application",cell:row=><StatusBadge tone={row.status==="WITHDRAWN"?"warning":"neutral"}>{row.status}</StatusBadge>},
  {key:"screening",header:"Screening",cell:row=>row.screening??"Not reviewed"},
  {key:"changed",header:"Last changed",cell:row=>fmt.format(row.lastChange)},
 ];
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader title="Data retention report"
   description="Rejected or withdrawn applications idle for 180+ days."
   actions={<Link href="/college/hiring-dashboard" className="font-semibold text-link underline min-h-11 inline-flex items-center lms-inline-link md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1]">Analytics</Link>}/>
  <section className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
   <h2 className="font-semibold text-[16px] leading-6 text-[var(--lms-heading)] md:text-[18px]">Review candidates ({data.total})</h2>
   <p className="my-[var(--lms-space-3)] max-w-[85ch] break-words text-sm leading-6 text-muted-foreground">Cutoff: {fmt.format(data.cutoff)} IST. {data.note}</p>
   <DataTable caption="Retention review candidates" rows={data.rows} columns={columns}
     getRowKey={row=>row.id} empty={<EmptyState title="No applications to review" description="No applications currently match the retention review criteria." />}/>
   {data.truncated?<p className="mt-[var(--lms-space-3)] max-w-[85ch] break-words text-xs leading-5 text-muted-foreground">Showing the newest 200; narrow your retention review in the placement admin workspace.</p>:null}
  </section>
 </div>;
}
