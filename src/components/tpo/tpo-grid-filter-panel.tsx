"use client";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {FilterChip} from "@/components/ui/filter-chip";
import {useRouter,usePathname,useSearchParams} from "next/navigation";
import {useEffect,useId,useState} from "react";
import {BottomSheet} from "@/components/ui/bottom-sheet";
import {updateTpoGridQuery} from "@/modules/placements/tpo-grid-model";
import {activeTpoGridFilterCount,invalidTpoGridFilterValue,resolvedTpoGridFilterValue} from "@/modules/placements/tpo-grid-filter-state";
import {clearTpoGridFilters} from "@/modules/placements/tpo-grid-filter-reset";
export type TpoFilterField={key:string;label:string;urlKey?:string;allValue?:string;options:readonly {value:string;label:string}[]};
export function TpoGridFilterPanel({fields,mobileSheet=false,title="Filter students",autoOpenMobile=false,onAutoClose}:{fields:readonly TpoFilterField[];mobileSheet?:boolean;title?:string;autoOpenMobile?:boolean;onAutoClose?:()=>void}){
 const router=useRouter(),pathname=usePathname(),query=useSearchParams();
 const [sheetOpen,setSheetOpen]=useState(false);
 useEffect(()=>{
  if(autoOpenMobile&&mobileSheet&&window.matchMedia("(max-width: 767px)").matches)setSheetOpen(true);
 },[autoOpenMobile,mobileSheet]);
 const filterPanelId=useId();
 const activeCount=activeTpoGridFilterCount(new URLSearchParams(query.toString()),fields);
 function update(field:TpoFilterField,value:string){
  const key=field.urlKey??"filter."+field.key;
  const params=updateTpoGridQuery(new URLSearchParams(query.toString()),{[key]:value===field.allValue?"":value});
  router.replace(pathname+(params.size?"?"+params.toString():""),{scroll:false});
 }
 const chips=fields.flatMap(field=>{
   const key=field.urlKey??"filter."+field.key,raw=query.get(key);
   if(!raw||raw===field.allValue)return [];
   const chosen=field.options.find(option=>option.value===raw);
   return [{key,label:field.label+": "+(chosen?.label??"Unknown filter"),field}];
 });
 const content=<>
  <h2 className={mobileSheet?"hidden text-base font-semibold md:block":"text-base font-semibold"}>{title}</h2>
  <p role="status" className="text-xs text-muted-foreground">{activeCount} active {activeCount===1?"filter":"filters"}</p>
  {chips.length>0?<div className="flex min-w-0 flex-wrap gap-2" role="group" aria-label="Active grid filters">
   {chips.map(chip=><FilterChip key={chip.key} type="button" aria-pressed={true} onClick={()=>update(chip.field,"")}
    aria-label={"Remove "+chip.label}>{chip.label} ×</FilterChip>)}
  </div>:null}
  <div className="grid min-w-0 gap-3 sm:grid-cols-2">
  {fields.map(field=><label key={field.key} className="grid min-w-0 content-start gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">{field.label}
   <Select className="min-h-11 w-full min-w-0 text-[14px] md:min-h-9" value={resolvedTpoGridFilterValue(query.get(field.urlKey??"filter."+field.key),field)} onChange={event=>update(field,event.target.value)}>
    <option value={field.allValue??""}>All</option>{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
   </Select>
   {invalidTpoGridFilterValue(query.get(field.urlKey??"filter."+field.key),field)&&<InlineNotice tone="error" message="Unknown saved filter value. Clear grid filters to recover."/>}
  </label>)}
  </div>
  {fields.some(field=>query.has(field.urlKey??"filter."+field.key))&&<Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button"
   onClick={()=>{const next=clearTpoGridFilters(new URLSearchParams(query.toString()),fields);router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});}}
   >Clear all</Button>}
 </>;
 const wrapper="w-full min-w-0 space-y-3 border-y border-border py-3";
 return mobileSheet?<div className="w-full min-w-0">
  <Button variant="secondary" type="button" aria-expanded={sheetOpen} aria-controls={filterPanelId}
   onClick={()=>setSheetOpen(true)}
   className={autoOpenMobile?"hidden":"min-h-11 w-full md:hidden"}>
   {title} ({activeCount})
  </Button>
  <BottomSheet open={sheetOpen} onOpenChange={next=>{setSheetOpen(next);if(!next&&autoOpenMobile)onAutoClose?.();}} title={title}>
   <section id={filterPanelId} aria-label={title} className={wrapper}>{content}</section>
  </BottomSheet>
  <aside aria-label="Grid filters" className={wrapper+" hidden md:block"}>{content}</aside>
 </div>:<aside aria-label="Grid filters" className={wrapper}>{content}</aside>;
}
