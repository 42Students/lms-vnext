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
   // Topbar search moves focus into option buttons while users continue typing.
   // Those keystrokes must never be interpreted as global G/N navigation chords.
   const inInteractiveSurface=t instanceof HTMLElement&&(
    t.isContentEditable||
    Boolean(t.closest('input, textarea, select, button, a, [role="option"], [role="listbox"], [data-slot="dialog"], [data-slot="drawer"], [data-slot="popover"]'))
   );
   if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||
      event.repeat||event.isComposing||inInteractiveSurface){
    prefix.current=null;
    return;
   }
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
 const keyClass="inline-flex min-h-7 min-w-7 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] px-2 text-xs font-semibold text-[var(--lms-body-text)]";
 return <>{showTrigger?<Button variant="secondary" type="button" aria-label="Keyboard shortcuts" onClick={()=>setOpen(true)}
  className="min-h-11 min-w-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 md:min-w-9">?</Button>:null}
  <Drawer title="Keyboard shortcuts" open={open} onOpenChange={setOpen}
   description="Press a key, then the next one. They do nothing while you are typing in a box.">
   <div className="min-w-0 space-y-5">
    <section aria-label="Go to keyboard shortcuts">
     <h3 className="text-sm font-semibold text-[var(--lms-heading)]">Go to</h3>
     <ul className="mt-2 grid min-w-0 grid-cols-1 gap-x-4 gap-y-0 text-sm md:grid-cols-2">
      {Object.entries(go).map(([key])=><li key={key} className="flex min-h-11 min-w-0 items-center gap-3 border-b border-[var(--lms-canvas-border)] py-2">
       <span className="flex shrink-0 items-center gap-1"><kbd className={keyClass}>G</kbd><kbd className={keyClass}>{key.toUpperCase()}</kbd></span>
       <span className="min-w-0 break-words">{goLabels[key]}</span>
      </li>)}
     </ul>
    </section>
    <section aria-label="Create keyboard shortcuts" className="border-t border-[var(--lms-canvas-border)] pt-4">
     <h3 className="text-sm font-semibold text-[var(--lms-heading)]">Create</h3>
     <ul className="mt-2 space-y-0 text-sm">
      <li className="flex min-h-11 flex-wrap items-center gap-2 border-b border-[var(--lms-canvas-border)] py-2"><kbd className={keyClass}>N</kbd> then <kbd className={keyClass}>L</kbd><span className="min-w-0 break-words">· New recruiter lead</span></li>
      <li className="flex min-h-11 flex-wrap items-center gap-2 py-2"><kbd className={keyClass}>N</kbd> then <kbd className={keyClass}>D</kbd><span className="min-w-0 break-words">· New drive</span></li>
     </ul>
    </section>
    <section aria-label="Anywhere keyboard shortcuts" className="border-t border-[var(--lms-canvas-border)] pt-4">
     <h3 className="text-sm font-semibold text-[var(--lms-heading)]">Anywhere</h3>
     <ul className="mt-2 space-y-0 text-sm">
      <li className="flex min-h-11 flex-wrap items-center gap-2 border-b border-[var(--lms-canvas-border)] py-2"><kbd className={keyClass}>Ctrl</kbd><kbd className={keyClass}>K</kbd><span className="min-w-0 break-words">· Search and jump</span></li>
      <li className="flex min-h-11 flex-wrap items-center gap-2 py-2"><kbd className={keyClass}>?</kbd><span className="min-w-0 break-words">· Show this list</span></li>
     </ul>
    </section>
    <section aria-label="Reviewing applicants keyboard shortcuts" className="border-t border-[var(--lms-canvas-border)] pt-4">
     <h3 className="text-sm font-semibold text-[var(--lms-heading)]">Reviewing applicants</h3>
     <ul className="mt-2 space-y-0 text-sm">
      <li className="flex min-h-11 items-center gap-2 border-b border-[var(--lms-canvas-border)] py-2"><kbd className={keyClass}>S</kbd><span className="min-w-0 break-words">· Shortlist</span></li>
      <li className="flex min-h-11 items-center gap-2 border-b border-[var(--lms-canvas-border)] py-2"><kbd className={keyClass}>R</kbd><span className="min-w-0 break-words">· Not selected</span></li>
      <li className="flex min-h-11 flex-wrap items-center gap-2 py-2"><kbd className={keyClass}>←</kbd><kbd className={keyClass}>→</kbd><span className="min-w-0 break-words">· Previous, next student</span></li>
     </ul>
    </section>
   </div>
  </Drawer></>;
}
