"use client";

import {useEffect,useState,useTransition,type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {Alert} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";

/** Retains only the last authorized server-rendered list for the exact
 * actor/college/filter identity supplied as a stable React key by the page.
 * A denied scope must bypass this wrapper. Stale controls are inert until
 * the database can confirm freshness, unlike the legacy writable snapshot. */
export function SuperAdminDrivesRetained({children,failed}:{
 children:ReactNode;failed:boolean;
}){
 const [lastGood,setLastGood]=useState<ReactNode>(failed?null:children);
 useEffect(()=>{if(!failed)setLastGood(children);},[children,failed]);
 if(!failed)return <>{children}</>;
 if(!lastGood)return <>{children}</>;
 return <div className="min-w-0 space-y-3">
  <Alert tone="warning" title="This refresh failed. Showing the last successful load.">
   <p>The drive list may be out of date. Actions are unavailable until the college-scoped refresh succeeds.</p>
   <SuperAdminDrivesRetryButton/>
  </Alert>
  <div inert aria-label="Previous drive list, read-only until refresh" className="opacity-75">{lastGood}</div>
 </div>;
}

/** Only mount the App Router hook when the retained-data recovery UI
 * exists. The authorized server list also renders in isolation for SSR
 * snapshots and does not require a client router context. */
function SuperAdminDrivesRetryButton(){
 const router=useRouter();
 const [pending,startRefresh]=useTransition();
 return <Button type="button" variant="secondary" size="sm" loading={pending} disabled={pending}
  className="mt-2 min-h-11 md:min-h-9"
  onClick={()=>startRefresh(()=>router.refresh())}>Retry</Button>;
}
