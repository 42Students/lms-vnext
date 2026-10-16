"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {tpoBellOpenHref} from "@/modules/activity/tpo-bell-open-model";
export type BellItem={id:string;title:string;body:string|null;actionHref:string|null;readAt:string|null};
export function TpoBellPanel({initialUnread,items}:{initialUnread:number;items:readonly BellItem[]}){
 const [open,setOpen]=useState(false),[unread,setUnread]=useState(initialUnread),[pending,setPending]=useState(false),[error,setError]=useState("");
 const [readIds,setReadIds]=useState<string[]>([]);
 const router=useRouter();
 async function openItem(item:BellItem){
  if(pending)return;
  const href=tpoBellOpenHref(item.actionHref);
  if(!item.readAt&&!readIds.includes(item.id)){
   setPending(true);setError("");
   try{
    const response=await fetch("/api/tpo/notifications/"+encodeURIComponent(item.id)+"/read",{
     method:"POST",credentials:"same-origin",
     headers:{"Content-Type":"application/json"},body:"{}",
    });
    if(!response.ok)throw new Error("Read state was not confirmed");
    setReadIds(ids=>ids.includes(item.id)?ids:[...ids,item.id]);
    setUnread(n=>Math.max(0,n-1));
   }catch{
    setError("Read state was not confirmed. Refresh before retrying.");
    return;
   }finally{setPending(false);}
  }
  setOpen(false);
  if(href)router.push(href);
  else router.refresh();
 }
 async function markAll(){
  if(pending||!window.confirm("Mark all your TPO notifications in this college as read?"))return;
  setPending(true);setError("");
  try{
   const response=await fetch("/api/tpo/notifications/read-all",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:"{}"});
   if(!response.ok)throw new Error("Unable to confirm read status");
   setUnread(0);setReadIds(items.map(item=>item.id));router.refresh();
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
   {items.length===0?<div role="status" className="text-sm"><p>Nothing yet</p><p className="mt-1 text-xs text-muted-foreground">Things that happen on your drives and recruiters show up here.</p></div>:<ul className="max-h-80 space-y-2 overflow-y-auto">
    {items.slice(0,10).map(item=><li key={item.id} className="rounded border border-border p-2 text-sm">
     <p className="font-medium">{item.title}{!item.readAt&&!readIds.includes(item.id)?" · Unread":""}</p>
     {item.body?<p className="break-words text-muted-foreground">{item.body}</p>:null}
     <button type="button" disabled={pending}
      onClick={()=>void openItem(item)}
      className="mt-1 inline-flex min-h-10 items-center text-primary-text underline disabled:opacity-50">
      {tpoBellOpenHref(item.actionHref)?"Open record":"Mark read"}
     </button>
    </li>)}</ul>}
   <div className="flex flex-wrap gap-3"><Link className="min-h-10 inline-flex items-center text-sm underline" href="/tpo/notifications">See all notifications</Link>
    <button type="button" className="min-h-10 rounded border border-border px-3 text-sm disabled:opacity-50" onClick={()=>void markAll()} disabled={pending||unread===0}>{pending?"Saving…":"Mark all read"}</button></div>
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  </section>:null}
 </div>;
}
