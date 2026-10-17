"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {restoreHrUnsentDraft} from "@/modules/placements/hr-unsent-draft-storage-model";
/** REC-home-drives-17: only a scoped, saved, validated draft can be continued. */
export function HrUnsentDriveAlert({storageKey,collegeId}:{storageKey:string;collegeId:string}){
 const [hasDraft,setHasDraft]=useState(false);
 useEffect(()=>{
  function readDraft(){
   try{
    const local=restoreHrUnsentDraft(window.localStorage.getItem(storageKey),Date.now());
    const session=restoreHrUnsentDraft(window.sessionStorage.getItem(storageKey),Date.now());
    setHasDraft(Boolean(local||session));
   }catch{setHasDraft(false);}
  }
  readDraft();
  window.addEventListener("storage",readDraft);
  window.addEventListener("focus",readDraft);
  return ()=>{
   window.removeEventListener("storage",readDraft);
   window.removeEventListener("focus",readDraft);
  };
 },[storageKey]);
 if(!hasDraft)return null;
 return <aside role="status" className="rounded-xl border border-warning bg-surface p-4">
   <p className="font-semibold text-foreground">You have a drive request you haven't sent yet</p>
   <p className="mt-1 text-sm text-body">It is saved on this device.</p>
   <Link href={"/hr/drives/new?collegeId="+encodeURIComponent(collegeId)}
    className="mt-3 inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
    Continue
   </Link>
   <button type="button" className="ml-3 min-h-10 text-sm font-semibold text-body underline"
    onClick={()=>{
      if(!window.confirm("Discard the unsent drive request saved on this device?"))return;
      try{window.localStorage.removeItem(storageKey);window.sessionStorage.removeItem(storageKey);}
      catch{/* Browser storage may be unavailable. */}
      setHasDraft(false);
    }}>Discard saved draft</button>
 </aside>;
}
