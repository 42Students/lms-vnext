"use client";
import {useEffect,useRef,useState} from "react";
import {useSearchParams} from "next/navigation";
import {PORTAL_PERMISSION_DENIED} from "@/modules/identity/unauthorized-portal-home";
/** PUB-auth-public-29: screen-reader accessible global 403 notice.
 * Rendered in the authenticated layout, not the chat-9 shared shell.
 */
export function PortalAccessNotice(){
 const search=useSearchParams();
 const [apiDenied,setApiDenied]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  const onDenied=()=>{
   if(timer.current)clearTimeout(timer.current);
   setApiDenied(true);
   timer.current=setTimeout(()=>setApiDenied(false),8000);
  };
  window.addEventListener("lms:access-denied",onDenied);
  return ()=>{window.removeEventListener("lms:access-denied",onDenied);
    if(timer.current)clearTimeout(timer.current);};
 },[]);
 return apiDenied||search.get("access")==="denied"?
  <p role="alert" aria-live="assertive" className="mx-4 my-2 rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground">
   {PORTAL_PERMISSION_DENIED}
  </p>:null;
}
