"use client";
import { Dropdown } from "@/components/ui/dropdown";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import {ENGAGE_COLUMNS,type EngageColumn,type EngageSort} from "@/modules/placements/tpo-recruiter-table-view-model";
export function RecruiterRosterDisplayControls({columns,onColumns,sort,onSort,ascending,onAscending,showColumns=true}:{
 columns:readonly EngageColumn[];onColumns:(value:EngageColumn[])=>void;
 sort:EngageSort;onSort:(value:EngageSort)=>void;
 ascending:boolean;onAscending:(value:boolean)=>void;showColumns?:boolean;
}){
 return <section className="flex min-w-0 flex-wrap items-end gap-3 border-b border-border py-3"
  aria-label="Recruiter table display">
  <label className="min-w-0 flex-1 text-sm md:flex-none">Sort by
   <Select className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
    value={sort} onChange={e=>onSort(e.target.value as EngageSort)}>
    <option value="LAST_ACTIVITY">Last activity</option>
    <option value="NEXT_FOLLOWUP">Next follow-up</option>
    <option value="ADDED">Added</option>
    <option value="NAME">Name</option>
    <option value="DRIVES">Company drives</option>
   </Select>
  </label>
  <label className="flex min-h-11 items-center gap-2 text-sm">
   <Checkbox checked={ascending} onChange={e=>onAscending(e.target.checked)}/>
   Ascending
  </label>
  {showColumns?<Dropdown align="end" label="Roster columns" trigger="Columns">
   <div className="max-h-72 min-w-[min(13rem,calc(100vw_-_5rem))] max-w-full space-y-1 overflow-auto overscroll-contain">
    {ENGAGE_COLUMNS.map(column=><label key={column}
      className={"flex min-h-11 items-center gap-2 rounded-[var(--lms-control-radius)] px-2 py-1 text-sm transition-colors motion-reduce:transition-none "+
        (column==="Contact"?"cursor-not-allowed opacity-50":"hover:bg-muted active:bg-primary-subtle")}>
      <Checkbox checked={columns.includes(column)} disabled={column==="Contact"}
       onChange={e=>onColumns(e.target.checked?[...columns,column]:columns.filter(x=>x!==column))}/>
      {column}
    </label>)}
   </div>
  </Dropdown>:null}
 </section>;
}
