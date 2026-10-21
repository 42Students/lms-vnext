"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

/** Keep last rendered catalogue visible while revalidating after tab returns. */
export function CollegeCourseVisibilityRefresh(){
 const router=useRouter();
 const [refreshing,setRefreshing]=useState(false);
 const last=useRef(0);
 useEffect(()=>{
  const visible=()=>{
   if(document.visibilityState!=="visible"||Date.now()-last.current<2000)return;
   last.current=Date.now();
   router.refresh();
  };
  document.addEventListener("visibilitychange",visible);
  return ()=>document.removeEventListener("visibilitychange",visible);
 },[router]);
 return <Button type="button" variant="secondary" size="sm" disabled={refreshing}
  onClick={()=>{setRefreshing(true);last.current=Date.now();router.refresh();setRefreshing(false);}}>
  <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none"
   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
   <path d="M20 7v5h-5M4 17v-5h5"/>
   <path d="M5.6 9A7 7 0 0 1 18.5 7L20 12M4 12l1.5 5A7 7 0 0 0 18.4 15"/>
  </svg>{refreshing?"Refreshing…":"Refresh"}
 </Button>;
}
