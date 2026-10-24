"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState,type MouseEvent} from "react";
import {Button} from "@/components/ui/button";
import {apiFetch} from "@/lib/api-fetch";
import {safeNotificationActionHref} from "@/modules/activity/notification-action";
import {mentorUnifiedNotificationGroups,mentorUnifiedOpenReadRequest,mergeMentorUnifiedPages,type MentorUnifiedNotification} from
  "@/modules/projects/mentor-unified-notification-model";
import {MentorSourceNotificationRead} from "./mentor-source-notification-read";

function MentorPersonalRead({id}:{id:string}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function mark(){
  if(busy)return;
  setBusy(true);setError("");
  try{
   await apiFetch("/api/mentor/notifications/"+encodeURIComponent(id)+"/read",{
    method:"POST",timeoutMs:12000,
   });
   window.dispatchEvent(new Event("lms:notifications-updated"));
     router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:
    "Unable to acknowledge your personal notification.");}
  finally{setBusy(false);}
 }
 return <div className="inline-flex flex-col items-start gap-1">
  <Button size="sm" type="button" variant="secondary" disabled={busy}
    loading={busy} onClick={()=>void mark()}>Mark read</Button>
  {error?<span role="alert" className="text-xs text-error">{error}</span>:null}
 </div>;
}
type NoticeCursor={beforePinned:string;beforeCreatedAt:string;beforeId:string};
type PersonalCursor={beforeCreatedAt:string;beforeId:string};
type NoticePage={items:MentorUnifiedNotification[];nextCursor:NoticeCursor|null};
type PersonalPage={items:MentorUnifiedNotification[];nextCursor:PersonalCursor|null};
export function MentorUnifiedNotificationFeed({items,announcementNextCursor,personalNextCursor,
 unreadOnly=false}:{
 items:readonly MentorUnifiedNotification[];
 announcementNextCursor:NoticeCursor|null;
 personalNextCursor:PersonalCursor|null;
 unreadOnly?:boolean;
}){
 const [olderNotices,setOlderNotices]=useState<MentorUnifiedNotification[]>([]);
 const [nextNotices,setNextNotices]=useState(announcementNextCursor);
 const [olderPersonal,setOlderPersonal]=useState<MentorUnifiedNotification[]>([]);
 const [nextPersonal,setNextPersonal]=useState(personalNextCursor);
 const [loadingPersonal,setLoadingPersonal]=useState(false);
 const [personalError,setPersonalError]=useState("");
 const [loadingMore,setLoadingMore]=useState(false);
 const [olderError,setOlderError]=useState("");
 const combined=mergeMentorUnifiedPages(items,olderNotices,olderPersonal,unreadOnly);
 async function loadOlderPersonal(){
  if(loadingPersonal||!nextPersonal)return;
  setLoadingPersonal(true);setPersonalError("");
  try{
   const query=new URLSearchParams({view:unreadOnly?"unread":"all",
     beforeCreatedAt:nextPersonal.beforeCreatedAt,beforeId:nextPersonal.beforeId});
   const page=await apiFetch<PersonalPage>(
     "/api/mentor/notifications/personal?"+query.toString(),
     {cache:"no-store",credentials:"same-origin",timeoutMs:15000});
   setOlderPersonal(previous=>{
     const known=new Set(previous.map(row=>row.id));
     return [...previous,...page.items.filter(
      item=>item.source==="PERSONAL"&&!known.has(item.id))];
   });
   setNextPersonal(page.nextCursor);
  }catch(caught){setPersonalError(caught instanceof Error?caught.message:
     "Could not load older personal messages.");}
  finally{setLoadingPersonal(false);}
 }
 const groups=mentorUnifiedNotificationGroups(combined);
 async function loadOlderNotices(){
  if(loadingMore||!nextNotices)return;
  setLoadingMore(true);setOlderError("");
  try{
   const query=new URLSearchParams({
     beforePinned:nextNotices.beforePinned,
     beforeCreatedAt:nextNotices.beforeCreatedAt,
     beforeId:nextNotices.beforeId,
   });
   const page=await apiFetch<NoticePage>(
     "/api/mentor/notifications/announcements?"+query.toString(),
     {cache:"no-store",credentials:"same-origin",timeoutMs:15000});
   setOlderNotices(previous=>{
     const known=new Set(previous.map(row=>row.source+":"+row.id));
     return [...previous,...page.items.filter(item=>{
       const key=item.source+":"+item.id;
       if(item.source!=="ANNOUNCEMENT"||known.has(key))return false;
       known.add(key);return true;
     })];
   });
   setNextNotices(page.nextCursor);
  }catch(caught){setOlderError(caught instanceof Error?caught.message:
     "Could not load older college announcements.");}
  finally{setLoadingMore(false);}
 }
 const router=useRouter();
 const [opening,setOpening]=useState<string|null>(null);
 const [openError,setOpenError]=useState("");
 function openNotification(event:MouseEvent<HTMLAnchorElement>,
  item:MentorUnifiedNotification,href:string){
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||
     event.altKey||event.defaultPrevented||opening)return;
  const request=mentorUnifiedOpenReadRequest(item);
  if(!request)return;
  event.preventDefault();
  setOpening(item.source+":"+item.id);setOpenError("");
  void apiFetch(request.url,{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    ...(request.body?{body:request.body,
      headers:{"content-type":"application/json"}}:{}),
  }).then(()=>{
    window.dispatchEvent(new Event("lms:notifications-updated"));
    router.push(href);
    router.refresh();
  }).catch(reason=>{
    setOpenError("Couldn't mark this item as read. Retry Open or use Mark read."+
      (reason instanceof Error?" "+reason.message:""));
  }).finally(()=>setOpening(null));
 }
 return <section className="min-w-0 space-y-3" aria-label="Mentor chronological notifications">
  <header className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-lg font-semibold">Your notifications · {combined.length} loaded</h2>
    <p className="text-xs text-muted-foreground">
      Personal messages, verified project attention and visible college notices · IST
    </p>
  </header>
  {openError?<p role="alert" className="text-sm text-error">{openError}</p>:null}
  {groups.length?groups.map(group=><div key={group.label} className="space-y-2">
    <h3 className="border-b border-border py-2 text-sm font-semibold">{group.label}</h3>
    {group.items.map(item=>{
      const href=safeNotificationActionHref(item.actionHref);
      return <article key={item.source+":"+item.id}
        className="space-y-2 rounded-lg border border-border bg-surface p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            {item.source==="PERSONAL"?"Personal":item.source==="ATTENTION"?
              "Project attention":"From the college"}
          </span>
          {item.read===false?<span className="text-xs font-semibold text-primary">
            Unread
          </span>:item.read===true?<span className="text-xs text-muted-foreground">
            Read
          </span>:<span className="text-xs text-muted-foreground">
            Read state unavailable
          </span>}
        </div>
        <strong className="block">{item.title}</strong>
        <p className="text-sm text-body">{item.description}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <time dateTime={item.occurredAt} className="text-xs text-muted-foreground">
            {new Date(item.occurredAt).toLocaleString("en-IN",{
              timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",
            })} IST
          </time>
          <div className="flex flex-wrap items-center gap-2">
            {href?<Link href={href}
              aria-disabled={opening===item.source+":"+item.id}
              onClick={event=>openNotification(event,item,href)}
              className="inline-flex min-h-9 items-center rounded border border-border px-3 text-sm font-semibold text-link">
              {opening===item.source+":"+item.id?"Marking read…":"Open →"}
            </Link>:null}
            {item.read===false&&item.source==="PERSONAL"?
              <MentorPersonalRead id={item.id}/>:null}
            {item.source!=="PERSONAL"&&item.read!==null&&item.receiptKey?
              <MentorSourceNotificationRead receiptKey={item.receiptKey}
                read={item.read}/>:null}
          </div>
        </div>
      </article>;
    })}
  </div>):<p role="status" className="border-y border-border py-6">
    No notifications match this selection in the loaded sources.
  </p>}
  {nextPersonal?<div className="flex flex-col items-start gap-2">
    <Button type="button" variant="secondary" size="sm"
      loading={loadingPersonal} disabled={loadingPersonal}
      onClick={()=>void loadOlderPersonal()}>
      {loadingPersonal?"Loading older personal messages…":"Load older personal messages"}
    </Button>
    {personalError?<p role="alert" className="text-xs text-error">{personalError}</p>:null}
   </div>:null}
  {nextNotices?<div className="flex flex-col items-start gap-2">
    <Button type="button" variant="secondary" size="sm"
      loading={loadingMore} disabled={loadingMore}
      onClick={()=>void loadOlderNotices()}>
      {loadingMore?"Loading older college notices…":"Load older college notices"}
    </Button>
    {olderError?<p role="alert" className="text-xs text-error">{olderError}</p>:null}
   </div>:null}
  <p className="text-xs text-muted-foreground">
    Older personal messages and college announcements can be loaded into the
    merged feed above. Read state is attached to your signed-in user, not this browser.
  </p>
 </section>;
}
