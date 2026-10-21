"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import { Button } from "@/components/ui/button";

/** Poll only a scoped version token; refresh the expensive server page only
 * after an authorized conversation changes, never while editing a message. */
export function RecruiterConversationLiveRefresh(){
 const router=useRouter();
 const version=useRef<string|null>(null);
 const checking=useRef(false);
 const [stale,setStale]=useState(false);
 const refresh=useRef<()=>void>(()=>{});
 useEffect(()=>{
  let active=true;
  const update=async()=>{
   if(checking.current || document.visibilityState!=="visible" || !navigator.onLine)return;
   const current=document.activeElement;
   if(current instanceof HTMLElement&&current.closest("input,textarea,select,[contenteditable=true]"))return;
   if(window.getSelection()?.toString().trim())return;
   if(document.querySelector('dialog[open], [role="dialog"][aria-modal="false"], [role="dialog"][aria-modal="true"], [role="alertdialog"], [aria-haspopup][aria-expanded="true"], details[open]'))return;
   checking.current=true;
   try{
    const response=await fetch("/api/placements/recruiter/conversations/pulse",{
     method:"GET",credentials:"same-origin",cache:"no-store",
     headers:{Accept:"application/json"},
    });
    if(!response.ok)throw new Error("PULSE_UNAVAILABLE");
    const data:unknown=await response.json();
    if(!data||typeof data!=="object"||!("version" in data)||
       typeof data.version!=="string")throw new Error("INVALID_PULSE");
    if(!active)return;
    setStale(false);
    const next=data.version;
    if(version.current!==null && version.current!==next){
     router.refresh();
    }
    version.current=next;
   }catch{if(active)setStale(true);}
   finally{checking.current=false;}
  };
  refresh.current=()=>{void update();};
  void update();
  const interval=window.setInterval(()=>{void update();},4000);
  window.addEventListener("focus",refresh.current);
  return ()=>{active=false;window.clearInterval(interval);
    window.removeEventListener("focus",refresh.current);};
 },[router]);
 return stale?<div role="status" className="flex flex-wrap items-center gap-2 border-b border-[var(--lms-canvas-border)] py-2 text-sm text-body">
   This refresh failed. Showing the last successful inbox.
   <Button type="button" size="sm" variant="secondary" onClick={()=>refresh.current()}>Retry</Button>
 </div>:null;
}
