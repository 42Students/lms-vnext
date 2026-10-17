"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";

const KEY="42tracker_audit_findings_filters_v1";
const allowed=new Set(["q","view","area","status","severity","kind","page"]);

/** SA-tenants-modules-50: remember harmless board filters, never credentials or arbitrary redirect URLs. */
export function AuditFindingFilterMemory(){
 const router=useRouter();
 useEffect(()=>{
  try{
   const current=new URLSearchParams(window.location.search);
   const accepted=[...current.keys()].every(key=>allowed.has(key));
   if(!accepted)return;
   const hasExplicitFilters=current.size>0;
   if(hasExplicitFilters){
    if(current.toString().length<=1200)window.localStorage.setItem(KEY,current.toString());
    return;
   }
   const saved=window.localStorage.getItem(KEY);
   if(!saved||saved.length>1200)return;
   const restored=new URLSearchParams(saved);
   if(!restored.size||![...restored.keys()].every(key=>allowed.has(key)))return;
   router.replace("/tracker/audit-findings?"+restored.toString());
  }catch{
   // Private browsing, disabled storage or malformed saved filters must not block the board.
  }
 },[router]);
 return null;
}
