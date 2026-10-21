"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {learnerSavedDriveCopy} from "@/modules/placements/learner-saved-drives-model";
import {apiFetch} from "@/lib/api-fetch";
import {FilterChip} from "@/components/ui/filter-chip";
import {useToast} from "@/components/ui/toast";

/**
 * A saved job is a private bookmark, not a submitted application.
 * The parent withholds this control if the initial saved-IDs read failed.
 */
export function LearnerSaveDriveButton({
 jobId,jobTitle,initialSaved,known=true,surface="LIST",
}:{
 jobId:string;jobTitle:string;initialSaved:boolean;
 known?:boolean;surface?:"LIST"|"DETAIL";
}){
 const router=useRouter();
 const {showToast}=useToast();
 const [saved,setSaved]=useState(initialSaved);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [announcement,setAnnouncement]=useState("");
 const lock=useRef(false);
 async function toggle(){
  if(lock.current||!known)return;
  lock.current=true;setBusy(true);setError("");setAnnouncement("");
  const next=!saved;
  try{
   await apiFetch("/api/placements/learner/saved-jobs/"+encodeURIComponent(jobId),{
    method:next?"POST":"DELETE",credentials:"same-origin",
   });
   setSaved(next);
   const success=next?"Job saved":"Job removed from saved";
   // Legacy list hearts update quietly; screen readers still get the change.
   setAnnouncement(success);
   if(surface==="DETAIL")showToast({tone:"success",title:success});
   router.refresh();
  }catch{
   const fallback=next?"Couldn't save — try again":"Couldn't remove — try again";
   setError(fallback);
   if(surface==="DETAIL")showToast({tone:"error",title:"Failed to update saved job"});
  }finally{lock.current=false;setBusy(false);}
 }
 return <span className="inline-flex flex-wrap items-center gap-2">
  <FilterChip className="max-md:min-h-11" type="button"
   disabled={busy||!known} aria-pressed={saved} onClick={()=>void toggle()}
   aria-label={!known?"Saved jobs temporarily unavailable":
     saved?"Remove "+jobTitle+" from saved drives":"Save "+jobTitle+" for later"}>
   <span aria-hidden="true">{saved?"♥":"♡"}</span>
   {busy?"Saving…":learnerSavedDriveCopy(saved).action}
  </FilterChip>
  <span className="sr-only" role="status">{announcement}</span>
  {error?<span role="alert" className="text-xs font-semibold text-error">{error}</span>:null}
  {!known?<span role="status" className="text-xs text-body">Saved jobs unavailable. Retry later.</span>:null}
 </span>;
}
