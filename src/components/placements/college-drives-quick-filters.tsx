"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
/** 400ms legacy search; all other URL filters survive change and Back. */
export function CollegeDrivesQuickFilters({q,status}:{q:string;status:"ALL"|"DRAFT"|"PUBLISHED"|"CLOSED"|"ARCHIVED"}){
 const router=useRouter();
 const [search,setSearch]=useState(q);
 useEffect(()=>setSearch(q),[q]);
 useEffect(()=>{
  if(search===q)return;
  const timeout=setTimeout(()=>{
   const params=new URLSearchParams(window.location.search);
   if(search.trim())params.set("q",search.trim());else params.delete("q");
   params.delete("page");
   router.replace("/college/placements/drives?"+params.toString(),{scroll:false});
  },400);
  return ()=>clearTimeout(timeout);
 },[search,q,router]);
 return <>
  <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
   Title or company
   <Input type="search" name="q" value={search} maxLength={100}
    aria-label="Search by job title or company" placeholder="Search by job title or company"
    className="w-full min-w-0 md:w-[260px]" onChange={event=>setSearch(event.target.value)}/>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
   <Select name="status" value={status} onChange={event=>{
    const next=event.currentTarget.value;
    const params=new URLSearchParams(window.location.search);
    if(next==="ALL")params.delete("status");else params.set("status",next);
    params.delete("page");
    router.replace("/college/placements/drives?"+params.toString(),{scroll:false});
   }}>
    <option value="ALL">All</option><option value="DRAFT">Draft</option>
    <option value="PUBLISHED">Active</option><option value="CLOSED">Closed</option>
    <option value="ARCHIVED">Archived</option>
   </Select>
  </label>
 </>;
}
