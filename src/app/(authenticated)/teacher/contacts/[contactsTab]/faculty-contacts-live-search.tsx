"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

export function FacultyContactsLiveSearch({baseHref,initialSearch,pageSize}:{
 baseHref:string;initialSearch:string;pageSize:number;
}){
 const router=useRouter();
 const [value,setValue]=useState(initialSearch);
 useEffect(()=>{
  // Live filtering follows the legacy Contacts grid. Keep server-side
  // role masking authoritative; never fetch or search hidden contact fields.
  if(value.trim()===initialSearch)return;
  const timer=setTimeout(()=>{
   const query=new URLSearchParams();
   if(value.trim())query.set("q",value.trim());
   query.set("pageSize",String(pageSize));
   router.replace(baseHref+"?"+query.toString(),{scroll:false});
  },350);
  return ()=>clearTimeout(timer);
 },[baseHref,initialSearch,pageSize,router,value]);
 const href=baseHref+"?pageSize="+encodeURIComponent(String(pageSize));
 return <div role="search" aria-label="Search contacts" className="relative flex w-full min-w-0 items-center sm:max-w-xs">
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"
   stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
   className="pointer-events-none absolute left-3 text-[var(--lms-neutral-400)]">
   <circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>
  </svg>
  <Input type="search" aria-label="Search contacts" maxLength={200}
   placeholder="Search contacts..." value={value}
   onChange={event=>setValue(event.target.value)}
   className="min-h-11 w-full min-w-0 pl-9 pr-10 md:min-h-9"/>
  {value?<Button variant="secondary" type="button" aria-label="Clear search" title="Clear search"
   onClick={()=>{setValue("");router.replace(href,{scroll:false});}}
   className="absolute right-1"
   >×</Button>:null}
 </div>;
}
