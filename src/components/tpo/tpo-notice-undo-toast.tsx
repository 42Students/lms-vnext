"use client";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useFormStatus } from "react-dom";

import {useEffect,useState} from "react";

function UndoSendButton() {
 const { pending } = useFormStatus();
 return <Button type="submit" aria-label="Undo sending this announcement" loading={pending} disabled={pending}
   className="min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] px-4 sm:w-auto md:min-h-9">
   Undo send
 </Button>;
}

export function TpoNoticeUndoToast({id,version,createdAt,recipientCount=null}:{
 id:string;version:number;createdAt:string;recipientCount?:number|null;
}){
 const [now,setNow]=useState<number|null>(null);
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
 if(!Number.isFinite(createdMs))return null;
 if(now===null)return <p role="status" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-l-4 border-info bg-surface px-4 py-3 text-[14px] leading-5 text-body shadow-[var(--lms-toast-shadow)]">{sentLabel} Undo is available for 30 seconds.</p>;
 const remaining=Math.max(0,30000-(now-createdMs));
 if(!Number.isFinite(remaining)||remaining<=0)return null;
 return <ToastAction tone="info" title={sentLabel+" Undo send ("+Math.ceil(remaining/1000)+"s remaining)."}>
  <form aria-label="Undo announcement sending" className="flex w-full min-w-0 sm:w-auto" action={"/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/lifecycle"} method="post">
   <input type="hidden" name="expectedVersion" value={version}/>
   <input type="hidden" name="action" value="UNDO_SEND"/>
   <UndoSendButton/>
  </form>
 </ToastAction>;
}
