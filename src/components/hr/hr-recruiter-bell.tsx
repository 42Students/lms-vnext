"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {ScrollCue} from "@/components/ui/scroll-cue";
import { Button } from "@/components/ui/button";
import {createRecruiterBellRequestGate} from "@/modules/placements/recruiter-bell-model";
import {useCallback,useEffect,useRef,useState} from "react";
import {HR_BELL_EMPTY,HR_BELL_EMPTY_HELP,relativeHrBellTime,createHrBellMutationGate,parseHrBellResponse,type HrBellResponse} from "@/modules/placements/hr-recruiter-bell-model";
function isHrBellReadReceipt(value:unknown):value is {marked:number}{
 if(!value||typeof value!=="object"||!("marked" in value))return false;
 const count=(value as {marked:unknown}).marked;
 return typeof count==="number"&&Number.isSafeInteger(count)&&count>=0;
}
export function HrRecruiterBell(){
 const [state,setState]=useState<HrBellResponse|null>(null),[open,setOpen]=useState(false),
 [loading,setLoading]=useState(false),[error,setError]=useState(""),[saveError,setSaveError]=useState("");
 const [now,setNow]=useState(()=>Date.now());
 const markAllGate=useRef(createHrBellMutationGate());
 const loadGate=useRef(createRecruiterBellRequestGate());
 const triggerRef=useRef<HTMLButtonElement>(null);
 const panelRef=useRef<HTMLElement>(null);
 const load=useCallback(async()=>{
  const request=loadGate.current.begin();
  try{
   const res=await fetch("/api/placements/recruiter/bell",{
    cache:"no-store",credentials:"same-origin",redirect:"error",
   });
   if(!res.ok)throw Error("Unable to load");
   const payload:unknown=await res.json();
   const data=parseHrBellResponse(payload);
   if(!data)throw Error("INVALID_BELL_RESPONSE");
   if(!loadGate.current.isCurrent(request))return;
   setState(data);setError("");
  }catch{
   if(!loadGate.current.isCurrent(request))return;
   // A revoked/expired session cannot keep an old private feed on screen.
   setState(null);setError("Couldn't refresh your notifications");
  }finally{if(loadGate.current.isCurrent(request))setNow(Date.now());}
 },[]);
 useEffect(()=>{
  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial and 30s polling load.
  void load();
  const id=setInterval(()=>{void load();},30000);
  return ()=>{clearInterval(id);loadGate.current.invalidate();};
 },[load]);
 async function markAll(){
  if(!markAllGate.current.tryBegin())return;
  setLoading(true);setSaveError("");
  try{
   const res=await fetch("/api/placements/recruiter/bell",{method:"POST",
    credentials:"same-origin",redirect:"error",
    headers:{"Content-Type":"application/json",Accept:"application/json"},body:"{}"});
   if(!res.ok)throw Error("Could not save");
   const receipt:unknown=await res.json().catch(()=>null);
   if(!isHrBellReadReceipt(receipt))throw Error("Could not confirm read status");
   await load();
  }catch{setState(null);setSaveError("Read status could not be confirmed. Reload notifications before retrying.");}
  finally{markAllGate.current.end();setLoading(false);}
 }
 useEffect(()=>{
  if(!open)return;
  const onKey=(event:KeyboardEvent)=>{
   if(event.key!=="Escape")return;
   event.preventDefault();setOpen(false);triggerRef.current?.focus();
  };
  const onPointer=(event:PointerEvent)=>{
   const target=event.target;
   if(!(target instanceof Node)||panelRef.current?.contains(target)||
      triggerRef.current?.contains(target))return;
   setOpen(false);
  };
  document.addEventListener("keydown",onKey);
  document.addEventListener("pointerdown",onPointer);
  return ()=>{document.removeEventListener("keydown",onKey);
   document.removeEventListener("pointerdown",onPointer);};
 },[open]);
 const unread=state?.unread??0;
 return <div className="relative">
  <Button variant="secondary" ref={triggerRef} type="button" aria-label={"Notifications, "+unread+" new"}
   aria-expanded={open} aria-haspopup="dialog"
   onClick={()=>setOpen(value=>!value)}
   className="relative min-h-11 gap-1 rounded-[8px] px-3">
   Notifications {unread>0?<span className="ml-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#ff7576] px-1 text-[10px] leading-3 text-white">{unread}</span>:null}
  </Button>
  {open?<section ref={panelRef} role="dialog" aria-modal="false" aria-label="Recruiter notifications" className="absolute right-0 z-[1050] mt-2 max-h-[min(520px,calc(100dvh-120px))] w-[400px] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-[12px] border border-[#e5e9f0] bg-white p-4 shadow-[var(--lms-overlay-shadow)]">
   <div className="-mx-4 -mt-4 flex items-center justify-between gap-2 rounded-t-[12px] border-b border-[#e5e9f0] bg-[#fafbfc] px-4 py-3">
    <h2 className="text-[18px] font-semibold leading-[1.3] tracking-[-0.02em] text-[#1a1d21]">Notifications</h2>
    <Button variant="ghost" type="button" onClick={()=>{setOpen(false);triggerRef.current?.focus();}}
     className="min-h-11 px-3 text-primary-text">Close</Button>
   </div>
   {error?<p role="alert" className="mt-3 text-sm text-error">{state?error:"Couldn't load your notifications"}</p>:null}
   {!state&&!error?<p role="status" className="mt-3 text-sm text-body">Loading notifications…</p>:
    state?.status!=="READY"?<p className="mt-3 text-sm text-body">{error?"Couldn't load your notifications":"Choose a college to view your notifications."}</p>:
    state.items.length===0?<div className="mt-3 text-sm"><p className="font-semibold">{HR_BELL_EMPTY}</p>
     <p className="text-muted-foreground">{HR_BELL_EMPTY_HELP}</p></div>:
    <ScrollCue axis="y" label="Recruiter notifications" className="mt-3" viewportClassName="max-h-80"><ul className="divide-y divide-[var(--lms-canvas-border)]">{state.items.map(item=><li key={item.id}>
     <Link href={item.href} onClick={()=>setOpen(false)} className="flex min-h-11 items-start gap-2 rounded-[8px] px-3 py-3 text-sm text-body hover:bg-[var(--lms-neutral-50)] hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
      <span aria-hidden="true" className={item.unread?"mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary":"mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted"}/>
      <span className="flex-1">{item.label}</span><span className="text-xs text-muted-foreground">{relativeHrBellTime(item.at,now)}</span>
     </Link></li>)}</ul></ScrollCue>}
   <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
    <Link href="/hr/notifications" onClick={()=>setOpen(false)} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">More</Link>
    {unread>0?<Button variant="secondary" type="button" disabled={loading} loading={loading} onClick={()=>void markAll()}
      className="min-h-11 px-3">{loading?"Saving…":"Mark all read"}</Button>:null}
   </div>
   {saveError?<p role="alert" className="mt-2 text-xs text-error">{saveError}</p>:null}
  </section>:null}
 </div>;
}
