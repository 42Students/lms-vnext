"use client";

import {useEffect,useState} from "react";

export function TpoNoticeUndoToast({id,version,createdAt}:{
 id:string;version:number;createdAt:string;
}){
 const [now,setNow]=useState<number|null>(null);
 useEffect(()=>{
  const refresh=()=>setNow(Date.now());
  const interval=window.setInterval(refresh,250);
  return ()=>window.clearInterval(interval);
 },[]);
 if(now===null)return <p role="status" className="text-sm text-body">Announcement saved. Undo is available for 30 seconds.</p>;
 const remaining=Math.max(0,30000-(now-new Date(createdAt).getTime()));
 if(!Number.isFinite(remaining)||remaining<=0)return null;
 return <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
  <p className="text-sm text-body">Announcement saved. Undo send ({Math.ceil(remaining/1000)}s remaining).</p>
  <form action={"/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/lifecycle"} method="post">
   <input type="hidden" name="expectedVersion" value={version}/>
   <input type="hidden" name="action" value="UNDO_SEND"/>
   <button type="submit" className="min-h-11 sm:min-h-9 rounded-[9px] bg-primary px-4 text-sm font-semibold text-on-primary">
    Undo send
   </button>
  </form>
 </div>;
}
