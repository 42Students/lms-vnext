"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {Drawer} from "@/components/ui/drawer";
import { PopoverPanel } from "@/components/ui/popover";
import style from "@/components/shell/topbar/topbar.module.css";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {tpoBellOpenHref} from "@/modules/activity/tpo-bell-open-model";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {tpoHeaderSnapshotSchema} from "@/modules/activity/tpo-header-snapshot-model";
export type BellItem={id:string;title:string;body:string|null;actionHref:string|null;readAt:string|null;createdAt:string};
export function TpoBellPanel({initialUnread,items,revision=0,compact=false}:{initialUnread:number;items:readonly BellItem[];revision?:number;compact?:boolean}){
 const [open,setOpen]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState("");
 const refreshInFlight=useRef(false);
 const root=useRef<HTMLDivElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const [mobile,setMobile]=useState(false);
 const [allReadRevision,setAllReadRevision]=useState<number|null>(null);
 const [readIds,setReadIds]=useState<string[]>([]);
 const [latest,setLatest]=useState<{items:BellItem[];unread:number}|null>(null);
 const [refreshing,setRefreshing]=useState(false);
 const displayedItems=latest?.items??items;
 const groupedItems=displayedItems.slice(0,20).reduce<{day:string;items:BellItem[]}[]>((groups,item)=>{
  const day=new Intl.DateTimeFormat("en-IN",{
   day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kolkata",
  }).format(new Date(item.createdAt));
  const last=groups[groups.length-1];
  if(last?.day===day)last.items.push(item);
  else groups.push({day,items:[item]});
  return groups;
 },[]);
 const unread=allReadRevision===revision?0:Math.max(0,(latest?.unread??initialUnread)-
  readIds.filter(id=>displayedItems.some(item=>item.id===id&&!item.readAt)).length);
 const router=useRouter();
 const refresh=useCallback(async()=>{
  if(refreshInFlight.current)return;
  refreshInFlight.current=true;
  setRefreshing(true);setError("");
  try{
   const payload=await apiFetch<unknown>("/api/tpo/header-snapshot",{
    cache:"no-store",credentials:"same-origin",timeoutMs:12000,
   });
   const parsed=tpoHeaderSnapshotSchema.safeParse(payload);
   if(!parsed.success)throw new Error("Couldn\u0027t refresh notifications.");
   setLatest({items:parsed.data.items,unread:parsed.data.unread});
   // A newer server snapshot supersedes local mark-all, even without a parent rerender.
   setAllReadRevision(null);
  }catch{setError("Couldn\u0027t refresh notifications. Showing the last messages we loaded.");}
  finally{refreshInFlight.current=false;setRefreshing(false);}
 },[]);
 useEffect(()=>{
  const check=()=>{if(document.visibilityState==="visible")void refresh();};
  const interval=window.setInterval(check,30000);
  window.addEventListener("focus",check);
  document.addEventListener("visibilitychange",check);
  return ()=>{window.clearInterval(interval);window.removeEventListener("focus",check);
   document.removeEventListener("visibilitychange",check);};
 },[refresh]);
 useEffect(()=>{
  const mq=window.matchMedia("(max-width:767px)");
  const update=()=>setMobile(mq.matches);
  update();mq.addEventListener("change",update);
  return ()=>mq.removeEventListener("change",update);
 },[]);
 useEffect(()=>{
  if(!open||mobile)return; // Both compact and full desktop popovers dismiss on outside interaction.
  const onPointer=(event:PointerEvent)=>{
   if(root.current&&!root.current.contains(event.target as Node))setOpen(false);
  };
  const onKey=(event:KeyboardEvent)=>{
   if(event.defaultPrevented||event.key!=="Escape"||
      !(event.target instanceof Node)||!root.current?.contains(event.target))return;
   event.preventDefault();setOpen(false);trigger.current?.focus();
  };
  document.addEventListener("pointerdown",onPointer);
  document.addEventListener("keydown",onKey);
  return ()=>{document.removeEventListener("pointerdown",onPointer);document.removeEventListener("keydown",onKey);};
 },[open,mobile,compact]);
 function changeOpen(next:boolean){setOpen(next);if(next)void refresh();}
 async function openItem(item:BellItem){
  if(pending)return;
  const href=tpoBellOpenHref(item.actionHref);
  if(!item.readAt&&!readIds.includes(item.id)){
   setPending(true);setError("");
   try{
    await apiFetch("/api/tpo/notifications/"+encodeURIComponent(item.id)+"/read",{
     method:"POST",credentials:"same-origin",timeoutMs:12000,
     headers:{"Content-Type":"application/json"},body:"{}",
    });
    setReadIds(ids=>ids.includes(item.id)?ids:[...ids,item.id]);

   }catch(reason){
    setError(reason instanceof Error?reason.message:friendlyApiError({network:true}));
    return;
   }finally{setPending(false);}
  }
  setOpen(false);
  if(href)router.push(href);
  else router.refresh();
 }
 async function markAll(){
  if(pending||unread===0)return;
  setPending(true);setError("");
  try{
   await apiFetch("/api/tpo/notifications/read-all",{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},body:"{}",
   });
   setAllReadRevision(revision);setReadIds(displayedItems.map(item=>item.id));router.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:friendlyApiError({network:true}));}
  finally{setPending(false);}
 }

 const panelFooter = <div role="group" aria-label="Notification inbox actions" className="flex flex-wrap gap-3"><Button variant="secondary" type="button" disabled={refreshing||pending} loading={refreshing} onClick={()=>void refresh()} className="min-h-11">Refresh</Button><Link className="min-h-11 inline-flex items-center text-sm underline" href="/tpo/notifications" onClick={()=>setOpen(false)}>See all notifications</Link>
    {unread>0?<Button variant="secondary" type="button" className="min-h-11" onClick={()=>void markAll()} disabled={pending} loading={pending}>{pending?"Saving…":"Mark all read"}</Button>:null}</div>;
 const panelBody = <>   {refreshing?<p role="status" className={style.topbarNotificationState}>Refreshing notifications…</p>:null}
   {!refreshing&&displayedItems.length===0&&!error?<div role="status" className={style.topbarNotificationState}><p className="font-medium">Nothing yet</p><p className="text-sm text-muted-foreground">Things that happen on your drives and recruiters show up here.</p></div> :displayedItems.length>0?<ul role="list" aria-label="Recent placement notifications" className="space-y-0">
    {groupedItems.map((group,index)=><li key={group.day+"-"+index} className="list-none">
    <p className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.day}</p>
    <ul role="list" aria-label={"Notifications for "+group.day} className="space-y-0">
    {group.items.map(item=><li key={item.id} className="mb-1.5 overflow-hidden rounded-[var(--lms-control-radius)] text-sm">
     <Button variant="ghost" type="button" disabled={pending} onClick={()=>void openItem(item)}
      className="w-full min-h-11 flex-col items-start justify-start gap-1 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 py-3 text-left hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
     <span className="block text-sm font-semibold leading-[1.4] text-foreground">{!item.readAt&&!readIds.includes(item.id)?<span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--lms-topbar-unread)]"/>:null}{item.title}{!item.readAt&&!readIds.includes(item.id)?<span className="sr-only"> New notification.</span>:null}</span>
     {item.body?<span className="mt-1 block line-clamp-2 break-words text-sm leading-[1.5] text-muted-foreground">{item.body}</span>:null}
     <time dateTime={item.createdAt} className="mt-1 block text-xs text-[var(--lms-muted-text)]">
      {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit",timeZone:"Asia/Kolkata"}).format(new Date(item.createdAt))}
     </time>
     <span className="mt-1 inline-block text-xs font-semibold text-primary-text">{!item.readAt&&!readIds.includes(item.id)?"New  →":"→"}</span>
     </Button>
    </li>)}</ul></li>)}</ul>:null}
   {error?<p role="alert" className={style.topbarNotificationError}>{error}</p>:null}
