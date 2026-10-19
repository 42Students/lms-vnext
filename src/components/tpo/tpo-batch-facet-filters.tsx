"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {useState} from "react";
import {filterTpoBatchFacets,type TpoBatchFacetQuery,type TpoBatchFacetRow,type TpoBatchFacetState} from "@/modules/placements/tpo-batch-facets-model";
type Row=TpoBatchFacetRow;
export function TpoBatchFacetFilters({rows,initial,baseQuery}:{rows:readonly Row[];
 initial:TpoBatchFacetQuery;baseQuery:Readonly<Record<string,string>>}){
 const [selected,setSelected]=useState(initial);
 const allYears=[...new Set(rows.flatMap(row=>row.endYear===null?[]:[row.endYear]))].sort((a,b)=>b-a);
 const programs=[...new Set(rows.map(row=>row.program))].sort();
 const departments=[...new Set(rows.map(row=>row.department))].sort();
 function toggleState(value:TpoBatchFacetState){
  setSelected(previous=>({...previous,states:previous.states.includes(value)?
   previous.states.filter(x=>x!==value):[...previous.states,value]}));
 }
 function toggleProgram(value:string){
  setSelected(previous=>({...previous,programs:previous.programs.includes(value)?
   previous.programs.filter(x=>x!==value):[...previous.programs,value]}));
 }
 function toggleDepartment(value:string){
  setSelected(previous=>({...previous,departments:previous.departments.includes(value)?
   previous.departments.filter(x=>x!==value):[...previous.departments,value]}));
 }
 function toggleYear(value:number){
  setSelected(previous=>({...previous,finalYears:previous.finalYears.includes(value)?
   previous.finalYears.filter(x=>x!==value):[...previous.finalYears,value]}));
 }
 const active=[...selected.states.map(value=>({key:"state",label:value,remove:()=>toggleState(value)})),
  ...selected.programs.map(value=>({key:"program",label:value,remove:()=>toggleProgram(value)})),
  ...selected.departments.map(value=>({key:"department",label:value,remove:()=>toggleDepartment(value)})),
  ...selected.finalYears.map(value=>({key:"final-year",label:String(value),remove:()=>toggleYear(value)}))];
 const count=filterTpoBatchFacets(rows,selected).length;
 const facetCount=(next:TpoBatchFacetQuery)=>filterTpoBatchFacets(rows,next).length;
 return <details className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3">
  <summary className="min-h-10 cursor-pointer text-sm font-semibold">Filters · State, Department, Program, Final year</summary>
  <form action="/tpo/batches" method="get" className="mt-3 space-y-3">
   {Object.entries(baseQuery).filter(([,value])=>Boolean(value)).map(([key,value])=>
    <input key={key} type="hidden" name={key} value={value}/>)}
   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <fieldset className="space-y-1"><legend className="font-semibold text-sm">State</legend>
     {(["In placements","Not started","Finished"] as const).map(value=>
      <label key={value} className="flex min-h-9 items-center gap-2 text-sm">
       <Checkbox name="facetState" value={value} checked={selected.states.includes(value)}
        onChange={()=>toggleState(value)}/>
       {value} ({facetCount({...selected,states:[...new Set([...selected.states,value])]})})
      </label>)}
    </fieldset>
    <fieldset className="space-y-1"><legend className="font-semibold text-sm">Department</legend>
     {departments.map(value=><label key={value} className="flex min-h-9 items-center gap-2 text-sm">
      <Checkbox name="facetDepartment" value={value} checked={selected.departments.includes(value)}
       onChange={()=>toggleDepartment(value)}/>
      {value} ({facetCount({...selected,departments:[...new Set([...selected.departments,value])]})})
     </label>)}
    </fieldset>
    <fieldset className="space-y-1"><legend className="font-semibold text-sm">Program</legend>
     {programs.map(value=><label key={value} className="flex min-h-9 items-center gap-2 text-sm">
      <Checkbox name="facetProgram" value={value} checked={selected.programs.includes(value)}
       onChange={()=>toggleProgram(value)}/>
      {value} ({facetCount({...selected,programs:[...new Set([...selected.programs,value])]})})
     </label>)}
    </fieldset>
    <fieldset className="space-y-1"><legend className="font-semibold text-sm">Final year</legend>
     {allYears.map(value=><label key={value} className="flex min-h-9 items-center gap-2 text-sm">
      <Checkbox name="facetFinalYear" value={value} checked={selected.finalYears.includes(value)}
       onChange={()=>toggleYear(value)}/>
      {value} ({facetCount({...selected,finalYears:[...new Set([...selected.finalYears,value])]})})
     </label>)}
    </fieldset>
   </div>
   <div role="status" aria-live="polite" className="flex flex-wrap items-center gap-2 text-sm">
    {active.map((chip,index)=><Button variant="secondary" key={chip.key+":"+chip.label+":"+index} type="button"
     onClick={chip.remove}  aria-label={"Remove "+chip.label+" filter"}>
     {chip.label} ×
    </Button>)}
    <span>{count} matching batches</span>
   </div>
   <div className="flex flex-wrap gap-2 text-sm">
    <Button variant="secondary" type="button" onClick={()=>setSelected({states:[],programs:[],departments:[],finalYears:[]})}
     >Reset</Button>
    <Link href="/tpo/batches" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3">Clear all</Link>
    <Button type="submit" >Show {count}</Button>
   </div>
  </form>
 </details>;
}
