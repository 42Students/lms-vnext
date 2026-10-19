"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {Drawer} from "@/components/ui/drawer";
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
 const [allReadRevision,setAllReadRevision]=useState<number|null>(null);
 const [readIds,setReadIds]=useState<string[]>([]);
 const [latest,setLatest]=useState<{items:BellItem[];unread:number}|null>(null);
 const [refreshing,setRefreshing]=useState(false);
 const refreshInFlight=useRef(false);
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
 return <div className="relative min-w-0">
  <Button variant="secondary" size="sm" type="button" aria-label={unread>0?"Notifications, "+unread+" unread":"Notifications, no unread items"} aria-haspopup="dialog" aria-expanded={open} aria-busy={pending} disabled={pending} onClick={()=>changeOpen(!open)}
   className={compact
    ? "relative inline-flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    : "min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm"}>
   {compact ? <>
    <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>
    </svg>
    {unread>0?<span aria-hidden="true"
      className="absolute -right-1.5 -top-1.5 inline-flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-surface bg-[var(--lms-notification-unread,#ff7576)] px-0.5 text-[10px] font-bold leading-none text-white">
      {unread>99?"99+":unread}
    </span>:null}
   </> : <>Notifications {unread>0?"("+unread+" unread)":""}</>}
  </Button>
  <Drawer open={open} onOpenChange={changeOpen} className={compact ? style.topbarNotificationDrawer : undefined}
   bodyClassName={compact ? style.topbarNotificationBody : undefined} title="Notifications"
   description="Most recent notifications from your own college."
   footer={<div className="flex flex-wrap gap-3"><Button variant="secondary" type="button" disabled={refreshing||pending} onClick={()=>void refresh()} className="min-h-11">Refresh</Button><Link className="min-h-11 inline-flex items-center text-sm underline" href="/tpo/notifications" onClick={()=>setOpen(false)}>See all notifications</Link>
    {unread>0?<Button variant="secondary" type="button" className="min-h-11" onClick={()=>void markAll()} disabled={pending}>{pending?"Saving…":"Mark all read"}</Button>:null}</div>}>

   {refreshing?<p role="status" className={style.topbarNotificationState}>Refreshing notifications…</p>:null}
   {!refreshing&&displayedItems.length===0&&!error?<div role="status" className={style.topbarNotificationState}><p className="font-medium">Nothing yet</p><p className="text-sm text-muted-foreground">Things that happen on your drives and recruiters show up here.</p></div> :displayedItems.length>0?<ul role="list" aria-label="Recent placement notifications" className="space-y-0">
    {groupedItems.map((group,index)=><li key={group.day+"-"+index} className="list-none">
    <p className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.day}</p>
    <ul role="list" aria-label={"Notifications for "+group.day} className="space-y-0">
    {group.items.map(item=><li key={item.id} className="mb-1.5 overflow-hidden rounded-[8px] text-sm">
     <Button variant="ghost" type="button" disabled={pending} onClick={()=>void openItem(item)}
      className="w-full min-h-11 flex-col items-start justify-start gap-1 rounded-[8px] border border-border bg-surface px-4 py-3 text-left hover:bg-[var(--lms-neutral-50)]">
     <span className="block text-sm font-semibold leading-[1.4] text-foreground">{!item.readAt&&!readIds.includes(item.id)?<span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--lms-notification-unread,#ff7576)]"/>:null}{item.title}{!item.readAt&&!readIds.includes(item.id)?<span className="sr-only"> New notification.</span>:null}</span>
     {item.body?<span className="mt-1 block line-clamp-2 break-words text-sm leading-[1.5] text-muted-foreground">{item.body}</span>:null}
     <time dateTime={item.createdAt} className="mt-1 block text-xs text-[var(--lms-muted-text)]">
      {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit",timeZone:"Asia/Kolkata"}).format(new Date(item.createdAt))}
     </time>
     <span className="mt-1 inline-block text-xs font-semibold text-primary-text">{!item.readAt&&!readIds.includes(item.id)?"New  →":"→"}</span>
     </Button>
    </li>)}</ul></li>)}</ul>:null}
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  </Drawer>
 </div>;
}
