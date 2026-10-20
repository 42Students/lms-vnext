"use client";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import {useEffect,useState} from "react";
import {TrackerReportForm} from "./tracker-report-form";
import {Drawer} from "@/components/ui/drawer";
export function TrackerQuickReportLauncher(){
 const [open,setOpen]=useState(false),[context,setContext]=useState("");
 const [formReady,setFormReady]=useState(false);
 function show(){
  const page=window.location.pathname+window.location.search;
  setContext("Page: "+page+"\nBrowser: "+navigator.userAgent+
   "\nViewport: "+window.innerWidth+"×"+window.innerHeight);
  setFormReady(true);setOpen(true);
 }
 useEffect(()=>{
  function onKey(event:KeyboardEvent){
   if(event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.repeat&&event.key.toLowerCase()==="b"){
    if((event.target as HTMLElement|null)?.closest("input,textarea,select,[contenteditable=true]"))return;
    event.preventDefault();if(open)setOpen(false);else show();
   }
  }
  window.addEventListener("keydown",onKey);return ()=>window.removeEventListener("keydown",onKey);
 },[open]);
 return <>
  <Button variant="primary" className="fixed right-4 z-40 min-h-11 max-w-[calc(100vw-2rem)] whitespace-normal text-center shadow-[var(--lms-overlay-shadow)] sm:right-5 md:min-h-9" type="button" aria-haspopup="dialog" aria-keyshortcuts="Alt+B"
   style={{bottom:"calc(max(1rem, env(safe-area-inset-bottom)) + var(--lms-mobile-footer-clearance, 0px))"}}
   onClick={show}
   >
    Report issue · Alt+B
  </Button>
  <Drawer open={open} onOpenChange={setOpen} title="Report an issue"
   bodyClassName="min-w-0 [&_form]:min-w-0 [&_input]:max-w-full [&_select]:max-w-full [&_textarea]:max-w-full">
    <Disclosure title={"Captured page / browser / viewport"} className="mb-3 border-t border-border text-xs text-body" contentClassName="px-2 pb-3">
      <pre className="mt-2 min-w-0 whitespace-pre-wrap break-all text-xs leading-5 text-body">{context}</pre>
    </Disclosure>
    {formReady?<TrackerReportForm contextPrefill={context}/>:null}
  </Drawer>
 </>;
}
