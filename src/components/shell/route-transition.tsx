"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import "./route-transition.css";

/** The legacy learner and admin page body enters over 250ms.
 * Keep the topbar/sidebar outside this wrapper. Query-only changes retain
 * the same key so a filter or pagination update never remounts its form. */
export function RouteTransition({children}:{children:ReactNode}) {
 const pathname=usePathname();
 const [leaving,setLeaving]=useState(false);
 const recoveryTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  const onNavigate=(event:MouseEvent)=>{
   if(event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
   const target=event.target;
   if(!(target instanceof Element))return;
   const link=target.closest("a[href]");
   if(!(link instanceof HTMLAnchorElement)||link.target==="_blank"||link.hasAttribute("download"))return;
   if(link.getAttribute("aria-disabled")==="true")return;
   const destination=new URL(link.href,window.location.href);
   if(destination.origin!==window.location.origin||destination.pathname===pathname)return;
   setLeaving(true);
  };
  document.addEventListener("click",onNavigate,true);
  return ()=>document.removeEventListener("click",onNavigate,true);
 },[pathname]);
 useEffect(()=>{setLeaving(false);},[pathname]);
 return <div key={pathname} data-slot="route-content" data-route-transitioning={leaving?"true":undefined}
   className="lms-shell-route-content">{children}</div>;
}
