"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";

/** A compact legacy-style search with full college-scoped server results.
 * Search never exposes records outside the current membership.
 */
export function CollegeContactsLiveSearch({value}:{value:string}){
 const router=useRouter();
 const [draft,setDraft]=useState(value);
 useEffect(()=>setDraft(value),[value]);
 useEffect(()=>{
  const term=draft.trim();
  if(term===value.trim())return;
  const timer=window.setTimeout(()=>{
   const params=new URLSearchParams(window.location.search);
   if(term)params.set("q",term);else params.delete("q");
   params.delete("page");
   router.replace("/college/contacts?"+params.toString(),{scroll:false});
  },300);
  return ()=>window.clearTimeout(timer);
 },[draft,value,router]);
 return <span className="relative block">
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
   className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground">
   <circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>
  </svg>
  <Input type="search" aria-label="Search contacts" name="q" form="college-contacts-filters"
   maxLength={100} value={draft} placeholder="Search contacts..."
   onChange={event=>setDraft(event.target.value)}
   onKeyDown={event=>{if(event.key==="Escape")setDraft("");}}
   className="min-h-11 w-full min-w-0 pl-9 pr-14 md:min-h-9"/>
  {draft?<button type="button" aria-label="Clear contact search" onClick={()=>setDraft("")}
   className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold text-link focus-visible:outline-2 focus-visible:outline-primary">Clear</button>:null}
 </span>;
}
