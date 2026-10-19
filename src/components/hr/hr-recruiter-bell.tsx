"use client";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import Link from "next/link";
import {ScrollCue} from "@/components/ui/scroll-cue";
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

 const unread=state?.unread??0;
 return <div className="relative">
  <Button ref={triggerRef} type="button" aria-label={"Notifications, "+unread+" new"}
   aria-expanded={open} aria-haspopup="dialog"
   onClick={()=>setOpen(value=>!value)}
   variant="secondary" className="relative">
   Notifications {unread>0?<span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-on-primary">{unread}</span>:null}
  </Button>
  <Drawer open={open} onOpenChange={setOpen} title="Recruiter notifications">
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
    <Link href="/hr/notifications" onClick={()=>setOpen(false)} className="inline-flex min-h-9 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">More</Link>
    {unread>0?<Button type="button" disabled={loading} onClick={()=>void markAll()}
      variant="secondary">{loading?"Saving…":"Mark all read"}</Button>:null}
   </div>
   {saveError?<p role="alert" className="mt-2 text-xs text-error">{saveError}</p>:null}
  </Drawer>
 </div>;
}
