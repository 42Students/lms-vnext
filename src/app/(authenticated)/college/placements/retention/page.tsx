import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable, type DataTableColumn} from "@/components/ui/data-table";
import {getCollegeApplicationRetentionReport} from "@/modules/placements/college-retention-report-service";
const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
export default async function CollegeRetentionPage(){
 const data=await getCollegeApplicationRetentionReport(await getCurrentRequestContext());
 const columns:DataTableColumn<(typeof data.rows)[number]>[]=[
  {key:"learner",header:"Learner",mobilePriority:"primary",cell:row=>row.learner??"Unnamed student"},
  {key:"drive",header:"Drive",cell:row=>row.jobTitle},
  {key:"application",header:"Application",cell:row=>row.status},
  {key:"screening",header:"Screening",cell:row=>row.screening??"Not reviewed"},
  {key:"changed",header:"Last changed",cell:row=>fmt.format(row.lastChange)},
 ];
 return <div className="space-y-6">
  <PageHeader eyebrow="College Admin · Placements" title="Data retention report"
   description="Rejected or withdrawn applications idle for 180+ days."
   actions={<Link href="/college/hiring-dashboard" className="font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-[var(--lms-control-height)] inline-flex items-center">Analytics</Link>}/>
  <section className="border-t border-border pt-5">
   <h2 className="text-lg font-semibold">Review candidates ({data.total})</h2>
   <p className="my-2 text-sm text-muted-foreground">Cutoff: {fmt.format(data.cutoff)} IST. {data.note}</p>
   <DataTable caption="Retention review candidates" rows={data.rows} columns={columns}
     getRowKey={row=>row.id} empty={<p role="status" className="text-sm text-body">No applications currently match the retention review criteria.</p>}/>
   {data.truncated?<p className="mt-3 text-xs text-muted-foreground">Showing the newest 200; narrow your retention review in the placement admin workspace.</p>:null}
  </section>
 </div>;
}
