"use client";
import Link from "next/link";
import {Drawer} from "@/components/ui/drawer";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {tpoBellOpenHref} from "@/modules/activity/tpo-bell-open-model";
export type BellItem={id:string;title:string;body:string|null;actionHref:string|null;readAt:string|null;createdAt:string};
export function TpoBellPanel({initialUnread,items,revision=0}:{initialUnread:number;items:readonly BellItem[];revision?:number}){
 const [open,setOpen]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState("");
 const [allReadRevision,setAllReadRevision]=useState<number|null>(null);
 const [readIds,setReadIds]=useState<string[]>([]);
 const unread=allReadRevision===revision?0:Math.max(0,initialUnread-
  readIds.filter(id=>items.some(item=>item.id===id&&!item.readAt)).length);
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
  if(pending||unread===0)return;
  setPending(true);setError("");
  try{
   const response=await fetch("/api/tpo/notifications/read-all",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:"{}"});
   if(!response.ok)throw new Error("Unable to confirm read status");
   setAllReadRevision(revision);setReadIds(items.map(item=>item.id));router.refresh();
  }catch{setError("Read state was not confirmed. Refresh before retrying.");}
  finally{setPending(false);}
 }
 return <div className="relative min-w-0">
  <button type="button" aria-label={"Notifications, "+unread+" new"} aria-expanded={open} onClick={()=>setOpen(!open)}
   className="min-h-11 rounded border border-border bg-surface px-3 text-sm">
   Notifications {unread>0?"("+unread+" unread)":""}
  </button>
  <Drawer open={open} onOpenChange={setOpen} title="Notifications"
   description="Most recent notifications from your own college.">

   {items.length===0?<div role="status" className="text-sm"><p>Nothing yet</p><p className="mt-1 text-xs text-muted-foreground">Things that happen on your drives and recruiters show up here.</p></div>:<ul className="max-h-80 space-y-2 overflow-y-auto">
    {items.slice(0,20).map(item=><li key={item.id} className="rounded border border-border text-sm">
     <button type="button" disabled={pending} onClick={()=>void openItem(item)}
      className="w-full min-h-11 rounded p-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
     <p className="font-medium">{!item.readAt&&!readIds.includes(item.id)?<span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rounded-full bg-primary"/>:null}{item.title}{!item.readAt&&!readIds.includes(item.id)?<span className="sr-only"> New notification.</span>:null}</p>
     {item.body?<p className="break-words text-muted-foreground">{item.body}</p>:null}
     <time dateTime={item.createdAt} className="mt-1 block text-xs text-muted-foreground">
      {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit",timeZone:"Asia/Kolkata"}).format(new Date(item.createdAt))}
     </time>
     <span className="mt-1 inline-block text-xs font-semibold text-primary-text">{!item.readAt&&!readIds.includes(item.id)?"New  →":"→"}</span>
     </button>
    </li>)}</ul>}
   <div className="flex flex-wrap gap-3"><Link className="min-h-10 inline-flex items-center text-sm underline" href="/tpo/notifications">See all notifications</Link>
    <button type="button" className="min-h-10 rounded border border-border px-3 text-sm disabled:opacity-50" onClick={()=>void markAll()} disabled={pending||unread===0}>{pending?"Saving…":"Mark all read"}</button></div>
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  </Drawer>
 </div>;
}
