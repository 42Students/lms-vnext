"use client";
import {useCallback,useEffect,useTransition} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

/** Refresh stale projections on focus without discarding server-side records. */
export function TpoDriveRefreshControl(){
 const router=useRouter(),[pending,startTransition]=useTransition();
 const refresh=useCallback(()=>startTransition(()=>router.refresh()),[router,startTransition]);
 useEffect(()=>{
  window.addEventListener("focus",refresh);
  return ()=>window.removeEventListener("focus",refresh);
 },[refresh]);
 return <div className="flex flex-wrap items-center gap-2">
  <Button variant="secondary" type="button" disabled={pending} onClick={refresh}
   >
   {pending?"Refreshing drive workspace…":"Refresh drive workspace"}
  </Button>
  {pending?<span role="status" className="text-sm text-body">Refreshing drive workspace…</span>:null}
 </div>;
}
