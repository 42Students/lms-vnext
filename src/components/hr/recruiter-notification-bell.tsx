"use client";
import { Button } from "@/components/ui/button";
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
  <Button ref={triggerRef} type="button" onClick={()=>{setIsOpen(!isOpen);if(!isOpen)void load();}}
    aria-expanded={isOpen} aria-haspopup="dialog"
    aria-label={recruiterBellAriaLabel(data?.unread??null)}
    variant="secondary" className="relative min-w-9 !px-2">
    <span aria-hidden="true">🔔</span>
    {data?.unread&&data.unread>0?<span aria-hidden="true"
      className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#ff7576] px-1 text-[10px] leading-3 text-white">
      {data.unread>99?"99+":data.unread}</span>:null}
  </Button>
  {isOpen?<section ref={popoverRef} data-slot="notification-popover" role="dialog" aria-modal="false" aria-label="Notifications"
    className="absolute right-0 top-full z-50 mt-2 max-h-[min(520px,calc(100dvh-120px))] w-[min(25rem,94vw)] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-[12px] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-[var(--lms-overlay-shadow)]">
   <div className="flex items-center justify-between gap-3">
    <h2 className="font-semibold text-foreground">Notifications</h2>
    <Button type="button" onClick={()=>setIsOpen(false)}
     aria-label="Close notifications" variant="ghost">Close</Button>
   </div>
   {error?<div role="alert" className="mt-3 text-sm text-error">{error}
    <Button type="button" onClick={()=>void load()} variant="ghost" className="ml-2 underline">Retry</Button>
   </div>:null}
   {data?.status==="CHOOSE_COLLEGE"?
    <div className="mt-3 space-y-2 text-sm">{data.choices?.map(item=>
     <Button type="button" key={item.collegeId} onClick={()=>{
       requestGate.current.invalidate();setData(null);setError("");setCollegeId(item.collegeId);
      }}
      variant="secondary" className="w-full justify-start text-left">
      {item.collegeName}</Button>)}</div>:null}
   {data?.status==="READY"&&data.rows?.length===0?
     <p role="status" className="mt-4 text-sm text-muted-foreground">No notifications yet</p>:null}
   {data?.status==="READY"&&data.rows?.length?
    <ScrollCue axis="y" label="Recruiter notifications" className="mt-3" viewportClassName="max-h-[50vh]"><ul className="divide-y divide-[var(--lms-canvas-border)]">
     {recruiterBellPreview(data.rows).map(item=><li key={item.id}>
      <Link href={"/hr/placements/jobs/"+encodeURIComponent(item.jobId)}
       onClick={()=>setIsOpen(false)}
       className="block min-h-11 rounded-[8px] px-3 py-3 text-sm text-primary-text hover:bg-[var(--lms-neutral-50)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
       {item.label} · {item.title}{item.unread?" · New":""}
      </Link></li>)}
    </ul></ScrollCue>:null}
   <Link href={href} onClick={()=>setIsOpen(false)}
    className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">See all notifications</Link>
  </section>:null}
 </div>;
}
