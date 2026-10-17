"use client";
import {useEffect,useState} from "react";
import {TrackerReportForm} from "./tracker-report-form";
export function TrackerQuickReportLauncher(){
 const [open,setOpen]=useState(false),[context,setContext]=useState("");
 useEffect(()=>{
  function onKey(event:KeyboardEvent){
   if(event.key==="Escape"){setOpen(false);return;}
   if(event.altKey&&!event.repeat&&event.key.toLowerCase()==="b"){
    if((event.target as HTMLElement|null)?.closest("input,textarea,select,[contenteditable=true]"))return;
    event.preventDefault();setOpen(x=>!x);
   }
  }
  window.addEventListener("keydown",onKey);return ()=>window.removeEventListener("keydown",onKey);
 },[]);
 useEffect(()=>{
  if(!open)return;
  const page=window.location.pathname+window.location.search;
  setContext("Page: "+page+"\nBrowser: "+navigator.userAgent+
    "\nViewport: "+window.innerWidth+"×"+window.innerHeight);
 },[open]);
 return <>
  <button type="button" aria-haspopup="dialog" onClick={()=>setOpen(true)}
    className="fixed bottom-5 right-5 z-40 min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg">
    Report issue · Alt+B
  </button>
  {open?<div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="presentation"
    onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
    <section role="dialog" aria-modal="true" aria-labelledby="quick-report-title"
      className="h-full w-full max-w-2xl overflow-y-auto bg-background p-4 shadow-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="quick-report-title" className="text-xl font-semibold">Report an issue</h2>
        <button type="button" autoFocus onClick={()=>setOpen(false)}
          className="min-h-10 rounded border border-border px-3 text-sm font-semibold">Close</button>
      </div>
      <details className="mb-3 rounded border border-border p-3 text-xs text-body">
        <summary className="cursor-pointer font-semibold">Captured page / browser / viewport</summary>
        <pre className="mt-2 whitespace-pre-wrap break-words">{context}</pre>
      </details>
      <TrackerReportForm contextPrefill={context}/>
    </section>
  </div>:null}
 </>;
}
