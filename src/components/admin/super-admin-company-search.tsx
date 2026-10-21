"use client";

import {useEffect,useState} from "react";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import Link from "next/link";
import {Input} from "@/components/ui/input";
import {Checkbox} from "@/components/ui/checkbox";

/** Legacy 300ms company search; cancels pending navigation on continued typing. */
export function SuperAdminCompanySearch({mode,initialQuery,initialVerified,initialDeleted}:{
 mode:"GLOBAL"|"COLLEGE";initialQuery:string;initialVerified?:boolean;initialDeleted?:boolean;
}){
 const router=useRouter();
 const pathname=usePathname();
 const search=useSearchParams();
 const [query,setQuery]=useState(initialQuery);
 const [onlyUnverified,setOnlyUnverified]=useState(Boolean(initialVerified));
 const [showDeleted,setShowDeleted]=useState(Boolean(initialDeleted));
 const currentQuery=search.get("q")??"";
 const currentOnly=search.get("verified")==="NOT_VERIFIED";
 const currentDeleted=search.get("status")==="ALL" && search.get("companyStatus")==="ALL";
 useEffect(()=>{
  if(query===currentQuery && (mode==="COLLEGE"?showDeleted===currentDeleted:onlyUnverified===currentOnly))return;
  const timer=setTimeout(()=>{
   const next=new URLSearchParams(search.toString());
   next.set("view",mode);
   if(query.trim())next.set("q",query.trim());else next.delete("q");
   if(mode==="GLOBAL"){
    next.set("verified",onlyUnverified?"NOT_VERIFIED":"ALL");
   }else{
    next.set("status",showDeleted?"ALL":"ACTIVE");
    next.set("companyStatus",showDeleted?"ALL":"MATCH");
   }
   next.delete("page");
   router.replace(pathname+"?"+next.toString(),{scroll:false});
  },300);
  return ()=>clearTimeout(timer);
 },[query,showDeleted,onlyUnverified,currentQuery,currentDeleted,currentOnly,mode,pathname,router,search]);
 return <div className="flex min-w-0 flex-wrap items-end gap-[var(--lms-space-3)]">
  <label className="grid w-full min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:w-[300px]">
   Search
   <Input type="search" value={query} maxLength={100}
    placeholder={mode==="GLOBAL"?"Search a name, other name or domain":"Search by name or industry"}
    onChange={e=>setQuery(e.target.value)}
    aria-label={mode==="GLOBAL"?"Search a name, other name or domain":"Search companies by name or industry"}
    className="min-h-11 w-full md:min-h-9"/>
  </label>
  {mode==="GLOBAL"?<label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm md:min-h-9">
   <Checkbox checked={onlyUnverified} onChange={e=>setOnlyUnverified(e.target.checked)}/>
   Only not verified
  </label>:<label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm md:min-h-9">
   <Checkbox checked={showDeleted} onChange={e=>setShowDeleted(e.target.checked)}/>
   Show deleted
  </label>}
  <Link href={"/admin/companies?view="+mode} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9">
   Clear
  </Link>
 </div>;
}
