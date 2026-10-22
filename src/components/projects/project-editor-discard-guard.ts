"use client";
import {useEffect,useRef,useState} from "react";
import {canKeepProjectEditorMountedAcrossNavigation} from "@/modules/projects/project-navigation-guard-model";

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
   // Fragment-only jumps keep the editor mounted; do not ask users to discard
   // a draft merely to reach another section on the same route.
   if(canKeepProjectEditorMountedAcrossNavigation(window.location.href,href))return;
   // Block Next's client-side navigation before its delegated event handler runs.
   event.preventDefault();event.stopPropagation();
   if(pending)return;
   destination.current=href;
   setDiscardOpen(true);
  };
  // Supported browsers expose a cancellable navigate event for Back/Forward
  // and keyboard navigation. Unlike a click listener this also covers browser
  // history without inserting synthetic entries into Next's router history.
  // On browsers without Navigation API the beforeunload guard remains active.
  type NavigateSource={addEventListener:(kind:string,listener:(event:Event)=>void)=>void;
   removeEventListener:(kind:string,listener:(event:Event)=>void)=>void};
  const nativeNavigation=(window as Window & {navigation?:NavigateSource}).navigation;
  const onNativeNavigate=(event:Event)=>{
   if(leaveConfirmed.current||!event.cancelable||pending)return;
   const destinationUrl=(event as Event & {destination?:{url?:string}}).destination?.url;
   if(!destinationUrl)return;
   const target=new URL(destinationUrl,window.location.href);
   if(target.origin!==window.location.origin||
      canKeepProjectEditorMountedAcrossNavigation(window.location.href,target.href))return;
   event.preventDefault();
   destination.current=target.href;
   setDiscardOpen(true);
  };
  window.addEventListener("beforeunload",beforeUnload);
  document.addEventListener("click",onLinkClick,true);
  nativeNavigation?.addEventListener("navigate",onNativeNavigate);
  return ()=>{
   window.removeEventListener("beforeunload",beforeUnload);
   document.removeEventListener("click",onLinkClick,true);
   nativeNavigation?.removeEventListener("navigate",onNativeNavigate);
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
  if(navigateTo){
   // Only one navigation is allowed. Calling onDiscard first used to schedule
   // a competing router.push before the confirmed anchor's destination.
   leaveConfirmed.current=true;
   window.location.assign(navigateTo);
   return;
  }
  onDiscard();
 }
 function changeDiscardOpen(next:boolean){
  if(!next)destination.current=null;
  setDiscardOpen(next);
 }
 return {discardOpen,setDiscardOpen:changeDiscardOpen,requestClose,confirmDiscard};
}
