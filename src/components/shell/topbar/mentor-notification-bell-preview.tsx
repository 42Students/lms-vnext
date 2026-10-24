"use client";
import Link from "next/link";
import {useEffect,useRef,useState,type MouseEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {safeNotificationActionHref} from "@/modules/activity/notification-action";
import {mentorUnifiedOpenReadRequest,type MentorUnifiedNotification}
 from "@/modules/projects/mentor-unified-notification-model";
import {shellUnreadBadge} from "../shell-counts-model";
import {BellIcon} from "./icons";
import style from "./topbar.module.css";

type PreviewResponse={items:MentorUnifiedNotification[];hasMore:boolean};
/** The Mentor portal gets its own verified merged-source bell, not the generic
 * learner/recruiter drawer nor a copy of unverified legacy sample notices.
 */
export function MentorNotificationBellPreview({unreadCount,partial}:{
 unreadCount:number|null;partial:boolean;
}){
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [working,setWorking]=useState<string|null>(null);
 const [items,setItems]=useState<readonly MentorUnifiedNotification[]>([]);
 const [hasMore,setHasMore]=useState(false);
 const [error,setError]=useState("");
 const root=useRef<HTMLDivElement>(null);
 const router=useRouter();
 useEffect(()=>{
  if(!open)return;
  const close=(event:PointerEvent)=>{
   if(root.current&&!root.current.contains(event.target as Node))setOpen(false);
  };
  const escape=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){setOpen(false);
      root.current?.querySelector<HTMLButtonElement>("button[data-bell-trigger]")?.focus();}
  };
  document.addEventListener("pointerdown",close);
  document.addEventListener("keydown",escape);
  return ()=>{
   document.removeEventListener("pointerdown",close);
   document.removeEventListener("keydown",escape);
  };
 },[open]);
 async function load(){
  setBusy(true);setError("");
  try{
   const payload=await apiFetch<PreviewResponse>(
      "/api/mentor/notifications/preview",{
       cache:"no-store",credentials:"same-origin",timeoutMs:12000,
      });
   if(!Array.isArray(payload.items))throw Error("Invalid notification preview");
   setItems(payload.items.slice(0,5));setHasMore(payload.hasMore===true);
  }catch(caught){setError(caught instanceof Error?caught.message:
    "Couldn't load your Mentor notifications.");}
  finally{setBusy(false);}
 }
 function toggle(){
  if(open){setOpen(false);return;}
  setOpen(true);void load();
 }
 async function markOne(event:MouseEvent<HTMLAnchorElement>,
   item:MentorUnifiedNotification,href:string){
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||
     event.altKey||event.defaultPrevented)return;
  const request=mentorUnifiedOpenReadRequest(item);
  if(!request)return;
  event.preventDefault();
  if(working)return;
  setWorking(item.source+":"+item.id);setError("");
  try{
   await apiFetch(request.url,{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    ...(request.body?{body:request.body,
      headers:{"content-type":"application/json"}}:{}),
   });
   window.dispatchEvent(new Event("lms:notifications-updated"));
   setOpen(false);router.push(href);router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:
    "Could not acknowledge this item; try again.");}
  finally{setWorking(null);}
 }
 async function markAll(){
  if(working||!window.confirm(
   "Mark all currently visible personal, project-attention and college notifications as read? New changes will still appear."))return;
  setWorking("all");setError("");
  try{
   await apiFetch("/api/mentor/notifications/unified-read-all",{
    method:"POST",credentials:"same-origin",timeoutMs:25000,
   });
   window.dispatchEvent(new Event("lms:notifications-updated"));
   await load();router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:
    "Could not mark all notifications read.");}
  finally{setWorking(null);}
 }
 const badge=shellUnreadBadge(unreadCount);
 return <div ref={root} className="relative shrink-0">
  <button type="button" data-bell-trigger
   className={style.iconButton+" shrink-0"}
   aria-label={"Mentor notifications"+(unreadCount!==null?
     ", "+(partial?"at least ":"")+unreadCount+" unread":"")}
   aria-haspopup="dialog" aria-expanded={open}
   onClick={toggle}>
   <BellIcon/>
   {badge?<span className={style.badge} aria-hidden="true">{badge}</span>:null}
  </button>
  {open?<section role="dialog" aria-label="Recent Mentor notifications"
    className="absolute right-0 top-full z-50 mt-2 max-h-[75vh] w-[min(22rem,90vw)] overflow-y-auto rounded-xl border border-border bg-surface p-3 shadow-xl">
   <div className="mb-3 flex items-center justify-between gap-2">
    <h2 className="font-semibold">Recent notifications</h2>
    <button type="button" className="text-sm underline"
      onClick={()=>setOpen(false)}>Close</button>
   </div>
   {busy?<p role="status">Loading verified notifications…</p>:null}
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   {!busy&&!items.length?<p role="status" className="text-sm">
     No notifications found in the loaded sources.</p>:null}
   <ol className="space-y-2">
    {items.map(item=>{
     const href=safeNotificationActionHref(item.actionHref);
     const key=item.source+":"+item.id;
     return <li key={key} className="space-y-1 border-b border-border py-2">
      <div className="flex justify-between gap-2">
       <small className="text-muted-foreground">{item.source==="PERSONAL"?
        "Personal":item.source==="ATTENTION"?"Project attention":"College"}</small>
       {item.read===false?<small className="font-semibold">Unread</small>:null}
      </div>
      <strong className="block text-sm">{item.title}</strong>
      <p className="line-clamp-2 text-xs">{item.description}</p>
      <div className="flex items-center justify-between gap-2 text-xs">
       <time dateTime={item.occurredAt}>
        {new Date(item.occurredAt).toLocaleDateString("en-IN",{
         day:"numeric",month:"short",timeZone:"Asia/Kolkata"})}
       </time>
       {href?<Link href={href}
         onClick={event=>void markOne(event,item,href)}
         aria-disabled={working===key}
         className="min-h-8 text-link underline">
          {working===key?"Marking read…":"Open →"}
       </Link>:null}
      </div>
     </li>;
    })}
   </ol>
   <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
    <button type="button" className="text-xs underline"
     disabled={working!==null||busy}
     onClick={()=>void markAll()}>Mark all read</button>
    <Link href="/mentor/notifications" onClick={()=>setOpen(false)}
      className="text-sm font-semibold text-link underline">
      See all{hasMore?" notifications":" notifications"} →
    </Link>
   </div>
  </section>:null}
 </div>;
}
