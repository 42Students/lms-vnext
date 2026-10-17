"use client";
import {useCallback, useEffect, useState} from "react";

/** Protects draft drive details from page reload/back navigation until a save succeeds. */
export function useUnsavedDriveGuard() {
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  // TPO-drives-41: intercept internal links as well as browser unload.
  // Native beforeunload does not fire for Next client-side link transitions.
  useEffect(()=>{
    if(!dirty)return;
    const onAnchorClick=(event:MouseEvent)=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||
        event.shiftKey||event.altKey)return;
      const target=event.target;
      if(!(target instanceof Element))return;
      const anchor=target.closest("a[href]");
      if(!(anchor instanceof HTMLAnchorElement)||anchor.target==="_blank"||
        anchor.hasAttribute("download"))return;
      const url=new URL(anchor.href,window.location.href);
      if(url.origin!==window.location.origin||
        (url.pathname===window.location.pathname&&url.search===window.location.search))return;
      if(!window.confirm("You have unsaved drive changes. Leave without saving?")){
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click",onAnchorClick,true);
    return ()=>document.removeEventListener("click",onAnchorClick,true);
  },[dirty]);
  const markDirty=useCallback(()=>setDirty(true),[]);
  const clearDirty=useCallback(()=>setDirty(false),[]);
  return {dirty, markDirty, clearDirty};
}
