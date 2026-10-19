"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {learnerSavedDriveCopy} from "@/modules/placements/learner-saved-drives-model";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {friendlyApiError} from "@/lib/friendly-error";

/** LEARNER-placements-13: persisted private bookmark, never an application. */
export function LearnerSaveDriveButton({jobId,jobTitle,initialSaved}:{jobId:string;jobTitle:string;initialSaved:boolean}){
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
   await apiFetch("/api/placements/learner/saved-jobs/"+encodeURIComponent(jobId),{
    method:next?"POST":"DELETE",credentials:"same-origin",
   });
   setSaved(next);
   setMessage(learnerSavedDriveCopy(saved).toast);
   router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:friendlyApiError({}));}
  finally{lock.current=false;setBusy(false);}
 }
 return <span className="inline-flex flex-wrap items-center gap-2">
  <Button className="max-md:min-h-11" variant="secondary" type="button" disabled={busy} aria-pressed={saved} onClick={()=>void toggle()}
   aria-label={saved?"Remove "+jobTitle+" from saved drives":"Save "+jobTitle+" for later"}>
   <span aria-hidden="true">{saved?"♥":"♡"}</span>
   {busy?"Saving…":learnerSavedDriveCopy(saved).action}
  </Button>
  {message?<span role={(message===learnerSavedDriveCopy(false).toast||message===learnerSavedDriveCopy(true).toast)?"status":"alert"} className="text-xs text-body">{message}</span>:null}
 </span>;
}
