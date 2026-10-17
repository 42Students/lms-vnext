"use client";
import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import {HR_BELL_EMPTY,HR_BELL_EMPTY_HELP,relativeHrBellTime,type HrBellResponse} from "@/modules/placements/hr-recruiter-bell-model";
export function HrRecruiterBell(){
 const [state,setState]=useState<HrBellResponse|null>(null),[open,setOpen]=useState(false),
 [loading,setLoading]=useState(false),[error,setError]=useState(""),[saveError,setSaveError]=useState("");
 const [now,setNow]=useState(()=>Date.now());
 const load=useCallback(async()=>{
  try{
   const res=await fetch("/api/placements/recruiter/bell",{cache:"no-store"});
   if(!res.ok)throw Error("Unable to load");
   const data=await res.json() as HrBellResponse;setState(data);setNow(Date.now());setError("");
  }catch{setError("Couldn't refresh your notifications");}
 },[]);
 useEffect(()=>{
  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial and 30s polling load.
  void load();
  const id=setInterval(()=>{void load();},30000);
  return ()=>clearInterval(id);
 },[load]);
 async function markAll(){
  if(loading)return;setLoading(true);setSaveError("");
  try{
   const res=await fetch("/api/placements/recruiter/bell",{method:"POST",
    headers:{"Content-Type":"application/json"},body:"{}"});
   if(!res.ok)throw Error("Could not save");
   await load();
  }catch{setSaveError("Notifications loaded, but read status could not be saved");}
  finally{setLoading(false);}
 }
 const unread=state?.unread??0;
 return <div className="relative">
  <button type="button" aria-label={"Notifications, "+unread+" new"} aria-expanded={open}
   onClick={()=>{
    if(!open && state?.status==="READY" && (state.unread??0)>0 &&
       state.items.filter(item=>item.unread).length>=state.unread)void markAll();
    setOpen(value=>!value);
   }} className="relative min-h-10 rounded border border-border px-3 text-sm font-semibold text-foreground">
   Notifications {unread>0?<span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-on-primary">{unread}</span>:null}
  </button>
  {open?<section aria-label="Recruiter notifications" className="absolute right-0 z-50 mt-2 w-[400px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-4 shadow-lg">
   <div className="flex items-center justify-between gap-2">
    <h2 className="font-semibold">Notifications</h2>
    <button type="button" onClick={()=>setOpen(false)} className="text-sm text-primary-text">Close</button>
   </div>
   {error?<p role="alert" className="mt-3 text-sm text-error">{state?error:"Couldn't load your notifications"}</p>:null}
   {!state&&!error?<p role="status" className="mt-3 text-sm text-body">Loading notifications…</p>:
    state?.status!=="READY"?<p className="mt-3 text-sm text-body">{error?"Couldn't load your notifications":"Choose a college to view your notifications."}</p>:
    state.items.length===0?<div className="mt-3 text-sm"><p className="font-semibold">{HR_BELL_EMPTY}</p>
     <p className="text-muted-foreground">{HR_BELL_EMPTY_HELP}</p></div>:
    <ul className="mt-3 max-h-80 divide-y divide-border overflow-auto">{state.items.map(item=><li key={item.id} className="py-2">
     <Link href={item.href} onClick={()=>setOpen(false)} className="flex items-start gap-2 text-sm text-body hover:text-primary-text">
      <span aria-hidden="true" className={item.unread?"mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary":"mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted"}/>
      <span className="flex-1">{item.label}</span><span className="text-xs text-muted-foreground">{relativeHrBellTime(item.at,now)}</span>
     </Link></li>)}</ul>}
   <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
    <Link href="/hr/notifications" onClick={()=>setOpen(false)} className="text-sm font-semibold text-primary-text underline">More</Link>
    {unread>0?<button type="button" disabled={loading} onClick={()=>void markAll()}
      className="rounded border border-border px-3 py-2 text-sm disabled:opacity-50">{loading?"Saving…":"Mark all read"}</button>:null}
   </div>
   {saveError?<p role="alert" className="mt-2 text-xs text-error">{saveError}</p>:null}
  </section>:null}
 </div>;
}
