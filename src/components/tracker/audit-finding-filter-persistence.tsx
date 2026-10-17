"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

/** SA-tenants-modules-50: persist search/filter options, never paging cursors. */
const STORAGE_KEY="42tracker_audit_findings_filters_v1";
const FIELDS=["q","status","severity","accountRole","resolution","retestStatus","productionVerified",
 "environment","issueType","fromDate","toDate","sort"] as const;
export function AuditFindingFilterPersistence({search}:{search:string}){
 const router=useRouter();
 useEffect(()=>{
  if(typeof window==="undefined")return;
  try{
   const incoming=new URLSearchParams(search);
   const explicit=FIELDS.some(field=>incoming.has(field));
   if(!explicit){
    const saved=window.localStorage.getItem(STORAGE_KEY);
    if(!saved)return;
    const read=new URLSearchParams(saved);
    const restored=new URLSearchParams();
    for(const field of FIELDS){
     const value=read.get(field);
     if(value&&value.length<=120)restored.set(field,value);
    }
    if(restored.size)router.replace("/tracker/audit-findings?"+restored.toString());
    return;
   }
   const persisted=new URLSearchParams();
   for(const field of FIELDS){
    const value=incoming.get(field);
    if(value&&value.length<=120)persisted.set(field,value);
   }
   window.localStorage.setItem(STORAGE_KEY,persisted.toString());
  }catch{
   // Restricted storage must not interrupt the actual board or filter navigation.
  }
 },[search,router]);
 return null;
}
