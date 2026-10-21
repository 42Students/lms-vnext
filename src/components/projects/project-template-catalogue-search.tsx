"use client";

import {useEffect,useState} from "react";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import {Input} from "@/components/ui/input";

/** Legacy 350ms search with clear control and shallow, canonical URL updates. */
export function ProjectTemplateCatalogueSearch({initialQuery}:{
 initialQuery:string;
}){
 const router=useRouter(),pathname=usePathname(),params=useSearchParams();
 const [value,setValue]=useState(initialQuery);
 useEffect(()=>{setValue(initialQuery);},[initialQuery]);
 function navigate(raw:string){
  const next=new URLSearchParams(params.toString());
  // Retain only supported bookmark context; the search must never carry stale
  // actor scope or another college identifier into the new request.
  for(const key of [...next.keys()])
   if(!["q","page","from"].includes(key))next.delete(key);
  const q=raw.trim().slice(0,120);
  if(q)next.set("q",q);else next.delete("q");
  next.delete("page");
  router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});
 }
 useEffect(()=>{
  const q=value.trim().slice(0,120);
  if(q===(params.get("q")??""))return;
  const timer=window.setTimeout(()=>navigate(value),350);
  return()=>window.clearTimeout(timer);
 // The URL/search route can change before the timer fires. Cancel pending
 // updates on unmount or navigation, while preserving natural history/back.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[value,pathname,params]);
 return <div className="min-w-0 w-full sm:w-[240px]">
  <label htmlFor="college-template-search"
   className="sr-only">Search title or slug</label>
  <div className="relative">
   <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground">
    <circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>
   </svg>
   <Input id="college-template-search" type="search"
    value={value} maxLength={120} placeholder="Search title or slug"
    className="min-h-11 w-full pl-9 pr-9 md:min-h-9"
    onChange={event=>setValue(event.target.value)}/>
   {value?<button type="button" aria-label="Clear search"
    title="Clear search"
    className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-primary"
    onClick={()=>{setValue("");navigate("");}}>
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" strokeWidth="2" className="size-4">
     <path d="m5 5 14 14M19 5 5 19"/>
    </svg>
   </button>:null}
  </div>
 </div>;
}
