"use client";
import Link from "next/link";
import {useCallback,useEffect,useRef,useState} from "react";
import {learnerNotificationTarget} from "@/modules/activity/learner-notification-inbox-model";
type Row={notification:{id:string;title:string;body:string;actionHref:string|null;
 readAt:string|null;createdAt:string};event:{module:string}};
export function LearnerNotificationBell(){
 const [items,setItems]=useState<Row[]>([]);
 const [open,setOpen]=useState(false);
 const [error,setError]=useState("");
 const root=useRef<HTMLDivElement|null>(null);
 const [count,setCount]=useState(0);
 const refresh=useCallback(async()=>{
  try{
   const response=await fetch("/api/notifications?limit=40",{cache:"no-store"});
   if(!response.ok)throw new Error("FAILED");
   const body=await response.json() as {notifications?:Row[]};
   if(!Array.isArray(body.notifications))throw new Error("INVALID");
   setItems(body.notifications);
   setCount(body.notifications.filter(item=>item.notification.readAt===null).length);
   setError("");
  }catch{setError("Notifications could not be loaded. Retry without leaving this page.");}
 },[]);
 useEffect(()=>{
  void refresh();
  const interval=window.setInterval(()=>{if(document.visibilityState==="visible")void refresh();},30000);
  return ()=>window.clearInterval(interval);
 },[refresh]);
 useEffect(()=>{
  function clickOutside(event:MouseEvent){
   if(root.current&&!root.current.contains(event.target as Node))setOpen(false);
  }
  document.addEventListener("mousedown",clickOutside);
  return ()=>document.removeEventListener("mousedown",clickOutside);
 },[]);
 return <div className="relative shrink-0" ref={root}>
  <button type="button" aria-label={count>0?"Notifications, "+count+" new":"Notifications"}
    aria-haspopup="dialog" aria-expanded={open}
    onClick={()=>{setOpen(value=>!value);if(!open)void refresh();}}
    className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface hover:bg-primary-subtle">
    <span aria-hidden="true">🔔</span>
    {count>0?<span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs text-on-primary">
     {count>99?"99+":count}</span>:null}
  </button>
  {open?<section role="dialog" aria-modal="false" aria-label="Notifications"
   className="absolute right-0 top-full z-50 mt-2 w-[min(25rem,92vw)] rounded-xl border border-border bg-surface p-4 shadow-xl">
   <div className="flex items-center justify-between">
    <h2 className="font-semibold text-foreground">Notifications</h2>
    <button type="button" onClick={()=>setOpen(false)}
      className="min-h-11 px-2 text-sm text-primary-text">Close</button>
   </div>
   {error?<div role="alert" className="mt-2 text-sm text-error">{error}
    <button type="button" className="ml-2 underline" onClick={()=>void refresh()}>Retry</button>
   </div>:null}
   {items.length===0&&!error?<p role="status" className="mt-3 text-sm text-muted-foreground">No notifications yet</p>:null}
   <ul className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto">
    {items.slice(0,8).map(row=>{
     const target=learnerNotificationTarget(row.notification.actionHref)??"/learn/notifications";
     return <li key={row.notification.id}>
      <Link href={target} onClick={()=>setOpen(false)}
        className="block rounded-lg border border-border px-3 py-2 text-sm text-body">
       <span className="block font-semibold text-foreground">{row.notification.title}
        {row.notification.readAt===null?" · New":""}</span>
       <span className="mt-1 block line-clamp-2">{row.notification.body}</span>
      </Link>
     </li>;
    })}
   </ul>
   <Link href="/learn/notifications" onClick={()=>setOpen(false)}
     className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-text underline">
     See all notifications
   </Link>
  </section>:null}
 </div>;
}
