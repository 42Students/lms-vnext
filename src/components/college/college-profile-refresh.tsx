"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";

/** Retain the current editable profile while the server reloads fresh data. */
export function CollegeProfileRefresh(){
 const router=useRouter();
 const [refreshing,setRefreshing]=useState(false);
 const [failed,setFailed]=useState(false);
 const last=useRef(0);
 const [refreshCount,setRefreshCount]=useState(0);
 useEffect(()=>{
  const onVisible=()=>{
   if(document.visibilityState!=="visible"||Date.now()-last.current<2000)return;
   last.current=Date.now();
   setRefreshing(true);setFailed(false);
   try{router.refresh();setRefreshCount(count=>count+1);}
   catch{setFailed(true);}
   finally{setRefreshing(false);}
  };
  document.addEventListener("visibilitychange",onVisible);
  return ()=>document.removeEventListener("visibilitychange",onVisible);
 },[router]);
 function refresh(){
  last.current=Date.now();setRefreshing(true);setFailed(false);
  try{router.refresh();setRefreshCount(count=>count+1);}
  catch{setFailed(true);}
  finally{setRefreshing(false);}
 }
 return <div className="inline-flex min-w-0 flex-wrap items-center gap-2">
  <Button type="button" size="sm" variant="secondary" onClick={refresh} disabled={refreshing}>
   <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none"
     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
     <path d="M20 7v5h-5M4 17v-5h5"/>
     <path d="M5.6 9A7 7 0 0 1 18.5 7L20 12M4 12l1.5 5A7 7 0 0 0 18.4 15"/>
   </svg>{refreshing?"Refreshing profile…":"Refresh profile"}
  </Button>
  {refreshCount>0?<span className="sr-only" role="status">Profile refresh requested</span>:null}
  {failed?<Alert tone="warning">Couldn&apos;t refresh profile. Showing the last profile we loaded.</Alert>:null}
 </div>;
}
