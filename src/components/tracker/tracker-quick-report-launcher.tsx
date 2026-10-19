"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useState} from "react";
import {TrackerReportForm} from "./tracker-report-form";
import {Drawer} from "@/components/ui/drawer";
export function TrackerQuickReportLauncher(){
 const [open,setOpen]=useState(false),[context,setContext]=useState("");
 useEffect(()=>{
  function onKey(event:KeyboardEvent){
   if(event.altKey&&!event.repeat&&event.key.toLowerCase()==="b"){
    if((event.target as HTMLElement|null)?.closest("input,textarea,select,[contenteditable=true]"))return;
    event.preventDefault();setOpen(x=>!x);
   }
  }
  window.addEventListener("keydown",onKey);return ()=>window.removeEventListener("keydown",onKey);
 },[]);
 useEffect(()=>{
  if(!open)return;
  let live=true;
  void Promise.resolve().then(()=>{
   if(!live)return;
   const page=window.location.pathname+window.location.search;
   setContext("Page: "+page+"\nBrowser: "+navigator.userAgent+
    "\nViewport: "+window.innerWidth+"×"+window.innerHeight);
  });
  return ()=>{live=false;};
 },[open]);
 return <>
  <Button variant="primary" className="fixed bottom-5 right-5 z-40 shadow-[var(--lms-overlay-shadow)]" type="button" aria-haspopup="dialog" onClick={()=>setOpen(true)}
   >
    Report issue · Alt+B
  </Button>
  <Drawer open={open} onOpenChange={setOpen} title="Report an issue">
    <details className="mb-3 rounded-[var(--lms-control-radius)] border border-border p-3 text-xs text-body">
      <summary className="min-h-9 cursor-pointer text-sm font-semibold">Captured page / browser / viewport</summary>
      <pre className="mt-2 whitespace-pre-wrap break-words">{context}</pre>
    </details>
    <TrackerReportForm contextPrefill={context}/>
  </Drawer>
 </>;
}
