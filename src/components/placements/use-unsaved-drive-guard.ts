"use client";
import {createElement,useCallback,useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

/** Protects draft drive details from page reload/back navigation until a save succeeds. */
export function useUnsavedDriveGuard() {
  const router=useRouter();
  const [dirty, setDirty] = useState(false);
  const [leaveHref,setLeaveHref]=useState<string|null>(null);
  const allowUnload=useRef(false);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if(allowUnload.current)return;
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
      event.preventDefault();
      event.stopPropagation();
      setLeaveHref(url.href);
    };
    document.addEventListener("click",onAnchorClick,true);
    return ()=>document.removeEventListener("click",onAnchorClick,true);
  },[dirty]);
  const markDirty=useCallback(()=>setDirty(true),[]);
  const clearDirty=useCallback(()=>{setDirty(false);setLeaveHref(null);},[]);
  const guardDialog=createElement(ConfirmDialog,{
    open:dirty&&leaveHref!==null,
    onOpenChange:(next:boolean)=>{if(!next)setLeaveHref(null);},
    title:"Discard unsaved drive changes?",
    description:"You have unsaved drive changes. Leave without saving?",
    confirmLabel:"Leave without saving",
    confirmVariant:"danger",
    onConfirm:()=>{
      if(!leaveHref)return;
      const url=new URL(leaveHref,window.location.href);
      setLeaveHref(null);
      allowUnload.current=true;
      router.push(url.pathname+url.search+url.hash);
    },
  });
  return {dirty,markDirty,clearDirty,guardDialog};
}
