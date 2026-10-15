"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
export type BellItem={id:string;title:string;body:string|null;actionHref:string|null;readAt:string|null};
export function TpoBellPanel({initialUnread,items}:{initialUnread:number;items:readonly BellItem[]}){
 const [open,setOpen]=useState(false),[unread,setUnread]=useState(initialUnread),[pending,setPending]=useState(false),[error,setError]=useState("");
 const router=useRouter();
 async function markAll(){
  if(pending||!window.confirm("Mark all your TPO notifications in this college as read?"))return;
  setPending(true);setError("");
  try{
   const response=await fetch("/api/tpo/notifications/read-all",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:"{}"});
   if(!response.ok)throw new Error("Unable to confirm read status");
   setUnread(0);router.refresh();
  }catch{setError("Read state was not confirmed. Refresh before retrying.");}
  finally{setPending(false);}
 }
 return <div className="relative min-w-0">
  <button type="button" aria-label="TPO notifications" aria-expanded={open} onClick={()=>setOpen(!open)}
   className="min-h-11 rounded border border-border bg-surface px-3 text-sm">
   Notifications {unread>0?"("+unread+" unread)":""}
  </button>
  {open?<section role="region" aria-label="Notification bell panel" className="absolute right-0 z-30 mt-2 w-[min(90vw,24rem)] max-w-full space-y-3 rounded-xl border border-border bg-surface p-4 shadow-lg">
   <header className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">Notifications</h2><button type="button" className="text-sm underline" onClick={()=>setOpen(false)}>Close</button></header>
   <p className="text-xs text-muted-foreground">Most recent notifications from your own college.</p>
   {items.length===0?<p role="status" className="text-sm">No notifications yet.</p>:<ul className="max-h-80 space-y-2 overflow-y-auto">
    {items.slice(0,10).map(item=><li key={item.id} className="rounded border border-border p-2 text-sm">
     <p className="font-medium">{item.title}{!item.readAt?" · Unread":""}</p>
     {item.body?<p className="break-words text-muted-foreground">{item.body}</p>:null}
     {item.actionHref?.startsWith("/")&&!item.actionHref.startsWith("//")?
      <Link className="mt-1 inline-block text-primary-text underline" href={item.actionHref}>Open record</Link>:null}
    </li>)}</ul>}
   <div className="flex flex-wrap gap-3"><Link className="min-h-10 inline-flex items-center text-sm underline" href="/tpo/notifications">All notifications</Link>
    <button type="button" className="min-h-10 rounded border border-border px-3 text-sm disabled:opacity-50" onClick={()=>void markAll()} disabled={pending||unread===0}>{pending?"Saving…":"Mark all read"}</button></div>
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  </section>:null}
 </div>;
}
