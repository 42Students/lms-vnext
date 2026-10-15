"use client";
import {useRouter,usePathname,useSearchParams} from "next/navigation";
import {updateTpoGridQuery} from "@/modules/placements/tpo-grid-model";
import {clearTpoGridFilters} from "@/modules/placements/tpo-grid-filter-reset";
export type TpoFilterField={key:string;label:string;urlKey?:string;allValue?:string;options:readonly {value:string;label:string}[]};
export function TpoGridFilterPanel({fields}:{fields:readonly TpoFilterField[]}){
 const router=useRouter(),pathname=usePathname(),query=useSearchParams();
 function update(field:TpoFilterField,value:string){
  const key=field.urlKey??"filter."+field.key;
  const params=updateTpoGridQuery(new URLSearchParams(query.toString()),{[key]:value===field.allValue?"":value});
  router.replace(pathname+(params.size?"?"+params.toString():""));
 }
 return <aside aria-label="Grid filters" className="w-full min-w-0 space-y-3 rounded-lg border border-border bg-surface p-3">
  <h2 className="font-semibold">Filters</h2>
  {fields.map(field=><label key={field.key} className="block text-sm">{field.label}
   <select className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-2" value={query.get(field.urlKey??"filter."+field.key)??field.allValue??""} onChange={event=>update(field,event.target.value)}>
    <option value={field.allValue??""}>All</option>{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
   </select>
  </label>)}
  {fields.some(field=>query.has(field.urlKey??"filter."+field.key))&&<button type="button"
   onClick={()=>{const next=clearTpoGridFilters(new URLSearchParams(query.toString()),fields);router.replace(pathname+(next.size?"?"+next.toString():""));}}
   className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text">Clear grid filters</button>}
 </aside>;
}
