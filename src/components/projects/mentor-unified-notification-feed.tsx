"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {apiFetch} from "@/lib/api-fetch";
import {safeNotificationActionHref} from "@/modules/activity/notification-action";
import {mentorUnifiedNotificationGroups,type MentorUnifiedNotification} from
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
export function MentorUnifiedNotificationFeed({items}:{items:readonly MentorUnifiedNotification[]}){
 const groups=mentorUnifiedNotificationGroups(items);
 return <section className="min-w-0 space-y-3" aria-label="Mentor chronological notifications">
  <header className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-lg font-semibold">Your notifications · {items.length} loaded</h2>
    <p className="text-xs text-muted-foreground">
      Personal messages, verified project attention and visible college notices · IST
    </p>
  </header>
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
              className="inline-flex min-h-9 items-center rounded border border-border px-3 text-sm font-semibold text-link">
              Open →
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
  <p className="text-xs text-muted-foreground">
    Older personal messages and college announcements may require additional
    pages. Read state is attached to your signed-in user, not this browser.
  </p>
 </section>;
}
