"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {parseIndependentFindingFilters} from "@/modules/bug-tracker/independent-audit-findings-model";

const KEY="42tracker_audit_findings_filters_v1";
const allowed=new Set(["q","view","area","status","severity","kind","page"]);
function safeFilterQuery(value:URLSearchParams):boolean{
 if(value.toString().length>1200)return false;
 const raw:Record<string,string|string[]>={};
 for(const key of value.keys()){
  if(!allowed.has(key))return false;
  const all=value.getAll(key);
  if(!["status","severity","kind"].includes(key)&&all.length>1)return false;
  raw[key]=all.length>1?all:all[0]??"";
 }
 return parseIndependentFindingFilters(raw)!==null;
}

/** SA-tenants-modules-50: remember harmless board filters, never credentials or arbitrary redirect URLs. */
export function AuditFindingFilterMemory(){
 const router=useRouter();
 useEffect(()=>{
  try{
   const current=new URLSearchParams(window.location.search);
   if(!safeFilterQuery(current))return;
   const hasExplicitFilters=current.size>0;
   if(hasExplicitFilters){
    window.localStorage.setItem(KEY,current.toString());
    return;
   }
   const saved=window.localStorage.getItem(KEY);
   if(!saved||saved.length>1200)return;
   const restored=new URLSearchParams(saved);
   if(!restored.size||!safeFilterQuery(restored))return;
   router.replace("/tracker/audit-findings?"+restored.toString());
  }catch{
   // Private browsing, disabled storage or malformed saved filters must not block the board.
  }
 },[router]);
 return null;
}
