"use client";
import { Button } from "@/components/ui/button";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

/** REC-home-drives-12/22: cancel an unpublished, recruiter-owned request.
 * The optimistic updatedAt token and membership guard are enforced by the API. */
export function RecruiterRequestCancelButton({requestId,collegeId,updatedAt}:{
 requestId:string;collegeId:string;updatedAt:string;
}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<string|null>(null);
 const [confirmOpen,setConfirmOpen]=useState(false);
 const lock=useRef(false);
 async function cancel(){
  if(lock.current)return;
  lock.current=true;setBusy(true);setNotice(null);
  try{
   await apiFetch("/api/placements/recruiter/drives/requests",{
    method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({requestId,collegeId,action:"CANCEL",expectedUpdatedAt:updatedAt}),
   });
   setConfirmOpen(false);
   setNotice("Request cancelled.");
   router.refresh();
  }catch(error){setNotice(error instanceof FriendlyFetchError?error.message:friendlyApiError({}));}
  finally{lock.current=false;setBusy(false);}
 }
 return <div className="mt-2">
  <Button variant="secondary" type="button" disabled={busy} onClick={()=>setConfirmOpen(true)}
  >
   {busy?"Cancelling…":"Cancel request"}
  </Button>
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
   title="Cancel this drive request?" confirmLabel="Cancel request" pending={busy}
   description="The placement cell will no longer review it." onConfirm={cancel}>
   {notice?<p role="alert" className="text-sm text-error">{notice}</p>:null}
  </ConfirmDialog>
  {notice?<p role="status" className="mt-2 text-xs text-body">{notice}</p>:null}
 </div>;
}
