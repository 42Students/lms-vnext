"use client";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";


import {useEffect,useState} from "react";

function UndoSendButton({pending}:{pending:boolean}) {
 return <Button type="submit" aria-label="Undo sending this announcement" loading={pending} disabled={pending}
   className="min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] px-4 sm:w-auto md:min-h-9">
   Undo send
 </Button>;
}

export function TpoNoticeUndoToast({id,version,createdAt,recipientCount=null}:{
 id:string;version:number;createdAt:string;recipientCount?:number|null;
}){
 const [now,setNow]=useState<number|null>(null);
 const [undone,setUndone]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
  const refresh=()=>setNow(Date.now());
  const interval=window.setInterval(refresh,1000);
  return ()=>window.clearInterval(interval);
 },[]);
 // A published recipient count must come from the scoped recipient snapshot,
 // never from a list of all enrolled students or a guessed audience size.
 const recipients=recipientCount!==null&&Number.isSafeInteger(recipientCount)&&recipientCount>=0?
  recipientCount:null;
 const sentLabel=recipients===null?"Announcement saved.":"Sent to "+recipients+
  " "+(recipients===1?"student.":"students.");
 const createdMs=Date.parse(createdAt);
 if(!Number.isFinite(createdMs)||undone)return null;
 if(now===null)return <p role="status" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-l-4 border-info bg-surface px-4 py-3 text-[14px] leading-5 text-body shadow-[var(--lms-toast-shadow)]">{sentLabel} Undo is available for 30 seconds.</p>;
 const remaining=Math.max(0,30000-(now-createdMs));
 if(!Number.isFinite(remaining)||remaining<=0)return null;
 return <ToastAction tone="info" title={sentLabel+" Undo send ("+Math.ceil(remaining/1000)+"s remaining)."}>
  <form aria-label="Undo announcement sending" className="flex w-full min-w-0 sm:w-auto"
   action={"/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/lifecycle"} method="post"
   onSubmit={async event=>{
    event.preventDefault();
    if(busy||Date.now()-createdMs>=30000)return;
    setBusy(true);setError("");
    try{
      const response=await fetch(event.currentTarget.action,{method:"POST",credentials:"same-origin",
       headers:{"Accept":"application/json"},body:new FormData(event.currentTarget)});
      if(!response.ok)throw new Error(response.status===409?"Undo window ended or announcement changed.":"Could not undo. Try again within 30 seconds.");
      const result:unknown=await response.json().catch(()=>null);
      if(!result||typeof result!=="object"||!("saved" in result)||result.saved!==true)
       throw new Error("Undo could not be confirmed. Refresh announcements.");
      setUndone(true);
    }catch(cause){setError(cause instanceof Error?cause.message:"Undo failed.");}
    finally{setBusy(false);}
   }}>
   <input type="hidden" name="expectedVersion" value={version}/>
   <input type="hidden" name="action" value="UNDO_SEND"/>
   <UndoSendButton pending={busy}/>
   {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
  </form>
 </ToastAction>;
}
