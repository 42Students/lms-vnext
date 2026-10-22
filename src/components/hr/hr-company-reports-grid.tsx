"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import type {MouseEvent} from "react";

import { TpoGrid } from "@/components/tpo/grid/tpo-grid";
import { StatusBadge } from "@/components/ui/status-badge";
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
      <StatusBadge className="ml-2" tone="neutral">{row.status}</StatusBadge>
      <span className="block text-xs text-muted-foreground">{row.employmentType.replaceAll("_"," ")}</span>
    </div>},
  {key:"status",label:"Status",read:row=>row.status,
    render:row=><Link href={driveHref(row)} aria-label={`Open drive ${row.title} status`}
      className="block w-full min-h-9 py-2 text-body hover:text-link">{row.status}</Link>},
  {key:"published",label:"Published",read:row=>row.published,
    render:row=><Link href={driveHref(row)} aria-label={`Open drive ${row.title} published date`}
      className="block w-full min-h-9 py-2 text-body hover:text-link">{row.published}</Link>},
  {key:"applied",label:"Applied",read:row=>row.applications,
    render:row=><Link href={driveHref(row)} aria-label={`Open drive ${row.title} applications`}
      className="block w-full min-h-9 py-2 text-body hover:text-link">{row.applications}</Link>,
    sortKind:"number",sortValue:row=>row.applications},
  {key:"submitted",label:"Submitted",read:row=>row.submittedApplications,
    render:row=><Link href={driveHref(row)}
      aria-label={"Open drive "+row.title+" submitted report"}
      className="block min-h-9 w-full py-2 text-body hover:text-link">
      {row.submittedApplications}</Link>,
    sortKind:"number",sortValue:row=>row.submittedApplications},
  {key:"withdrawn",label:"Withdrawn",read:row=>row.withdrawnApplications,
    render:row=><Link href={driveHref(row)}
      aria-label={"Open drive "+row.title+" withdrawn report"}
      className="block min-h-9 w-full py-2 text-body hover:text-link">
      {row.withdrawnApplications}</Link>,
    sortKind:"number",sortValue:row=>row.withdrawnApplications},
  {key:"offered",label:"Offered",read:row=>reportValue(offeredCount(row),row.reportUnavailable),
    render:row=><Link href={driveHref(row)}
      aria-label={"Open drive "+row.title+" offered report"}
      className="block min-h-9 w-full py-2 text-body hover:text-link">
      {reportValue(offeredCount(row),row.reportUnavailable)}</Link>,
    sortKind:"number",sortValue:row=>offeredCount(row)},
  {key:"accepted",label:"Accepted",read:row=>reportValue(row.acceptedOffers,row.reportUnavailable),
    render:row=><Link href={driveHref(row)}
      aria-label={"Open drive "+row.title+" accepted report"}
      className="block min-h-9 w-full py-2 text-body hover:text-link">
      {reportValue(row.acceptedOffers,row.reportUnavailable)}</Link>,
    sortKind:"number",sortValue:row=>row.reportUnavailable?null:row.acceptedOffers},
  {key:"declined",label:"Declined",read:row=>reportValue(row.declinedOffers,row.reportUnavailable),
    render:row=><Link href={driveHref(row)}
      aria-label={"Open drive "+row.title+" declined report"}
      className="block min-h-9 w-full py-2 text-body hover:text-link">
      {reportValue(row.declinedOffers,row.reportUnavailable)}</Link>,
    sortKind:"number",sortValue:row=>row.reportUnavailable?null:row.declinedOffers},
  {key:"joined",label:"Joined",read:row=>reportValue(row.joinedOffers,row.reportUnavailable),
    render:row=><Link href={driveHref(row)}
      aria-label={"Open drive "+row.title+" joined report"}
      className="block min-h-9 w-full py-2 text-body hover:text-link">
      {reportValue(row.joinedOffers,row.reportUnavailable)}</Link>,
    sortKind:"number",sortValue:row=>row.reportUnavailable?null:row.joinedOffers},
];

export function HrCompanyReportsGrid({rows,scopeKey}:{
  rows:readonly HrCompanyReportSheetRow[];
  scopeKey:string;
}) {
  const router=useRouter();
  function openFromRow(event:MouseEvent<HTMLDivElement>) {
    if(event.defaultPrevented || event.button!==0 ||
       event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;
    const target=event.target;
    if(!(target instanceof Element))return;
    // Native links and grid selection controls keep their own semantics.
    if(target.closest("a,button,input,select,textarea,[role=button],[role=checkbox]"))return;
    const rowElement=target.closest<HTMLElement>(".ag-row[row-id]");
    const id=rowElement?.getAttribute("row-id");
    const selected=id ? rows.find(row=>row.id===id) : null;
    if(selected)router.push(driveHref(selected));
  }
  return <div className="min-w-0 [&_.ag-row]:cursor-pointer"
    onClick={openFromRow} aria-label="Company hiring report">
    <TpoGrid rows={rows} rowKey={row=>row.id} columns={columns}
    storageKey={"hr-company-report:"+scopeKey}
    defaultVisibleKeys={["drive","applied","offered","accepted","declined","joined"]}
    mobilePrimaryKeys={["drive","applied","offered","accepted","declined","joined"]}
    rowActions={row=><div className="flex flex-wrap items-center gap-2">
      <Link href={driveHref(row)}
        className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Open drive
      </Link>
    </div>}/>
  </div>;
}
