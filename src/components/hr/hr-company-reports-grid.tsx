"use client";

import Link from "next/link";

import { TpoGrid } from "@/components/tpo/grid/tpo-grid";
import type { TpoGridColumn } from "@/modules/placements/tpo-grid-model";

/** Read-only, server-authorized and pagination-scoped company hiring totals. */
export type HrCompanyReportSheetRow = {
  id:string; title:string; employmentType:string; status:string; published:string;
  applications:number; submittedApplications:number; withdrawnApplications:number;
  outstandingOffers:number|null; acceptedOffers:number|null;
  declinedOffers:number|null; joinedOffers:number|null;
  reportUnavailable?:boolean;
};

/** Missing totals must never look like verified zero counts. */
function offeredCount(row:HrCompanyReportSheetRow):number|null {
  if(row.reportUnavailable||row.outstandingOffers===null||
    row.acceptedOffers===null||row.declinedOffers===null)return null;
  return row.outstandingOffers+row.acceptedOffers+row.declinedOffers;
}
function reportValue(value:number|null,unavailable?:boolean) {
  return unavailable||value===null?"Unavailable":value;
}
const driveHref=(row:HrCompanyReportSheetRow)=>"/hr/placements/jobs/"+encodeURIComponent(row.id);

const columns: readonly TpoGridColumn<HrCompanyReportSheetRow>[] = [
  {key:"drive",label:"Drive",read:row=>row.title+" · "+row.status,
    render:row=><div className="min-w-0 space-y-1">
      <Link href={driveHref(row)} className="inline-flex min-h-9 items-center font-semibold text-link underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label={`Open drive ${row.title}`}>{row.title}</Link>
      <span className="ml-2 inline-flex rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-body">{row.status}</span>
      <span className="block text-xs text-muted-foreground">{row.employmentType.replaceAll("_"," ")}</span>
    </div>},
  {key:"status",label:"Status",read:row=>row.status},
  {key:"published",label:"Published",read:row=>row.published},
  {key:"applied",label:"Applied",read:row=>row.applications,
    sortKind:"number",sortValue:row=>row.applications},
  {key:"submitted",label:"Submitted",read:row=>row.submittedApplications,
    sortKind:"number",sortValue:row=>row.submittedApplications},
  {key:"withdrawn",label:"Withdrawn",read:row=>row.withdrawnApplications,
    sortKind:"number",sortValue:row=>row.withdrawnApplications},
  {key:"offered",label:"Offered",read:row=>reportValue(offeredCount(row),row.reportUnavailable),
    sortKind:"number",sortValue:row=>offeredCount(row)},
  {key:"accepted",label:"Accepted",read:row=>reportValue(row.acceptedOffers,row.reportUnavailable),
    sortKind:"number",sortValue:row=>row.reportUnavailable?null:row.acceptedOffers},
  {key:"declined",label:"Declined",read:row=>reportValue(row.declinedOffers,row.reportUnavailable),
    sortKind:"number",sortValue:row=>row.reportUnavailable?null:row.declinedOffers},
  {key:"joined",label:"Joined",read:row=>reportValue(row.joinedOffers,row.reportUnavailable),
    sortKind:"number",sortValue:row=>row.reportUnavailable?null:row.joinedOffers},
];

export function HrCompanyReportsGrid({rows,scopeKey}:{
  rows:readonly HrCompanyReportSheetRow[];
  scopeKey:string;
}) {
  return <TpoGrid rows={rows} rowKey={row=>row.id} columns={columns}
    storageKey={"hr-company-report:"+scopeKey}
    defaultVisibleKeys={["drive","status","published","applied","offered","accepted"]}
    mobilePrimaryKeys={["drive","status","published","applied","offered","accepted"]}
    rowActions={row=><div className="flex flex-wrap items-center gap-2">
      <Link href={driveHref(row)}
        className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Open drive
      </Link>
    </div>}/>;
}
