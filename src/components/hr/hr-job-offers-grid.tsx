"use client";

import { TpoGrid } from "@/components/tpo/grid/tpo-grid";
import type { TpoGridColumn } from "@/modules/placements/tpo-grid-model";

/** Server-filtered, company-shared offer page. No client fetch or broader export. */
export type HrOfferSheetRow = {
  id:string;
  candidate:string;
  role:string;
  kind:string;
  ctcLpa:string;
  ctcSort:number|null;
  status:string;
  deadline:string;
  joining:string;
  joiningDate:string;
};

const columns:readonly TpoGridColumn<HrOfferSheetRow>[] = [
  {key:"candidate",label:"Candidate",read:row=>row.candidate+" · "+row.role},
  {key:"kind",label:"Type",read:row=>row.kind},
  {key:"ctc",label:"CTC (LPA)",read:row=>row.ctcLpa,
    sortKind:"number",sortValue:row=>row.ctcSort},
  {key:"status",label:"Status",read:row=>row.status},
  {key:"deadline",label:"Reply by",read:row=>row.deadline},
  {key:"joining",label:"Joining",read:row=>
    row.joining+" · "+row.joiningDate},
];

export function HrJobOffersGrid({rows,scopeKey}:{
  rows:readonly HrOfferSheetRow[];
  scopeKey:string;
}) {
  return <TpoGrid rows={rows} columns={columns} rowKey={row=>row.id}
    mobilePrimaryKeys={["candidate","kind","ctc","status","deadline"]}
    storageKey={"hr-offers:"+scopeKey}/>;
}
