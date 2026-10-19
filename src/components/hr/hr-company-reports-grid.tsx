"use client";

import Link from "next/link";
import { TpoGrid } from "@/components/tpo/grid/tpo-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TpoGridColumn } from "@/modules/placements/tpo-grid-model";

/** Read-only, server-authorized and pagination-scoped company hiring totals. */
export type HrCompanyReportSheetRow = {
  id:string; title:string; employmentType:string; status:string; published:string;
  applications:number; submittedApplications:number; withdrawnApplications:number;
  outstandingOffers:number; acceptedOffers:number; declinedOffers:number; joinedOffers:number;
};

const columns: readonly TpoGridColumn<HrCompanyReportSheetRow>[] = [
  {key:"drive",label:"Drive",read:row=>row.title+" · "+row.employmentType.replaceAll("_"," ")},
  {key:"status",label:"Status",read:row=>row.status},
  {key:"published",label:"Published",read:row=>row.published},
  {key:"applied",label:"Applications",read:row=>row.applications,
    sortKind:"number",sortValue:row=>row.applications},
  {key:"submitted",label:"Submitted",read:row=>row.submittedApplications,
    sortKind:"number",sortValue:row=>row.submittedApplications},
  {key:"withdrawn",label:"Withdrawn",read:row=>row.withdrawnApplications,
    sortKind:"number",sortValue:row=>row.withdrawnApplications},
  {key:"offered",label:"Offered",read:row=>row.outstandingOffers+row.acceptedOffers+row.declinedOffers,
    sortKind:"number",sortValue:row=>row.outstandingOffers+row.acceptedOffers+row.declinedOffers},
  {key:"accepted",label:"Accepted offers",read:row=>row.acceptedOffers,
    sortKind:"number",sortValue:row=>row.acceptedOffers},
  {key:"declined",label:"Declined",read:row=>row.declinedOffers,
    sortKind:"number",sortValue:row=>row.declinedOffers},
  {key:"joined",label:"Joined",read:row=>row.joinedOffers,
    sortKind:"number",sortValue:row=>row.joinedOffers},
];

export function HrCompanyReportsGrid({rows,scopeKey}:{
  rows:readonly HrCompanyReportSheetRow[];
  scopeKey:string;
}) {
  return <TpoGrid rows={rows} rowKey={row=>row.id} columns={columns}
    storageKey={"hr-company-report:"+scopeKey}
    mobilePrimaryKeys={["drive","status","applied","offered"]}
    rowActions={row=><div className="flex flex-wrap items-center gap-2">
      <StatusBadge tone={row.status==="PUBLISHED"?"success":"neutral"}>{row.status}</StatusBadge>
      <Link href={"/hr/placements/jobs/"+encodeURIComponent(row.id)}
        className="inline-flex min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        Open drive
      </Link>
    </div>}/>;
}
