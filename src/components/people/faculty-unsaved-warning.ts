"use client";
import {useEffect} from "react";
/** Never prevent ordinary navigation when every section has been saved. */
export function useFacultyProfileUnsavedWarning(dirty:boolean):void{
 useEffect(()=>{
  if(!dirty)return;
  const onBeforeUnload=(event:BeforeUnloadEvent)=>{
   event.preventDefault();
   event.returnValue="";
  };
  window.addEventListener("beforeunload",onBeforeUnload);
  return ()=>window.removeEventListener("beforeunload",onBeforeUnload);
 },[dirty]);
}
