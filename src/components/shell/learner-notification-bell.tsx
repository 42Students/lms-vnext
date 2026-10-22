"use client";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {PopoverPanel} from "@/components/ui/popover";
import {TopbarNotificationEmpty} from "./topbar/notification-empty";
import {Drawer} from "@/components/ui/drawer";
import style from "./topbar/topbar.module.css";
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
 const [mobile,setMobile]=useState(false);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [everLoaded,setEverLoaded]=useState(false);
 const root=useRef<HTMLDivElement|null>(null);
 const refreshInFlight=useRef(false);
 const trigger=useRef<HTMLButtonElement|null>(null);
 const [count,setCount]=useState(0);
 useEffect(()=>{
  const media=window.matchMedia("(max-width: 767px)");
  const update=()=>setMobile(media.matches);
  update();
  media.addEventListener("change",update);
  return ()=>media.removeEventListener("change",update);
 },[]);
 const refreshDue=useCallback(async()=>{
  try{
   const payload=await apiFetch<{notices?:Due[]}>("/api/courses/learner/due-notices",{cache:"no-store"});
   setDue(Array.isArray(payload.notices)?payload.notices:[]);
  }catch{ /* Existing personal notification inbox remains available. */ }
 },[]);
 const refresh=useCallback(async()=>{
  if(refreshInFlight.current)return;
  refreshInFlight.current=true;
  setLoading(true);
  try{
   const body=await apiFetch<{notifications?:Row[]}>("/api/notifications?limit=40",{cache:"no-store"});
   if(!Array.isArray(body.notifications))throw new Error("Invalid notification response");
   setItems(body.notifications);
   setCount(body.notifications.filter(item=>item.notification.readAt===null).length);
   setError("");setEverLoaded(true);
  }catch{setError("Notifications could not be loaded. Retry without leaving this page.");}
  finally{setLoading(false);refreshInFlight.current=false;}
 },[]);
 useEffect(()=>{
  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial and 30s polling load.
  void refresh();
  const check=()=>{if(document.visibilityState==="visible")void refresh();};
  const interval=window.setInterval(check,30000);
  window.addEventListener("focus",check);
  window.addEventListener("placement-announcements-read",check);
  document.addEventListener("visibilitychange",check);
  return ()=>{window.clearInterval(interval);window.removeEventListener("focus",check);window.removeEventListener("placement-announcements-read",check);document.removeEventListener("visibilitychange",check);};
 },[refresh]);
 useEffect(()=>{
  function clickOutside(event:PointerEvent){
   if(mobile)return;
   if(root.current&&!root.current.contains(event.target as Node))setOpen(false);
  }
  document.addEventListener("pointerdown",clickOutside);
  return ()=>document.removeEventListener("pointerdown",clickOutside);
 },[mobile]);
 useEffect(()=>{
  if(!open||mobile)return;
  const escape=(event:KeyboardEvent)=>{
   if(event.defaultPrevented||event.key!=="Escape"||
      !(event.target instanceof Node)||!root.current?.contains(event.target))return;
   event.preventDefault();
   setOpen(false);
   trigger.current?.focus();
  };
  document.addEventListener("keydown",escape);
  return ()=>document.removeEventListener("keydown",escape);
 },[open,mobile]);
 const panelFooter=<>
   <Link href="/learn/notifications" onClick={()=>setOpen(false)}
     className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:underline">
     See all notifications
   </Link>
 </>;
 const panelBody=<>
   {error?<div className="min-w-0 space-y-2 border-b border-border pb-3"><InlineNotice tone="error" message={error} onDismiss={()=>setError("")}/>
    <Button variant="ghost" type="button" className="w-full min-h-11 min-[768px]:w-auto text-sm text-primary-text underline" loading={loading} disabled={loading} onClick={()=>void refresh()}>Retry notifications</Button>
   </div>:null}
   {loading&&!everLoaded?<div data-learner-notification-state="" role="status"><GracefulPageLoading/></div>:null}
   {error&&everLoaded?<p className="mt-2 text-xs text-muted-foreground leading-[20px]">Showing the last successful notifications.</p>:null}
   {loading&&everLoaded?<p role="status" className="px-4 py-2 text-xs text-muted-foreground leading-[20px]">Refreshing notifications…</p>:null}
   {items.length===0&&!error&&!loading?<TopbarNotificationEmpty title="No notifications yet"/>:null}
   {due.length>0?<section aria-labelledby="learner-bell-due-heading" className="mt-3">
    <h3 id="learner-bell-due-heading" className="text-sm font-semibold text-[var(--lms-heading)]">Assignments due within 48 hours</h3>
    <ul className="mt-2 space-y-2">
     {due.slice(0,3).map(item=><li key={item.key}>
      <Link href={item.href} onClick={()=>setOpen(false)}
       className="block min-h-11 rounded-[var(--lms-control-radius)] border border-warning bg-warning-subtle p-3 text-sm text-body hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
       {item.body}
      </Link></li>)}
    </ul>
    <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
     Live Course deadlines, not emailed or marked as read.
    </p>
   </section>:null}
   <ScrollCue axis="y" label="Learner notifications" className="mt-3 min-w-0" viewportClassName="max-h-[55vh]"><ul role="list" aria-label="Recent learner notifications" className="divide-y divide-border">
    {items.slice(0,8).map(row=>{
     const target=learnerNotificationTarget(row.notification.actionHref)??"/learn/notifications";
     return <li key={row.notification.id}>
      <Link href={target} onClick={()=>setOpen(false)}
        className="block min-h-11 min-w-0 px-3 py-3 text-sm text-body hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
       <span className="block font-semibold text-foreground">{row.notification.title}
        {row.notification.readAt===null?" · New":""}</span>
       <span className="mt-1 block min-w-0 line-clamp-2 break-words leading-[1.5] text-muted-foreground">{row.notification.body}</span>
       <time dateTime={row.notification.createdAt} className="mt-1 block text-xs text-muted-foreground leading-[20px]">{new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit",timeZone:"Asia/Kolkata"}).format(new Date(row.notification.createdAt))}</time>
      </Link>
     </li>;
    })}
   </ul></ScrollCue>

 </>;
 return <div className="relative shrink-0" ref={root}>
  <Button variant="secondary" size="icon" ref={trigger} type="button" aria-label={count>0?"Notifications, "+count+" unread":"Notifications, no unread items"}
    aria-haspopup="dialog" aria-expanded={open} aria-controls={open?(mobile?"lms-learner-mobile-notifications":"lms-learner-notifications"):undefined}
    onClick={()=>{setOpen(value=>!value);if(!open){void refresh();void refreshDue();}}}
    className="relative inline-flex h-11 w-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none">
    <span aria-hidden="true">🔔</span>
    {count>0?<span aria-hidden="true" className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-[var(--lms-radius-pill)] bg-[var(--lms-topbar-unread)] px-1 text-[10px] font-bold leading-none text-white">
     {count>99?"99+":count}</span>:null}
  </Button>
  {open ? mobile ? <Drawer id="lms-learner-mobile-notifications" open={open} onOpenChange={setOpen} title="Notifications" className={style["learnerNotificationDrawer"]} bodyClassName={style["learnerNotificationDrawer"]Body} footer={panelFooter}>{panelBody}</Drawer> : <PopoverPanel id="lms-learner-notifications" label="Notifications" aria-busy={loading} className={style["learnerNotificationPopover"]}
  onDismiss={()=>{setOpen(false);trigger.current?.focus();}}>
   <div className="flex items-center justify-between">
    <h2 id="learner-notification-title" className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Notifications</h2>
    <Button variant="ghost" type="button" onClick={()=>{setOpen(false);trigger.current?.focus();}}
      className="min-h-11 px-2 text-sm text-primary-text">Close</Button>
   </div>
   <div className={style["learnerNotificationBody"]}>{panelBody}</div>
   <footer className={style["learnerNotificationFooter"]}>{panelFooter}</footer>
  </PopoverPanel> : null}
 </div>;
}
