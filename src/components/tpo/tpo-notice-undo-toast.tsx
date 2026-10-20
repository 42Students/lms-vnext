"use client";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useFormStatus } from "react-dom";

import {useEffect,useState} from "react";

function UndoSendButton() {
 const { pending } = useFormStatus();
 return <Button type="submit" loading={pending} disabled={pending}
   className="min-h-11 w-full sm:w-auto md:min-h-9">
   Undo send
 </Button>;
}

export function TpoNoticeUndoToast({id,version,createdAt}:{
 id:string;version:number;createdAt:string;
}){
 const [now,setNow]=useState<number|null>(null);
 useEffect(()=>{
  const refresh=()=>setNow(Date.now());
  const interval=window.setInterval(refresh,1000);
  return ()=>window.clearInterval(interval);
 },[]);
 if(now===null)return <p role="status" className="text-sm text-body">Announcement saved. Undo is available for 30 seconds.</p>;
 const remaining=Math.max(0,30000-(now-new Date(createdAt).getTime()));
 if(!Number.isFinite(remaining)||remaining<=0)return null;
 return <ToastAction tone="info" title={"Announcement saved. Undo send ("+Math.ceil(remaining/1000)+"s remaining)."}>
  <form className="min-w-0 w-full sm:w-auto" action={"/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/lifecycle"} method="post">
   <input type="hidden" name="expectedVersion" value={version}/>
   <input type="hidden" name="action" value="UNDO_SEND"/>
   <UndoSendButton/>
  </form>
 </ToastAction>;
}
