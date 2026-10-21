"use client";
import {useEffect,useState,type MouseEvent,type ReactNode} from "react";

/** Recreate the old drive subnav's unsaved-form guard for every scoped link. */
export function CollegeDriveSettingsDirtyGuard({className,children}:{
 className?:string;children:ReactNode;
}){
 const [dirty,setDirty]=useState(false);
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
  if(!link)return;
  const href=link.getAttribute("href")??"";
  if(!href.startsWith("/college/placements/")&&
   !href.startsWith("/college/placements/jobs/"))return;
  if(!window.confirm("Discard unsaved changes?\nYou have unsaved changes on this form. Leaving now will discard them.")){
   event.preventDefault();
   event.stopPropagation();
  }
 }
 return <div className={className} onInputCapture={()=>setDirty(true)}
  onChangeCapture={()=>setDirty(true)} onClickCapture={guardNavigation}>
  {children}
 </div>;
}
