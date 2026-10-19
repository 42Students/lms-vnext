"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";

export function TpoPlacementCellReadAction({id}:{id:string}){
 const router=useRouter();
 const {pending:busy,run}=useGuardedAction({timeoutMs:30000});
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 async function markRead(){
  setNotice("");setError("");
  try{
   await run(async () => {
    const data=await apiFetch<{firstInCollege?:boolean}>(
     "/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/read-cell",{
      method:"POST",headers:{"content-type":"application/json"},body:"{}",timeoutMs:25000,
     });
    setNotice(data?.firstInCollege?
     "Marked as read for this placement cell.":
     "Already read by someone in this placement cell.");
    router.refresh();
   });
  }catch{
   setError("We could not save this read receipt. Please try again.");
  }
 }
 return <div className="mt-3 space-y-1">
  <Button variant="secondary" type="button" disabled={busy} onClick={()=>void markRead()}
   className="min-h-9 px-3">
   {busy?"Saving…":"Mark as read for our placement cell"}
  </Button>
  {error?<p role="alert" className="text-xs text-danger">{error}</p>:null}
  {notice?<p role="status" className="text-xs text-body">{notice}</p>:null}
 </div>;
}
