"use client";
import Link from "next/link";
import {useCallback,useEffect,useRef,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
import {learnerNotificationTarget} from "@/modules/activity/learner-notification-inbox-model";
type Due={key:string;title:string;body:string;href:string;dueAt:string};
type Row={notification:{id:string;title:string;body:string;actionHref:string|null;
 readAt:string|null;createdAt:string};event:{module:string}};
export function LearnerNotificationBell(){
 const [items,setItems]=useState<Row[]>([]);
 const [due,setDue]=useState<Due[]>([]);
 const [open,setOpen]=useState(false);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [everLoaded,setEverLoaded]=useState(false);
 const root=useRef<HTMLDivElement|null>(null);
 const trigger=useRef<HTMLButtonElement|null>(null);
 const [count,setCount]=useState(0);
 const refreshDue=useCallback(async()=>{
  try{
   const payload=await apiFetch<{notices?:Due[]}>("/api/courses/learner/due-notices",{cache:"no-store"});
   setDue(Array.isArray(payload.notices)?payload.notices:[]);
  }catch{ /* Existing personal notification inbox remains available. */ }
 },[]);
 const refresh=useCallback(async()=>{
  try{
   const body=await apiFetch<{notifications?:Row[]}>("/api/notifications?limit=40",{cache:"no-store"});
   if(!Array.isArray(body.notifications))throw new Error("Invalid notification response");
   setItems(body.notifications);
   setCount(body.notifications.filter(item=>item.notification.readAt===null).length);
   setError("");setEverLoaded(true);
  }catch{setError("Notifications could not be loaded. Retry without leaving this page.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{
  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial and 30s polling load.
  void refresh();
  const interval=window.setInterval(()=>{if(document.visibilityState==="visible")void refresh();},30000);
  return ()=>window.clearInterval(interval);
 },[refresh]);
 useEffect(()=>{
  function clickOutside(event:PointerEvent){
   if(root.current&&!root.current.contains(event.target as Node))setOpen(false);
  }
  document.addEventListener("pointerdown",clickOutside);
  return ()=>document.removeEventListener("pointerdown",clickOutside);
 },[]);
 useEffect(()=>{
  if(!open)return;
  const escape=(event:KeyboardEvent)=>{
   if(event.key!=="Escape")return;
   event.preventDefault();
   setOpen(false);
   trigger.current?.focus();
  };
  document.addEventListener("keydown",escape);
  return ()=>document.removeEventListener("keydown",escape);
 },[open]);
 return <div className="relative shrink-0" ref={root}>
  <button ref={trigger} type="button" aria-label={count>0?"Notifications, "+count+" new":"Notifications"}
    aria-haspopup="dialog" aria-expanded={open}
    onClick={()=>{setOpen(value=>!value);if(!open){void refresh();void refreshDue();}}}
    className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface hover:bg-primary-subtle">
    <span aria-hidden="true">🔔</span>
    {count>0?<span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs text-on-primary">
     {count>99?"99+":count}</span>:null}
  </button>
  {open?<section role="dialog" aria-modal="false" aria-label="Notifications"
   className="absolute right-0 top-full z-50 mt-2 max-h-[min(520px,calc(100dvh-120px))] w-[min(25rem,92vw)] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-[12px] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-[var(--lms-overlay-shadow)]">
   <div className="flex items-center justify-between">
    <h2 className="font-semibold text-foreground">Notifications</h2>
    <button type="button" onClick={()=>{setOpen(false);trigger.current?.focus();}}
      className="min-h-11 px-2 text-sm text-primary-text">Close</button>
   </div>
   {error?<div className="mt-2 space-y-2"><InlineNotice tone="error" message={error} onDismiss={()=>setError("")}/>
    <button type="button" className="inline-flex min-h-11 items-center text-sm text-primary-text underline" onClick={()=>void refresh()}>Retry notifications</button>
   </div>:null}
   {loading&&!everLoaded?<GracefulPageLoading/>:null}
   {error&&everLoaded?<p className="mt-2 text-xs text-muted-foreground">Showing the last successful notifications.</p>:null}
   {items.length===0&&!error&&!loading?<p role="status" className="mt-3 text-sm text-muted-foreground">No notifications yet</p>:null}
   {due.length>0?<section aria-label="Assignments due soon" className="mt-3">
    <h3 className="text-sm font-semibold text-foreground">Assignments due within 48 hours</h3>
    <ul className="mt-2 space-y-2">
     {due.slice(0,3).map(item=><li key={item.key}>
      <Link href={item.href} onClick={()=>setOpen(false)}
       className="block min-h-11 rounded-lg border border-warning p-3 text-sm text-body">
       {item.body}
      </Link></li>)}
    </ul>
    <p className="mt-1 text-xs text-muted-foreground">
     Live Course deadlines, not emailed or marked as read.
    </p>
   </section>:null}
   <ScrollCue axis="y" label="Learner notifications" className="mt-3" viewportClassName="max-h-[55vh]"><ul className="space-y-2">
    {items.slice(0,8).map(row=>{
     const target=learnerNotificationTarget(row.notification.actionHref)??"/learn/notifications";
     return <li key={row.notification.id}>
      <Link href={target} onClick={()=>setOpen(false)}
        className="block min-h-11 rounded-lg border border-border p-3 text-sm text-body">
       <span className="block font-semibold text-foreground">{row.notification.title}
        {row.notification.readAt===null?" · New":""}</span>
       <span className="mt-1 block line-clamp-2">{row.notification.body}</span>
      </Link>
     </li>;
    })}
   </ul></ScrollCue>
   <Link href="/learn/notifications" onClick={()=>setOpen(false)}
     className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-text underline">
     See all notifications
   </Link>
  </section>:null}
 </div>;
}
