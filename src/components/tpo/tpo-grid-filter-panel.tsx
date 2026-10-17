"use client";
import {useRouter,usePathname,useSearchParams} from "next/navigation";
import {updateTpoGridQuery} from "@/modules/placements/tpo-grid-model";
import {activeTpoGridFilterCount,invalidTpoGridFilterValue,resolvedTpoGridFilterValue} from "@/modules/placements/tpo-grid-filter-state";
import {clearTpoGridFilters} from "@/modules/placements/tpo-grid-filter-reset";
export type TpoFilterField={key:string;label:string;urlKey?:string;allValue?:string;options:readonly {value:string;label:string}[]};
export function TpoGridFilterPanel({fields,mobileSheet=false}:{fields:readonly TpoFilterField[];mobileSheet?:boolean}){
 const router=useRouter(),pathname=usePathname(),query=useSearchParams();
 const activeCount=activeTpoGridFilterCount(new URLSearchParams(query.toString()),fields);
 function update(field:TpoFilterField,value:string){
  const key=field.urlKey??"filter."+field.key;
  const params=updateTpoGridQuery(new URLSearchParams(query.toString()),{[key]:value===field.allValue?"":value});
  router.replace(pathname+(params.size?"?"+params.toString():""));
 }
 const chips=fields.flatMap(field=>{
   const key=field.urlKey??"filter."+field.key,raw=query.get(key);
   if(!raw||raw===field.allValue)return [];
   const chosen=field.options.find(option=>option.value===raw);
   return [{key,label:field.label+": "+(chosen?.label??"Unknown filter"),field}];
 });
 const content=<>
  <div className="flex flex-wrap gap-2" role="group" aria-label="Active student filters">
   {chips.map(chip=><button key={chip.key} type="button" onClick={()=>update(chip.field,"")}
    className="min-h-10 rounded-full border border-border px-3 text-xs font-semibold text-primary-text"
    aria-label={"Remove "+chip.label}>{chip.label} ×</button>)}
  </div>
  <h2 className="font-semibold">Filter students</h2>
  <p role="status" className="text-xs text-muted-foreground">{activeCount} active {activeCount===1?"filter":"filters"}</p>
  {fields.map(field=><label key={field.key} className="block text-sm">{field.label}
   <select className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-2" value={resolvedTpoGridFilterValue(query.get(field.urlKey??"filter."+field.key),field)} onChange={event=>update(field,event.target.value)}>
    <option value={field.allValue??""}>All</option>{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
   </select>
   {invalidTpoGridFilterValue(query.get(field.urlKey??"filter."+field.key),field)&&<span role="alert" className="mt-1 block text-xs text-warning">Unknown saved filter value. Clear grid filters to recover.</span>}
  </label>)}
  {fields.some(field=>query.has(field.urlKey??"filter."+field.key))&&<button type="button"
   onClick={()=>{const next=clearTpoGridFilters(new URLSearchParams(query.toString()),fields);router.replace(pathname+(next.size?"?"+next.toString():""));}}
   className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text">Clear all</button>}
 </>;
 const wrapper="w-full min-w-0 space-y-3 rounded-lg border border-border bg-surface p-3";
 return mobileSheet?<div className="w-full min-w-0">
  <details className="rounded-lg border border-border bg-surface p-3 md:hidden open:fixed open:inset-x-0 open:bottom-0 open:z-50 open:max-h-[85vh] open:overflow-y-auto open:rounded-t-xl">
    <summary className="min-h-11 cursor-pointer font-semibold">Filter students ({activeCount})</summary>
    <aside aria-label="Filter students" className={wrapper}>{content}</aside>
  </details>
  <aside aria-label="Grid filters" className={wrapper+" hidden md:block"}>{content}</aside>
 </div>:<aside aria-label="Grid filters" className={wrapper}>{content}</aside>;
}
