"use client";

import {TpoGrid} from "@/components/tpo/grid/tpo-grid";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import { TextLink } from "@/components/ui/text-link";

/** A read-only view of only the authenticated recruiter's server-authorized proposals. */
export type HrProposalHistorySheetRow={
 id:string;
 title:string;
 reference:string;
 sentAt:string;
 sentAtMs:number;
 status:string;
 threadHref:string;
};

const columns:readonly TpoGridColumn<HrProposalHistorySheetRow>[]=[
 {key:"title",label:"Role",read:row=>row.title},
 {key:"reference",label:"Proposal reference",read:row=>row.reference},
 {key:"sentAt",label:"Sent for discussion",read:row=>row.sentAt,
  sortKind:"date",sortValue:row=>row.sentAtMs},
 {key:"status",label:"Status",read:row=>row.status},
];

export function HrProposalHistoryGrid({rows,scopeKey}:{
 rows:readonly HrProposalHistorySheetRow[];
 scopeKey:string;
}){
 return <TpoGrid<HrProposalHistorySheetRow>
  rows={rows} columns={columns} rowKey={row=>row.id}
  mobilePrimaryKeys={["title","reference","status"]}
  storageKey={"hr-proposals:"+scopeKey}
  rowActions={row=><TextLink href={row.threadHref}
   className="inline-flex min-h-11 md:min-h-9 items-center text-[13px] md:min-h-9">
    Open discussion
   </TextLink>}
 />;
}
