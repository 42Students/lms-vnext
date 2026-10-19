"use client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";

/** TPO-batches-12: keep all existing batch filters while search changes. */
export function TpoBatchInstantSearch({value}:{value:string}){
 const router=useRouter();
 const [draft,setDraft]=useState(value);
 useEffect(()=>{
  if(draft===value)return;
  const timer=window.setTimeout(()=>{
   const params=new URLSearchParams(window.location.search);
   const search=draft.trim();
   if(search)params.set("q",search);else params.delete("q");
   params.delete("page");
   router.replace("/tpo/batches"+(params.size?"?"+params.toString():""),{scroll:false});
  },250);
  return ()=>window.clearTimeout(timer);
 },[draft,router,value]);
 return <label className="min-w-0 flex-1 text-sm">Search batches
  <span className="mt-1 flex min-w-0 items-center gap-2">
   <Input type="search" name="q" value={draft} maxLength={100}
    onChange={event=>setDraft(event.target.value)} autoComplete="off"
    
    aria-label="Search batches"/>
   {draft?<Button variant="secondary" type="button" onClick={()=>setDraft("")}
    
    aria-label="Clear batch search">Clear</Button>:null}
  </span>
 </label>;
}
