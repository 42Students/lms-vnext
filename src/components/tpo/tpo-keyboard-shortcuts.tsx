"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Drawer} from "@/components/ui/drawer";
const go:Record<string,string>={h:"/tpo/home",b:"/tpo/batches",d:"/tpo/placements",s:"/tpo/students",e:"/tpo/recruiters",c:"/tpo/calendar",r:"/tpo/requests",m:"/tpo/messages",p:"/tpo/reports",t:"/tpo/settings"};
const make:Record<string,string>={l:"/tpo/recruiters?add=1",d:"/tpo/placements/new"};
const goLabels:Record<string,string>={h:"Home",b:"Batches",d:"Drives",s:"Students",e:"Engage",c:"Calendar",r:"Requests",m:"Messages",p:"Reports",t:"Settings"};
export function TpoKeyboardShortcuts({showTrigger=true}:{showTrigger?:boolean}={}){
 const router=useRouter(),[open,setOpen]=useState(false);
 const prefix=useRef<"g"|"n"|null>(null);
 useEffect(()=>{
  let timeout:ReturnType<typeof setTimeout>|undefined;
  function onKey(event:KeyboardEvent){
   const t=event.target;
   if(event.ctrlKey||event.metaKey||event.altKey||event.repeat||event.isComposing||
      (t instanceof HTMLElement&&(t.isContentEditable||["INPUT","TEXTAREA","SELECT"].includes(t.tagName))))return;
   if(event.key==="Escape"){setOpen(false);prefix.current=null;return;}
   if(event.key==="?"){event.preventDefault();setOpen(true);prefix.current=null;return;}
   if(open)return;
   const k=event.key.toLowerCase();
   if(prefix.current){const link=(prefix.current==="g"?go:make)[k];prefix.current=null;
    if(timeout)clearTimeout(timeout);if(link){event.preventDefault();router.push(link);}return;}
   if(k==="g"||k==="n"){prefix.current=k;if(timeout)clearTimeout(timeout);timeout=setTimeout(()=>{prefix.current=null;},1200);}
  }
  document.addEventListener("keydown",onKey);
  return ()=>{document.removeEventListener("keydown",onKey);if(timeout)clearTimeout(timeout);};
 },[router,open]);
 return <>{showTrigger?<Button variant="secondary" type="button" aria-label="Keyboard shortcuts" onClick={()=>setOpen(true)}
  className="min-h-9">?</Button>:null}
  <Drawer title="Keyboard shortcuts" open={open} onOpenChange={setOpen}
   description="Press a key, then the next one. They do nothing while you are typing in a box.">
   <h3 className="font-semibold">Go to</h3>
   <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">{Object.entries(go).map(([key])=>
    <li key={key}><kbd>G</kbd> <kbd>{key.toUpperCase()}</kbd> · {goLabels[key]}</li>)}</ul>
   <h3 className="mt-4 font-semibold">Create</h3>
   <p>N then L · New recruiter lead</p><p>N then D · New drive</p>
   <h3 className="mt-4 font-semibold">Anywhere</h3>
   <p><kbd>Ctrl</kbd> <kbd>K</kbd> · Search and jump</p><p><kbd>?</kbd> · Show this list</p>
   <h3 className="mt-4 font-semibold">Reviewing applicants</h3>
   <p><kbd>S</kbd> · Shortlist</p><p><kbd>R</kbd> · Not selected</p>
   <p><kbd>←</kbd> <kbd>→</kbd> · Previous, next student</p>
  </Drawer></>;
}
