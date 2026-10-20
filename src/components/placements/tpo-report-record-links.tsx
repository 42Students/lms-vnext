import Link from "next/link";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {projectTpoReportRecordLinks,type TpoReportRecordLinkRow} from "@/modules/placements/tpo-report-record-links-model";
export function TpoReportRecordLinks({
 kind,drives,companies,
}:{
 kind:"OFFERS"|"JOINING";
 drives:readonly TpoReportRecordLinkRow[];
 companies:readonly TpoReportRecordLinkRow[];
}){
 const data=projectTpoReportRecordLinks(drives,companies,kind);
 return <section aria-label="Report record drill-down" className="border-t border-border pt-5">
  <h2 className="text-[16px] font-semibold leading-[26px] text-foreground min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">Open the underlying records</h2>
  <p className="mt-2 text-sm leading-6 text-body">Links open college-scoped recorded
   drives and company history. Company pages cover all seasons, not only this report filter.
   These are read-only navigation links; no offer or joining outcome is changed.</p>
  <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
   <div><h3 className="text-sm font-semibold text-foreground">Drives</h3>
    {data.driveLinks.length===0?<EmptyState title="No drive records to open."/>:
     <ul className="mt-2 divide-y divide-border">{data.driveLinks.map(item=><li key={item.id} className="py-2">
      <Link href={item.href} className="inline-flex min-h-11 items-center break-words text-[13px] font-semibold text-[var(--lms-link-text)] hover:underline min-[768px]:min-h-9">{item.name} · {item.company} →</Link>
     </li>)}</ul>}
    {data.drivesTruncated?<Alert tone="warning">Only the first 100 drive links are shown; use report filters to narrow the list.</Alert>:null}
   </div>
   <div><h3 className="text-sm font-semibold text-foreground">Companies</h3>
    {data.companyLinks.length===0?<EmptyState title="No company records to open."/>:
     <ul className="mt-2 divide-y divide-border">{data.companyLinks.map(item=><li key={item.id} className="py-2">
      <Link href={item.href} className="inline-flex min-h-11 items-center break-words text-[13px] font-semibold text-[var(--lms-link-text)] hover:underline min-[768px]:min-h-9">{item.name} →</Link>
     </li>)}</ul>}
    {data.companiesTruncated?<Alert tone="warning">Only the first 100 company links are shown; use report filters to narrow the list.</Alert>:null}
   </div>
  </div>
 </section>;
}
