"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {learnerSavedDriveCopy} from "@/modules/placements/learner-saved-drives-model";

/** LEARNER-placements-13: persisted private bookmark, never an application. */
export function LearnerSaveDriveButton({jobId,initialSaved}:{jobId:string;initialSaved:boolean}){
 const router=useRouter();
 const [saved,setSaved]=useState(initialSaved);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const lock=useRef(false);
 async function toggle(){
  if(lock.current)return;
  lock.current=true;setBusy(true);setMessage("");
  const next=!saved;
  try{
   const response=await fetch("/api/placements/learner/saved-jobs/"+encodeURIComponent(jobId),{
    method:next?"POST":"DELETE",credentials:"same-origin",
   });
   if(!response.ok)throw new Error("Failed to update saved job");
   setSaved(next);
   setMessage(learnerSavedDriveCopy(saved).toast);
   router.refresh();
  }catch{setMessage("Failed to update saved job");}
  finally{lock.current=false;setBusy(false);}
 }
 return <span className="inline-flex flex-wrap items-center gap-2">
  <button type="button" disabled={busy} aria-pressed={saved} onClick={()=>void toggle()}
   aria-label={saved?"Remove from saved drives":"Save "+jobId+" for later"}
   className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
   <span aria-hidden="true">{saved?"♥":"♡"}</span>
   {busy?"Saving…":learnerSavedDriveCopy(saved).action}
  </button>
  {message?<span role="status" className="text-xs text-body">{message}</span>:null}
 </span>;
}
