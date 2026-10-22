"use client";

import {useEffect,useState,useTransition,type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {Alert} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";

/** Only retain the last good roster for the same user, college and filters.
 * The server caller MUST key by those values; no browser or global storage. */
export function RecruiterDrivesRetained({children,failed}:{children:ReactNode;failed:boolean}){
 const [lastSuccessful,setLastSuccessful]=useState<ReactNode>(failed?null:children);
 const [dismissed,setDismissed]=useState(false);
 useEffect(()=>{
  if(!failed){setLastSuccessful(children);setDismissed(false);}
 },[children,failed]);
 return <>
  {failed&&lastSuccessful&&!dismissed?<Alert tone="error" title="This refresh failed. Showing the last successful drive list.">
   <p>Counts and statuses might be out of date until the next successful refresh.</p>
   <div className="mt-2 flex flex-wrap items-center gap-2">
    <RecruiterDrivesRefreshAction/>
    <Button variant="secondary" type="button" size="sm" onClick={()=>setDismissed(true)}>Dismiss</Button>
   </div>
  </Alert>:null}
  {failed?lastSuccessful??children:children}
 </>;
}

export function RecruiterDrivesRefreshAction(){
 const router=useRouter();
 const [pending,startTransition]=useTransition();
 return <Button type="button" variant="secondary" loading={pending} disabled={pending}
   className="min-h-11 md:min-h-9"
   onClick={()=>startTransition(()=>router.refresh())}>Retry</Button>;
}
