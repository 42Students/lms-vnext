"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
/** A visibility return revalidates the server-owned Faculty profile.
 * Coalescing avoids repeated router.refresh calls during rapid tab switches.
 */
export function FacultyProfileRefresh(){
 const router=useRouter();
 const [stale,setStale]=useState(false);
 const lastRefresh=useRef(0);
 function refresh(){
  if(Date.now()-lastRefresh.current<2000)return;
  lastRefresh.current=Date.now();
  setStale(false);
  try{router.refresh();}catch{setStale(true);}
 }
 useEffect(()=>{
  function visibility(){if(document.visibilityState==="visible")refresh();}
  document.addEventListener("visibilitychange",visibility);
  return ()=>document.removeEventListener("visibilitychange",visibility);
 // The router refresh is intentionally issued through the latest functional callback.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[router]);
 return <span className="inline-flex flex-col gap-2">
  <Button type="button" variant="secondary" size="sm" data-testid="teacher.profile.retry"
   className="min-h-11" onClick={refresh}>Refresh profile</Button>
  {stale?<Alert tone="warning">Couldn&apos;t refresh profile. Showing the last profile we loaded.</Alert>:null}
 </span>;
}
