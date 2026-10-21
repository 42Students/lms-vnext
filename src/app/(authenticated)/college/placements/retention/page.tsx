import Link from "next/link";
import {z} from "zod";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable, type DataTableColumn} from "@/components/ui/data-table";
import {EmptyState} from "@/components/ui/empty-state";
import {StatusBadge} from "@/components/ui/status-badge";
import {getCollegeApplicationRetentionReport} from "@/modules/placements/college-retention-report-service";
const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
type Filters=Record<string,string|string[]|undefined>;
const retentionFilters=z.strictObject({
 olderThanDays:z.coerce.number().int().min(1).max(3650).default(365),
 page:z.coerce.number().int().min(1).max(100000).default(1),
});
export default async function CollegeRetentionPage({searchParams}:{searchParams:Promise<Filters>}){
 const parsed=retentionFilters.safeParse(await searchParams);
 if(!parsed.success)return <div className="min-w-0 space-y-4">
   <PageHeader title="Data retention report"/>
   <ErrorState title="Invalid retention filters" description="Choose a threshold between 1 and 3650 days and a valid page."
     action={<Link href="/college/placements/retention" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Clear filters</Link>}/>
 </div>;
 const {olderThanDays,page}=parsed.data;
 const data=await getCollegeApplicationRetentionReport(await getCurrentRequestContext(),{olderThanDays,page});
 const columns:DataTableColumn<(typeof data.rows)[number]>[]=[
  {key:"learner",header:"Learner",mobilePriority:"primary",cell:row=><strong className="break-words [overflow-wrap:anywhere]">{row.learner??"Unnamed student"}</strong>},
  {key:"drive",header:"Drive",cell:row=><span className="break-words [overflow-wrap:anywhere]">{row.jobTitle}</span>},
  {key:"application",header:"Application",cell:row=><StatusBadge tone={row.status==="WITHDRAWN"?"warning":"neutral"}>{row.status}</StatusBadge>},
  {key:"screening",header:"Screening",cell:row=>row.screening??"Not reviewed"},
  {key:"changed",header:"Last changed",cell:row=>fmt.format(row.lastChange)},
 ];
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader title="Data retention report"
   description={`Rejected or withdrawn applications idle for ${data.days}+ days. Legacy default: 365 days.`}
   actions={<Link href="/college/hiring-dashboard" className="font-semibold text-link underline min-h-11 inline-flex items-center lms-inline-link md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto justify-center">Analytics</Link>}/>
  <p role="status" className="text-sm text-muted-foreground">Data retention report retrieved · Threshold: {data.days} days.</p>
  <form method="get" className="flex flex-wrap items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
   <label className="grid min-w-0 gap-2 text-sm font-semibold text-body">Older than (days)
    <Input type="number" name="olderThanDays" min={1} max={3650} step={1}
      defaultValue={data.days} required className="w-44 min-h-11 md:min-h-9" />
   </label>
   <Button type="submit" variant="secondary">Apply</Button>
  </form>
  <section className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
   <h2 className="font-semibold text-[16px] leading-6 text-[var(--lms-heading)] md:text-[18px]">Review candidates ({data.total.toLocaleString("en-IN")})</h2>
   <p className="my-[var(--lms-space-3)] max-w-[85ch] break-words text-sm leading-[22px] text-muted-foreground">Cutoff: {fmt.format(data.cutoff)} IST. {data.note}</p>
   <DataTable caption="Retention review candidates" rows={data.rows} columns={columns}
     getRowKey={row=>row.id} empty={<EmptyState title="No applications to review" description="No applications currently match the retention review criteria." />}/>
   <nav aria-label="Retention report pages" className="mt-[var(--lms-space-3)] flex flex-wrap items-center justify-between gap-3 text-sm">
     <span>Page {data.page.toLocaleString("en-IN")} of {data.pageCount.toLocaleString("en-IN")} · {data.total.toLocaleString("en-IN")} records</span>
     <span className="flex items-center gap-3">
       {data.page>1?<Link href={`/college/placements/retention?olderThanDays=${data.days}&page=${data.page-1}`} className="font-semibold text-link underline">Previous</Link>:null}
       {data.truncated?<Link href={`/college/placements/retention?olderThanDays=${data.days}&page=${data.page+1}`} className="font-semibold text-link underline">Next</Link>:null}
     </span>
   </nav>
  </section>
 </div>;
}
