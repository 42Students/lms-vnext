"use client";
import Link from "next/link";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {useCallback,useEffect,useRef,useState} from "react";
import {recruiterBellAriaLabel,recruiterBellPreview,createRecruiterBellRequestGate,type RecruiterBellItem}
 from "@/modules/placements/recruiter-bell-model";
type DrawerResponse={status:string;unread:number;collegeId?:string;
 rows?:Array<RecruiterBellItem>;choices?:Array<{collegeId:string;collegeName:string}>};
export function RecruiterNotificationBell(){
 const [isOpen,setIsOpen]=useState(false);
 const triggerRef=useRef<HTMLButtonElement>(null);
 const popoverRef=useRef<HTMLElement>(null);
 const requestGate=useRef(createRecruiterBellRequestGate());
 const [data,setData]=useState<DrawerResponse|null>(null);
 const [collegeId,setCollegeId]=useState("");
 const [error,setError]=useState("");
 const load=useCallback(async()=>{
  const request=requestGate.current.begin();
  try{
   const query=collegeId?"?collegeId="+encodeURIComponent(collegeId):"";
   const res=await fetch("/api/placements/recruiter/notifications/drawer"+query,{cache:"no-store"});
   if(!res.ok)throw new Error("FAILED");
   const payload=await res.json() as DrawerResponse;
   if(!requestGate.current.isCurrent(request))return;
   // A mismatched backend selection is not a valid response to this picker.
   if(collegeId && payload.status==="READY" && payload.collegeId!==collegeId){
    setData(null);setError("Couldn't load notifications. Try again.");return;
   }
   setData(payload);setError("");
  }catch{
   if(!requestGate.current.isCurrent(request))return;
   // Grant/session changes must not leave an older private list visible.
   setData(null);setError("Couldn't load notifications. Try again.");
  }
 },[collegeId]);
 useEffect(()=>{
  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial and 30s polling load.
  void load();
  const interval=window.setInterval(()=>{if(document.visibilityState==="visible")void load();},30000);
  return ()=>{window.clearInterval(interval);requestGate.current.invalidate();};
 },[load]);
 useEffect(()=>{
  if(!isOpen)return;
  const keyDown=(event:KeyboardEvent)=>{
   if(event.key!=="Escape")return;
   event.preventDefault();
   setIsOpen(false);
   triggerRef.current?.focus();
  };
  const pointerDown=(event:PointerEvent)=>{
   const target=event.target;
   if(!(target instanceof Node))return;
   if(triggerRef.current?.contains(target)||popoverRef.current?.contains(target))return;
   setIsOpen(false);
  };
  document.addEventListener("keydown",keyDown);
  document.addEventListener("pointerdown",pointerDown);
  return ()=>{
   document.removeEventListener("keydown",keyDown);
   document.removeEventListener("pointerdown",pointerDown);
  };
 },[isOpen]);
 const href="/hr/notifications"+(data?.collegeId?"?collegeId="+encodeURIComponent(data.collegeId):"");
 return <div className="relative">
  <button ref={triggerRef} type="button" onClick={()=>{setIsOpen(!isOpen);if(!isOpen)void load();}}
    aria-expanded={isOpen} aria-haspopup="dialog"
    aria-label={recruiterBellAriaLabel(data?.unread??null)}
    className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius)] border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
    <span aria-hidden="true">🔔</span>
    {data?.unread&&data.unread>0?<span aria-hidden="true"
      className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs text-on-primary">
      {data.unread>99?"99+":data.unread}</span>:null}
  </button>
  {isOpen?<section ref={popoverRef} role="dialog" aria-modal="false" aria-label="Notifications"
    className="absolute right-0 top-full z-50 mt-2 w-[min(25rem,94vw)] rounded-xl border border-border bg-surface p-4 shadow-xl">
   <div className="flex items-center justify-between gap-3">
    <h2 className="font-semibold text-foreground">Notifications</h2>
    <button type="button" onClick={()=>setIsOpen(false)}
     aria-label="Close notifications" className="min-h-11 px-3 text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Close</button>
   </div>
   {error?<div role="alert" className="mt-3 text-sm text-error">{error}
    <button type="button" onClick={()=>void load()} className="ml-2 inline-flex min-h-11 items-center underline">Retry</button>
   </div>:null}
   {data?.status==="CHOOSE_COLLEGE"?
    <div className="mt-3 space-y-2 text-sm">{data.choices?.map(item=>
     <button type="button" key={item.collegeId} onClick={()=>{
       requestGate.current.invalidate();setData(null);setError("");setCollegeId(item.collegeId);
      }}
      className="block min-h-11 w-full rounded-lg border border-border p-3 text-left text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      {item.collegeName}</button>)}</div>:null}
   {data?.status==="READY"&&data.rows?.length===0?
     <p role="status" className="mt-4 text-sm text-muted-foreground">No notifications yet</p>:null}
   {data?.status==="READY"&&data.rows?.length?
    <ScrollCue axis="y" label="Recruiter notifications" className="mt-3" viewportClassName="max-h-[50vh]"><ul className="space-y-2">
     {recruiterBellPreview(data.rows).map(item=><li key={item.id}>
      <Link href={"/hr/placements/jobs/"+encodeURIComponent(item.jobId)}
       onClick={()=>setIsOpen(false)}
       className="block min-h-11 rounded-lg border border-border p-3 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
       {item.label} · {item.title}{item.unread?" · New":""}
      </Link></li>)}
    </ul></ScrollCue>:null}
   <Link href={href} onClick={()=>setIsOpen(false)}
    className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">See all notifications</Link>
  </section>:null}
 </div>;
}
