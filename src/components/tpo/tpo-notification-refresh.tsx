"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {tpoHeaderSnapshotSchema} from "@/modules/activity/tpo-header-snapshot-model";

/** TPO-inbox-team-68: retain last successful notification cards on a failed refresh. */
export function TpoNotificationRefresh(){
 const router=useRouter();
 const [state,setState]=useState<"idle"|"refreshing"|"failed">("idle");
 useEffect(()=>{
  let active=true,loading=false;
  async function refresh(){
   if(!active||loading||document.visibilityState!=="visible")return;
   loading=true;setState("refreshing");
   try{
    const raw=await apiFetch<unknown>("/api/tpo/header-snapshot",{
     credentials:"same-origin",cache:"no-store",timeoutMs:12000,
    });
    if(!tpoHeaderSnapshotSchema.safeParse(raw).success)throw new Error("Invalid refresh");
    if(active){setState("idle");router.refresh();}
   }catch{
    if(active)setState("failed");
   }finally{loading=false;}
  }
  const onVisible=()=>{if(document.visibilityState==="visible")void refresh();};
  const timer=window.setInterval(()=>void refresh(),30000);
  document.addEventListener("visibilitychange",onVisible);
  return ()=>{active=false;window.clearInterval(timer);
   document.removeEventListener("visibilitychange",onVisible);};
 },[router]);
 if(state==="refreshing")return <p role="status" className="text-sm text-muted-foreground">Refreshing notifications…</p>;
 if(state==="failed")return <div role="alert" className="rounded-[var(--lms-canvas-radius,12px)] border border-border p-3 text-sm">
  This refresh failed. Showing the last successful load.
  <Button variant="ghost" type="button" className="ml-3 min-h-11 sm:min-h-9 underline"
   onClick={()=>router.refresh()}>Retry</Button>
 </div>;
 return null;
}
