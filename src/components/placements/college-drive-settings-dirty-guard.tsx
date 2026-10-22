"use client";
import {useEffect,useState,type MouseEvent,type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

/** Recreate the old drive subnav's unsaved-form guard for every scoped link. */
export function CollegeDriveSettingsDirtyGuard({className,children}:{
 className?:string;children:ReactNode;
}){
 const router=useRouter();
 const [dirty,setDirty]=useState(false);
 const [pendingHref,setPendingHref]=useState<string|null>(null);
 useEffect(()=>{
  if(!dirty)return;
  const warn=(event:BeforeUnloadEvent)=>{
   event.preventDefault();
   event.returnValue="";
  };
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[dirty]);
 function guardNavigation(event:MouseEvent<HTMLDivElement>){
  if(!dirty||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
  const target=event.target;
  if(!(target instanceof Element))return;
  const link=target.closest("a[href]");
  if(!link||link.getAttribute("target")==="_blank")return;
  const href=link.getAttribute("href")??"";
  if(!href.startsWith("/college/placements/"))return;
  event.preventDefault();
  event.stopPropagation();
  setPendingHref(href);
 }
 return <>
  <div className={className} onInputCapture={()=>setDirty(true)}
   onChangeCapture={()=>setDirty(true)} onClickCapture={guardNavigation}>
   {children}
  </div>
  <ConfirmDialog open={pendingHref!==null} onOpenChange={open=>{if(!open)setPendingHref(null);}}
   title="Discard unsaved changes?" description="You have unsaved changes on this form. Leaving now will discard them."
   confirmLabel="Discard and leave" onConfirm={()=>{
    const destination=pendingHref;
    setPendingHref(null);
    setDirty(false);
    if(destination)router.push(destination);
   }}/>
 </>;
}
