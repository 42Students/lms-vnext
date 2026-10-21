"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TpoGrid } from "@/components/tpo/grid/tpo-grid";
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
  {key:"applied",label:"Applied",read:row=>row.applications,
    sortKind:"number",sortValue:row=>row.applications},
  {key:"submitted",label:"Submitted",read:row=>row.submittedApplications,
    sortKind:"number",sortValue:row=>row.submittedApplications},
  {key:"withdrawn",label:"Withdrawn",read:row=>row.withdrawnApplications,
    sortKind:"number",sortValue:row=>row.withdrawnApplications},
  {key:"offered",label:"Offered",read:row=>row.outstandingOffers+row.acceptedOffers+row.declinedOffers,
    sortKind:"number",sortValue:row=>row.outstandingOffers+row.acceptedOffers+row.declinedOffers},
  {key:"accepted",label:"Accepted",read:row=>row.acceptedOffers,
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
  const router = useRouter();
  return <TpoGrid rows={rows} rowKey={row=>row.id} columns={columns}
    storageKey={"hr-company-report:"+scopeKey}
    defaultVisibleKeys={["drive","applied","offered","accepted","declined","joined"]}
    mobilePrimaryKeys={["drive","applied","offered","accepted"]}
    openPrimary={{columnKey:"drive",ariaLabel:row=>"Open "+row.title+" drive",
      onOpen:row=>router.push("/hr/placements/jobs/"+encodeURIComponent(row.id))}}
    rowActions={row=><div className="flex flex-wrap items-center gap-2">
      <Link href={"/hr/placements/jobs/"+encodeURIComponent(row.id)}
        className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Open drive
      </Link>
    </div>}/>;
}
