"use client";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {useRouter,usePathname,useSearchParams} from "next/navigation";
import {useState} from "react";
import {BottomSheet} from "@/components/ui/bottom-sheet";
import {updateTpoGridQuery} from "@/modules/placements/tpo-grid-model";
import {activeTpoGridFilterCount,invalidTpoGridFilterValue,resolvedTpoGridFilterValue} from "@/modules/placements/tpo-grid-filter-state";
import {clearTpoGridFilters} from "@/modules/placements/tpo-grid-filter-reset";
export type TpoFilterField={key:string;label:string;urlKey?:string;allValue?:string;options:readonly {value:string;label:string}[]};
export function TpoGridFilterPanel({fields,mobileSheet=false}:{fields:readonly TpoFilterField[];mobileSheet?:boolean}){
 const router=useRouter(),pathname=usePathname(),query=useSearchParams();
 const [sheetOpen,setSheetOpen]=useState(false);
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
   {chips.map(chip=><Button variant="secondary" key={chip.key} type="button" onClick={()=>update(chip.field,"")}
    className="rounded-full text-xs"
    aria-label={"Remove "+chip.label}>{chip.label} ×</Button>)}
  </div>
  <h2 className={mobileSheet?"hidden font-semibold md:block":"font-semibold"}>Filter students</h2>
  <p role="status" className="text-xs text-muted-foreground">{activeCount} active {activeCount===1?"filter":"filters"}</p>
  {fields.map(field=><label key={field.key} className="block text-sm">{field.label}
   <Select className="mt-1 text-base sm:text-sm" value={resolvedTpoGridFilterValue(query.get(field.urlKey??"filter."+field.key),field)} onChange={event=>update(field,event.target.value)}>
    <option value={field.allValue??""}>All</option>{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
   </Select>
   {invalidTpoGridFilterValue(query.get(field.urlKey??"filter."+field.key),field)&&<span role="alert" className="mt-1 block text-xs text-warning">Unknown saved filter value. Clear grid filters to recover.</span>}
  </label>)}
  {fields.some(field=>query.has(field.urlKey??"filter."+field.key))&&<Button variant="secondary" type="button"
   onClick={()=>{const next=clearTpoGridFilters(new URLSearchParams(query.toString()),fields);router.replace(pathname+(next.size?"?"+next.toString():""));}}
   >Clear all</Button>}
 </>;
 const wrapper="w-full min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3";
 return mobileSheet?<div className="w-full min-w-0">
  <Button variant="secondary" type="button" aria-expanded={sheetOpen} aria-controls="tpo-grid-student-filters"
   onClick={()=>setSheetOpen(true)}
   className="md:hidden">
   Filter students ({activeCount})
  </Button>
  <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Filter students">
   <div id="tpo-grid-student-filters" aria-label="Filter students" className={wrapper}>{content}</div>
  </BottomSheet>
  <aside aria-label="Grid filters" className={wrapper+" hidden md:block"}>{content}</aside>
 </div>:<aside aria-label="Grid filters" className={wrapper}>{content}</aside>;
}
