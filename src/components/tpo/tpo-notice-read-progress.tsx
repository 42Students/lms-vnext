"use client";
import { Button } from "@/components/ui/button";
import {useRef,useState} from "react";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

type Summary={delivered:number;read:number;unread:string[];notDelivered:boolean};
export function TpoNoticeReadProgress({id}:{id:string}){
 const [data,setData]=useState<Summary|null>(null);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 const [reminder,setReminder]=useState("");
 const pending=useRef(false);
 async function load(){
  if(pending.current)return;
  pending.current=true;setBusy(true);setError("");
  try{
   const result=await apiFetch<Summary>("/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/receipts",{
    cache:"no-store",credentials:"same-origin",timeoutMs:15000,
   });
   setData(result);
  }catch(reason){setError(reason instanceof Error?reason.message:friendlyApiError({network:true}));}
  finally{pending.current=false;setBusy(false);}
 }
 async function remind(){
  if(pending.current||!data?.unread.length)return;
  pending.current=true;setBusy(true);setError("");setReminder("");
  try{
   const reply=await apiFetch<{reminded:number}>("/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/remind",{
    method:"POST",credentials:"same-origin",timeoutMs:15000,
    headers:{"Content-Type":"application/json"},body:"{}",
   });
   setReminder("Reminder sent to "+(Number.isFinite(reply.reminded)?reply.reminded:0)+" unread people.");
  }catch(reason){
   setError(reason instanceof FriendlyFetchError&&reason.status===429?
    "Reminders can be sent once per hour. Please try again later.":
    reason instanceof Error?reason.message:friendlyApiError({network:true}));
  }finally{pending.current=false;setBusy(false);}
 }
 return <section className="mt-3 min-w-0 border-t border-border pt-3">
  <Button variant="ghost" type="button" className="min-h-11 sm:min-h-9 text-sm underline"
   disabled={busy} onClick={()=>void load()}>{busy?"Loading…":data?"Refresh read status":"Show read status"}</Button>
  {data?<div className="mt-2 min-w-0 space-y-2 text-sm">
   <p>{data.notDelivered?"Awaiting notification delivery":data.read+" of "+data.delivered+" read"}</p>
   {data.delivered>0?<progress aria-label="Notices read" max={data.delivered} value={data.read} className="w-full"/>:null}
   {data.unread.length?<Button variant="secondary" type="button" disabled={busy}
    className="min-h-11 sm:min-h-9"
    onClick={()=>void remind()}>{busy?"Sending…":"Remind them"}</Button>:null}
   {reminder?<p role="status">{reminder}</p>:null}
   {data.unread.length?<details><summary className="min-h-11 sm:min-h-9 cursor-pointer text-primary-text">Who hasn&apos;t read</summary>
    <ul className="max-h-48 overflow-auto">{data.unread.map((name,index)=>
     <li key={index} className="break-words py-0.5">{name}</li>)}</ul>
   </details>:null}
  </div>:null}
  {error?<p role="alert" className="mt-2 break-words text-sm text-error">{error}</p>:null}
 </section>;
}
