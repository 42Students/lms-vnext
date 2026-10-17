"use client";
import {useCallback,useEffect,useTransition} from "react";
import {useRouter} from "next/navigation";

/** Refresh stale projections on focus without discarding server-side records. */
export function TpoDriveRefreshControl(){
 const router=useRouter(),[pending,startTransition]=useTransition();
 const refresh=useCallback(()=>startTransition(()=>router.refresh()),[router,startTransition]);
 useEffect(()=>{
  window.addEventListener("focus",refresh);
  return ()=>window.removeEventListener("focus",refresh);
 },[refresh]);
 return <div className="flex flex-wrap items-center gap-2">
  <button type="button" disabled={pending} onClick={refresh}
   className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
   {pending?"Refreshing drive workspace…":"Refresh drive workspace"}
  </button>
  {pending?<span role="status" className="text-sm text-body">Refreshing drive workspace…</span>:null}
 </div>;
}
