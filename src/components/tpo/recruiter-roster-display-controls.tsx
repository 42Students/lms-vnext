import { Select } from "@/components/ui/select";
"use client";
import {ENGAGE_COLUMNS,type EngageColumn,type EngageSort} from "@/modules/placements/tpo-recruiter-table-view-model";
export function RecruiterRosterDisplayControls({columns,onColumns,sort,onSort,ascending,onAscending}:{
 columns:readonly EngageColumn[];onColumns:(value:EngageColumn[])=>void;
 sort:EngageSort;onSort:(value:EngageSort)=>void;
 ascending:boolean;onAscending:(value:boolean)=>void;
}){
 return <section className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3"
  aria-label="Recruiter table display">
  <label className="text-sm">Sort by
   <Select className="mt-1 block min-h-10 rounded-[9px] border border-border bg-surface px-3"
    value={sort} onChange={e=>onSort(e.target.value as EngageSort)}>
    <option value="LAST_ACTIVITY">Last activity</option>
    <option value="NEXT_FOLLOWUP">Next follow-up</option>
    <option value="ADDED">Added</option>
    <option value="NAME">Name</option>
    <option value="DRIVES">Company drives</option>
   </Select>
  </label>
  <label className="flex items-center gap-2 text-sm">
   <input type="checkbox" checked={ascending} onChange={e=>onAscending(e.target.checked)}/>
   Ascending
  </label>
  <details className="relative">
   <summary className="min-h-10 cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-semibold">Columns</summary>
   <div className="absolute right-0 z-20 mt-1 max-h-72 min-w-52 space-y-2 overflow-auto rounded-lg border border-border bg-surface p-3 shadow-lg">
    {ENGAGE_COLUMNS.map(column=><label key={column} className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={columns.includes(column)} disabled={column==="Contact"}
       onChange={e=>onColumns(e.target.checked?[...columns,column]:columns.filter(x=>x!==column))}/>
      {column}
    </label>)}
   </div>
  </details>
 </section>;
}
