"use client";
import {useRef,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useToast} from "@/components/ui/toast";

/** Legacy list cards use an icon-only optimistic heart. The detail header
 * uses the same heart but announces successful saves with an app toast. */
export function LearnerSaveDriveButton({
 jobId,jobTitle,initialSaved,known=true,surface:explicitSurface,
}:{
 jobId:string;jobTitle:string;initialSaved:boolean;
 known?:boolean;surface?:"LIST"|"DETAIL";
}){
 const router=useRouter();
 const pathname=usePathname();
 const surface=explicitSurface??(
  /\/(?:jobs|drives)\/[0-9a-f-]{36}(?:\/|$)/i.test(pathname)?"DETAIL":"LIST"
 );
 const {showToast}=useToast();
 const [saved,setSaved]=useState(initialSaved);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [announcement,setAnnouncement]=useState("");
 const lock=useRef(false);

 async function toggle(){
  if(lock.current||!known)return;
  lock.current=true;
  const previous=saved;
  const next=!previous;
  setSaved(next); // Immediate heart flip. Failed writes restore the known state.
  setBusy(true);setError("");setAnnouncement("");
  try{
   await apiFetch("/api/placements/learner/saved-jobs/"+encodeURIComponent(jobId),{
    method:next?"POST":"DELETE",credentials:"same-origin",
   });
   const message=next?"Job saved":"Job removed from saved";
   setAnnouncement(message);
   // The old list silently saves; detail uses the original toast wording.
   if(surface==="DETAIL")showToast({tone:"success",
     title:next?"Saved for later":"Removed from saved jobs"});
   router.refresh();
  }catch{
   setSaved(previous);
   setAnnouncement("Save change failed and was reversed");
   const fallback=next?"Failed to save. Please try again.":"Failed to unsave. Please try again.";
   setError(fallback);
   if(surface==="DETAIL")showToast({tone:"error",title:fallback});
  }finally{
   lock.current=false;setBusy(false);
  }
 }

 const tooltip=!known?"Saved drives are temporarily unavailable; retry loading.":
  busy?"Updating saved job…":saved?"Saved":"Save for later";
 const accessibleName=!known?"Saved drives temporarily unavailable":
  saved?"Remove "+jobTitle+" from saved jobs":"Save "+jobTitle+" for later";
 return <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
  <button type="button" data-saved={saved?"true":"false"} aria-pressed={saved}
   aria-label={accessibleName} title={tooltip} disabled={busy||!known}
   onClick={()=>void toggle()}
   className={"inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-transparent bg-transparent transition-colors hover:border-border hover:bg-[#e6f6f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] disabled:cursor-not-allowed disabled:opacity-50 md:size-9 "+
     (saved?"text-[#0a7c88]":"text-[#61727d]")}
  >
   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
    viewBox="0 0 24 24" fill={saved?"currentColor":"none"}
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/>
   </svg>
  </button>
  <span role="status" aria-live="polite" className="sr-only">{announcement}</span>
  {error?<span role="alert" className="max-w-56 text-xs font-semibold text-error">{error}</span>:null}
  {!known?<span className="inline-flex flex-wrap items-center gap-2 text-xs text-body">
    Saved drives are temporarily unavailable; retry loading.
    <button type="button" onClick={()=>router.refresh()}
      className="min-h-11 font-semibold text-link underline md:min-h-9">Retry</button>
  </span>:null}
 </span>;
}
