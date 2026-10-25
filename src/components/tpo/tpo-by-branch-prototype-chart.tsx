import {tpoBranchChartPercent} from "@/modules/placements/tpo-branch-report-view-model";

export type TpoBranchChartRow={
 departmentName:string;
 registered:number;
 placed:number;
 placementRatePercent:number|null;
};

/** Prototype-style branch rails with truthful proportions: 100% is always
 * the whole registered cohort, not the largest branch on this page.
 * We deliberately omit the screenshot's speculative "offer waiting" segment:
 * an offer count is not a distinct count of students awaiting an offer. */
export function TpoByBranchPrototypeChart({rows}:{
 rows:readonly TpoBranchChartRow[];
}){
 const safe=rows.filter(row=>typeof row.departmentName==="string"&&row.departmentName.trim().length>0);
 const format=new Intl.NumberFormat("en-IN");
 return <figure aria-label="Placement rate by branch" className="min-w-0 rounded-xl border border-[#e7ecf2] bg-white p-4 md:p-5"
  data-testid="tpo.report.branch.chart">
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
   <figcaption className="text-xs font-bold uppercase tracking-wide text-[#617084]">Placed, of registered students</figcaption>
   <span className="inline-flex items-center gap-2 text-xs text-[#617084]">
    <span className="inline-block size-3 rounded-sm bg-[#087f8b]" aria-hidden="true"/> Placed
   </span>
  </div>
  {safe.length?<ol className="space-y-3">
   {safe.map(row=>{
    const percent=tpoBranchChartPercent(row.placed,row.registered,row.placementRatePercent);
    return <li key={row.departmentName} className="grid min-w-0 items-center gap-2 sm:grid-cols-[minmax(70px,110px)_minmax(0,1fr)_minmax(105px,175px)]">
     <span className="truncate text-sm font-semibold text-[#26354a]" title={row.departmentName}>{row.departmentName}</span>
     <div className="h-5 w-full overflow-hidden rounded bg-[#eef2f6]"
      role={percent===null?undefined:"progressbar"}
      aria-label={percent===null?undefined:row.departmentName+" placement rate"}
      aria-valuemin={percent===null?undefined:0}
      aria-valuemax={percent===null?undefined:100}
      aria-valuenow={percent===null?undefined:percent}>
      {percent!==null?<div className="h-full rounded bg-[#087f8b]" style={{width:percent+"%"}}/>:null}
     </div>
     <span className="text-right text-[13px] tabular-nums text-[#26354a]">
      {percent===null?"Rate unavailable":percent+"% · "+format.format(row.placed)+" of "+format.format(row.registered)}
     </span>
    </li>;
   })}
  </ol>:<p role="status" className="py-5 text-sm text-[#617084]">
   No verified branch placement data is available for these report filters.
  </p>}
  <p className="mt-4 border-t border-[#e7ecf2] pt-3 text-xs leading-5 text-[#617084]">
   Rates are measured against registered learners. Offer totals are shown in the table below,
   not overlaid as students waiting: one learner can hold multiple offers.
  </p>
 </figure>;
}
