"use client";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import {useCallback,useEffect,useRef,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";

export function TpoPlacementCellReadAction({id,autoMarkRead=false}:{id:string;autoMarkRead?:boolean}){
 const router=useRouter();
 const {pending:busy,run}=useGuardedAction({timeoutMs:30000});
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const autoRequested=useRef(false);
 const markRead=useCallback(async (automatic=false)=>{
  setNotice("");setError("");
  try{
   await run(async () => {
    const data=await apiFetch<{firstInCollege?:boolean}>(
     "/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/read-cell",{
      method:"POST",headers:{"content-type":"application/json"},body:"{}",timeoutMs:25000,
     });
    if(!automatic)setNotice(data?.firstInCollege?
     "Marked as read for this placement cell.":
     "Already read by someone in this placement cell.");
    router.refresh();
   });
  }catch{
   // Keep a manual retry visible even when the automatic on-open acknowledgement fails.
   setError("We could not save this read receipt. Please try again.");
  }
 },[id,router,run]);
 // Opening From 42 displayed the notice and acknowledged it in the old LMS.
 // Preserve the automatic receipt without a mutating GET; the existing POST
 // remains origin-protected and idempotent per placement cell.
 useEffect(()=>{
  if(!autoMarkRead||autoRequested.current)return;
  autoRequested.current=true;
  void markRead(true);
 },[autoMarkRead,markRead]);
 return <div className="min-w-0 space-y-2">
  <Button variant="secondary" type="button" disabled={busy} onClick={()=>void markRead()}
   className="min-h-11 min-[768px]:min-h-9 px-3">
   {busy?"Saving…":"Mark as read for our placement cell"}
  </Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {notice?<InlineNotice tone="success" message={notice}/>:null}
 </div>;
}