</>;
 return <div className="relative min-w-0" ref={root}>
  <Button ref={trigger} variant="secondary" size="sm" type="button" aria-label={unread>0?"Notifications, "+unread+" unread":"Notifications, no unread items"} aria-haspopup="dialog" aria-expanded={open} aria-busy={pending}
   aria-controls={open ? (mobile ? "tpo-notification-drawer" : "tpo-notification-popover") : undefined} disabled={pending} onClick={()=>changeOpen(!open)}
   className={compact
    ? "relative inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center md:h-9 md:w-9 md:min-h-9 md:min-w-9 rounded-[var(--lms-control-radius)] border border-border bg-surface text-foreground hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    : "min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm"}>
   {compact ? <>
    <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>
    </svg>
    {unread>0?<span aria-hidden="true"
      className="absolute -right-1.5 -top-1.5 inline-flex min-h-[17px] min-w-[17px] items-center justify-center rounded-[var(--lms-radius-pill)] border-2 border-surface bg-[var(--lms-topbar-unread)] px-0.5 text-[10px] font-bold leading-none text-white">
      {unread>99?"99+":unread}
    </span>:null}
   </> : <>Notifications {unread>0?"("+unread+" unread)":""}</>}
  </Button>
  {mobile
   ? <Drawer id="tpo-notification-drawer" open={open} onOpenChange={changeOpen} className={compact ? style.topbarNotificationDrawer : undefined}
       bodyClassName={compact ? style.topbarNotificationBody : undefined} title="Notifications"
       description="Most recent notifications from your own college." footer={panelFooter}>
       {panelBody}
     </Drawer>
   : open ? <PopoverPanel id="tpo-notification-popover" data-slot="notification-popover" label="Notifications"
       onDismiss={()=>{setOpen(false);trigger.current?.focus();}}
       className="absolute right-0 top-[calc(100%_+_8px)] z-[70] w-[min(420px,calc(100vw_-_24px))] max-h-[min(520px,calc(100dvh_-_120px))] overflow-y-auto p-4">
       <div className="mb-3 border-b border-border pb-3">
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <p className="text-xs text-muted-foreground">Most recent notifications from your own college.</p>
       </div>
       {panelBody}
       <div className="mt-3 border-t border-border pt-3">{panelFooter}</div>
     </PopoverPanel> : null}
 </div>;
}
