"use client";
import {useEffect,useRef,useState} from "react";

/** MEN-projects-meetings-75: do not silently lose mentor edits to a dialog dismissal,
 * full reload or an in-app Link navigation. Only a confirmed discard may navigate.
 */
export function useProjectEditorDiscardGuard(
 open:boolean,dirty:boolean,pending:boolean,onDiscard:()=>void,
){
 const [discardOpen,setDiscardOpen]=useState(false);
 const destination=useRef<string|null>(null);
 const leaveConfirmed=useRef(false);

 useEffect(()=>{
  if(!open||!dirty)return;
  const beforeUnload=(event:BeforeUnloadEvent)=>{
   if(leaveConfirmed.current)return;
   event.preventDefault();event.returnValue="";
  };
  const onLinkClick=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||
      event.altKey||event.shiftKey)return;
   if(!(event.target instanceof Element))return;
   const anchor=event.target.closest("a[href]");
   if(!(anchor instanceof HTMLAnchorElement)||anchor.hasAttribute("download")||
      (anchor.target&&anchor.target!=="_self"))return;
   const href=anchor.href;
   if(href===window.location.href)return;
   // Block Next's client-side navigation before its delegated event handler runs.
   event.preventDefault();event.stopPropagation();
   if(pending)return;
   destination.current=href;
   setDiscardOpen(true);
  };
  window.addEventListener("beforeunload",beforeUnload);
  document.addEventListener("click",onLinkClick,true);
  return ()=>{
   window.removeEventListener("beforeunload",beforeUnload);
   document.removeEventListener("click",onLinkClick,true);
  };
 },[open,dirty,pending]);

 function requestClose(){
  if(pending)return;
  destination.current=null;
  if(dirty)setDiscardOpen(true);
  else onDiscard();
 }
 function confirmDiscard(){
  if(pending)return;
  const navigateTo=destination.current;
  destination.current=null;
  setDiscardOpen(false);
  onDiscard();
  if(navigateTo){
   leaveConfirmed.current=true;
   window.location.assign(navigateTo);
  }
 }
 function changeDiscardOpen(next:boolean){
  if(!next)destination.current=null;
  setDiscardOpen(next);
 }
 return {discardOpen,setDiscardOpen:changeDiscardOpen,requestClose,confirmDiscard};
}
