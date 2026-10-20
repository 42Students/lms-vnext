"use client";

import Link from "next/link";
import {TpoGrid} from "@/components/tpo/grid/tpo-grid";
import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";

/** Employer-authorized, read-only round metadata; candidates/results never enter this sheet. */
export type HrRoundEditorSheetRow={
 id:string;
 sequence:number;
 name:string;
 kind:string;
 mode:string;
 status:string;
 duration:number|null;
 editable:boolean;
 editHref:string;
 removeHref:string;
};

const columns:readonly TpoGridColumn<HrRoundEditorSheetRow>[]=[
 {key:"sequence",label:"#",read:row=>row.sequence,sortKind:"number",
  sortValue:row=>row.sequence},
 {key:"name",label:"Round",read:row=>row.name},
 {key:"kind",label:"Type",read:row=>row.kind},
 {key:"mode",label:"Mode",read:row=>row.mode},
 {key:"duration",label:"Duration (minutes)",read:row=>row.duration,
  sortKind:"number",sortValue:row=>row.duration},
 {key:"status",label:"Status",read:row=>row.status},
 {key:"editable",label:"Editing",read:row=>row.editable?"Editable":"Read-only"},
];

/** The authenticated route owns authorization and sends only its already scoped round rows. */
export function HrRoundEditorGrid({rows,scopeKey}:{
 rows:readonly HrRoundEditorSheetRow[];
 scopeKey:string;
}){
 return <TpoGrid<HrRoundEditorSheetRow>
  rows={rows} columns={columns} rowKey={row=>row.id}
  storageKey={"hr-rounds:"+scopeKey}
  mobilePrimaryKeys={["sequence","name","kind","status"]}
  rowActions={row=>row.editable?<div className="flex flex-wrap items-center gap-2">
   <Link href={row.editHref} className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    Edit round
   </Link>
   <Link href={row.removeHref} className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    Review round removal
   </Link>
  </div>:null}
 />;
}
