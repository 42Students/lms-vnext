"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import "./route-transition.css";

/** The legacy learning page body enters over 250ms; learner-only exit fades.
 * Keep the topbar/sidebar outside this wrapper. Query-only changes retain
 * the same key so a filter or pagination update never remounts its form. */
export function RouteTransition({children}:{children:ReactNode}) {
 const pathname=usePathname();
 const learnerRoute=pathname==="/learn"||pathname.startsWith("/learn/");
 const facultyRoute=pathname==="/teacher"||pathname.startsWith("/teacher/");
 const [leaving,setLeaving]=useState(false);
 const recoveryTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  if(!learnerRoute)return;
  const beginLeaving=()=>{
   setLeaving(true);
   if(recoveryTimer.current!==null)window.clearTimeout(recoveryTimer.current);
   recoveryTimer.current=window.setTimeout(()=>setLeaving(false),3000);
  };
  const onNavigate=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
   const target=event.target;
   if(!(target instanceof Element))return;
   const link=target.closest("a[href]");
   if(!(link instanceof HTMLAnchorElement)||
      (link.target&&link.target!=="_self")||
      link.hasAttribute("download")||
      link.getAttribute("aria-disabled")==="true")return;
   let destination:URL;
   try{destination=new URL(link.href,window.location.href);}
   catch{return;}
   if(destination.origin!==window.location.origin||destination.pathname===pathname)return;
   beginLeaving();
  };
  // Browser Back/Forward changes URL before Next has committed the new body.
  // Query- or hash-only history must preserve the current form and focus.
  const onPopState=()=>{
   if(window.location.pathname!==pathname)beginLeaving();
  };
  // Observe before Next Link prevents the native click during client routing.
  document.addEventListener("click",onNavigate,true);
  window.addEventListener("popstate",onPopState);
  return ()=>{
   document.removeEventListener("click",onNavigate,true);
   window.removeEventListener("popstate",onPopState);
   if(recoveryTimer.current!==null)window.clearTimeout(recoveryTimer.current);
   recoveryTimer.current=null;
  };
 },[pathname,learnerRoute]);
 useEffect(()=>{setLeaving(false);},[pathname]);
 return <div key={pathname} data-slot="route-content" data-route-portal={learnerRoute?"learner":"other"} data-route-entry={learnerRoute||facultyRoute?"true":undefined}
   data-route-transitioning={learnerRoute&&leaving?"true":undefined} aria-busy={learnerRoute&&leaving?true:undefined}
   className="lms-shell-route-content">{children}</div>;
}
