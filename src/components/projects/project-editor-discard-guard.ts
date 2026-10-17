"use client";
import {useEffect,useState} from "react";

/** MEN-projects-meetings-75: preserve unsaved mentor drafts on dismiss and unload. */
export function useProjectEditorDiscardGuard(
 open:boolean,dirty:boolean,pending:boolean,onDiscard:()=>void,
){
 const [discardOpen,setDiscardOpen]=useState(false);
 useEffect(()=>{
  if(!open||!dirty)return;
  const beforeUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",beforeUnload);
  return ()=>window.removeEventListener("beforeunload",beforeUnload);
 },[open,dirty]);
 function requestClose(){
  if(pending)return;
  if(dirty)setDiscardOpen(true);
  else onDiscard();
 }
 function confirmDiscard(){
  if(pending)return;
  setDiscardOpen(false);
  onDiscard();
 }
 return {discardOpen,setDiscardOpen,requestClose,confirmDiscard};
}
