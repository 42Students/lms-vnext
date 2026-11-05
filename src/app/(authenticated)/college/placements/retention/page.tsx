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
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { istDateFormatter } from "@/lib/format-date";
import { formatNumberIN } from "@/lib/safe-format";
const fmt=istDateFormatter;
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
     action={<TextLink href="/college/placements/retention" className="inline-flex min-h-11 items-center md:min-h-9">Clear filters</TextLink>}/>
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
   actions={<TextLink href="/college/hiring-dashboard" className="min-h-11 inline-flex items-center md:min-h-9 w-full md:w-auto justify-center">Analytics</TextLink>}/>
  <p role="status" className="text-sm text-muted-foreground">Data retention report retrieved · Threshold: {data.days} days.</p>
  <form method="get" className="flex flex-wrap items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
   <Label stack className="min-w-0">Older than (days)
    <Input type="number" name="olderThanDays" min={1} max={3650} step={1}
      defaultValue={data.days} required className="w-44 min-h-11 md:min-h-9" />
   </Label>
   <Button type="submit" variant="secondary">Apply</Button>
  </form>
  <section className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
   <Heading level={2} size="base" className="leading-6 text-[var(--lms-heading)] md:text-[18px]">Review candidates ({formatNumberIN(data.total)})</Heading>
   <p className="my-[var(--lms-space-3)] max-w-[85ch] break-words text-sm leading-[22px] text-muted-foreground">Cutoff: {fmt.format(data.cutoff)} IST. {data.note}</p>
   <DataTable caption="Retention review candidates" rows={data.rows} columns={columns}
     getRowKey={row=>row.id} empty={<EmptyState title="No applications to review" description="No applications currently match the retention review criteria." />}/>
   <nav aria-label="Retention report pages" className="mt-[var(--lms-space-3)] flex flex-wrap items-center justify-between gap-3 text-sm">
     <span>Page {formatNumberIN(data.page)} of {formatNumberIN(data.pageCount)} · {formatNumberIN(data.total)} records</span>
     <span className="flex items-center gap-3">
       {data.page>1?<TextLink href={`/college/placements/retention?olderThanDays=${data.days}&page=${data.page-1}`}>Previous</TextLink>:null}
       {data.truncated?<TextLink href={`/college/placements/retention?olderThanDays=${data.days}&page=${data.page+1}`}>Next</TextLink>:null}
     </span>
   </nav>
  </section>
 </div>;
}
