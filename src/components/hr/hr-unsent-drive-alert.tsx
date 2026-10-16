"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {restoreHrUnsentDraft} from "@/modules/placements/hr-unsent-draft-storage-model";
/** REC-home-drives-17: only a scoped, saved, validated draft can be continued. */
export function HrUnsentDriveAlert({storageKey,collegeId}:{storageKey:string;collegeId:string}){
 const [hasDraft,setHasDraft]=useState(false);
 useEffect(()=>{
  try{
   const raw=window.localStorage.getItem(storageKey)??window.sessionStorage.getItem(storageKey);
   queueMicrotask(()=>setHasDraft(!!restoreHrUnsentDraft(raw,Date.now())));
  }catch{/* Storage may be unavailable */ }
 },[storageKey]);
 if(!hasDraft)return null;
 return <aside role="status" className="rounded-xl border border-warning bg-surface p-4">
   <p className="font-semibold text-foreground">You have a drive request you haven't sent yet</p>
   <p className="mt-1 text-sm text-body">It is saved on this device.</p>
   <Link href={"/hr/drives/new?collegeId="+encodeURIComponent(collegeId)}
    className="mt-3 inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
    Continue
   </Link>
 </aside>;
}
