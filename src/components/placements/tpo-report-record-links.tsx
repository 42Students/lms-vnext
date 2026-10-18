import Link from "next/link";
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
  <h2 className="font-semibold text-foreground">Open the underlying records</h2>
  <p className="mt-2 text-sm leading-6 text-body">Links open college-scoped recorded
   drives and company history. Company pages cover all seasons, not only this report filter.
   These are read-only navigation links; no offer or joining outcome is changed.</p>
  <div className="mt-4 grid gap-5 md:grid-cols-2">
   <div><h3 className="text-sm font-semibold text-foreground">Drives</h3>
    {data.driveLinks.length===0?<p className="mt-2 text-sm text-body">No drive records to open.</p>:
     <ul className="mt-2 divide-y divide-border">{data.driveLinks.map(item=><li key={item.id} className="py-2">
      <Link href={item.href} className="inline-flex min-h-9 items-center break-words text-sm font-semibold text-primary-text hover:underline">{item.name} · {item.company} →</Link>
     </li>)}</ul>}
    {data.drivesTruncated?<p role="status" className="text-xs text-muted-foreground">Only the first 100 drive links are shown; use report filters to narrow the list.</p>:null}
   </div>
   <div><h3 className="text-sm font-semibold text-foreground">Companies</h3>
    {data.companyLinks.length===0?<p className="mt-2 text-sm text-body">No company records to open.</p>:
     <ul className="mt-2 divide-y divide-border">{data.companyLinks.map(item=><li key={item.id} className="py-2">
      <Link href={item.href} className="inline-flex min-h-9 items-center break-words text-sm font-semibold text-primary-text hover:underline">{item.name} →</Link>
     </li>)}</ul>}
    {data.companiesTruncated?<p role="status" className="text-xs text-muted-foreground">Only the first 100 company links are shown; use report filters to narrow the list.</p>:null}
   </div>
  </div>
 </section>;
}
