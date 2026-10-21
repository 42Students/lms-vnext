"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";

/** Only an authorized, verified importer can accept this action.
 * The server enforces origin, persisted permissions and durable ledger readiness.
 */
export function IndependentFindingSyncAction({ready}:{ready:boolean}){
 const router=useRouter();
 const inFlight=useRef(false);
 const [pending,setPending]=useState(false);
 const [feedback,setFeedback]=useState<{tone:"success"|"warning"|"error";message:string}|null>(null);
 async function sync(){
  if(!ready||inFlight.current)return;
  inFlight.current=true;
  setPending(true);
  setFeedback(null);
  try{
   const response=await apiFetch<{result:{ran:boolean;busy:boolean;imported:number;updates:number;refused:number;tampered:number;deleted:number;message:string}}>(
    "/api/tracker/audit-findings/sync",{method:"POST"}
   );
   const result=response.result;
   if(!result.ran){
    setFeedback({tone:"warning",message:result.busy?
     "Sync didn't run: another import is in progress.":result.message});
   }else{
    setFeedback({tone:result.refused||result.tampered||result.deleted?"warning":"success",
     message:"Synced: "+result.imported+" findings, "+result.updates+
      " updates, "+result.refused+" refused, "+result.tampered+" changed and "+
      result.deleted+" deleted files."});
    router.refresh();
   }
  }catch(error){
   setFeedback({tone:"error",message:error instanceof FriendlyFetchError?
    error.message:"Sync failed. Retry after checking the importer status."});
  }finally{
   inFlight.current=false;
   setPending(false);
  }
 }
 return <div className="flex min-w-0 flex-wrap items-center gap-2">
  <Button type="button" variant="secondary" loading={pending}
   disabled={!ready||pending} onClick={()=>void sync()}
   title={ready?"Synchronize verified findings from the repository":"Importer and ledger verification required"}>
   Sync now
  </Button>
  {feedback?<InlineNotice tone={feedback.tone} message={feedback.message}/>:null}
 </div>;
}
