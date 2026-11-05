import Link from "next/link";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {projectTpoReportRecordLinks,type TpoReportRecordLinkRow} from "@/modules/placements/tpo-report-record-links-model";
import { Heading } from "@/components/ui/heading";
export function TpoReportRecordLinks({
 kind,drives,companies,
}:{
 kind:"OFFERS"|"JOINING";
 drives:readonly TpoReportRecordLinkRow[];
 companies:readonly TpoReportRecordLinkRow[];
}){
 const data=projectTpoReportRecordLinks(drives,companies,kind);
 return <section aria-label="Report record drill-down" className="border-t border-border pt-5">
  <Heading level={2} size="base" className="text-[var(--lms-heading)] leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px]">Open the underlying records</Heading>
  <p className="mt-2 text-sm text-body leading-[22px]">Links open college-scoped recorded
   drives and company history. Company pages cover all seasons, not only this report filter.
   These are read-only navigation links; no offer or joining outcome is changed.</p>
  <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
   <div><Heading level={3} size="sm" className="text-[var(--lms-heading)]">Drives</Heading>
    {data.driveLinks.length===0?<EmptyState title="No drive records to open."/>:
     <ul className="mt-2 divide-y divide-border">{data.driveLinks.map(item=><li key={item.id} className="py-2">
      <Link href={item.href} className="inline-flex min-h-11 items-center break-words text-[13px] font-semibold text-[var(--lms-link-text)] hover:underline md:min-h-9">{item.name} · {item.company} →</Link>
     </li>)}</ul>}
    {data.drivesTruncated?<Alert tone="warning">Only the first 100 drive links are shown; use report filters to narrow the list.</Alert>:null}
   </div>
   <div><Heading level={3} size="sm" className="text-[var(--lms-heading)]">Companies</Heading>
    {data.companyLinks.length===0?<EmptyState title="No company records to open."/>:
     <ul className="mt-2 divide-y divide-border">{data.companyLinks.map(item=><li key={item.id} className="py-2">
      <Link href={item.href} className="inline-flex min-h-11 items-center break-words text-[13px] font-semibold text-[var(--lms-link-text)] hover:underline md:min-h-9">{item.name} →</Link>
     </li>)}</ul>}
    {data.companiesTruncated?<Alert tone="warning">Only the first 100 company links are shown; use report filters to narrow the list.</Alert>:null}
   </div>
  </div>
 </section>;
}
