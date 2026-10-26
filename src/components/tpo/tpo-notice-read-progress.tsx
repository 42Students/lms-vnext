"use client";
import { Drawer } from "@/components/ui/drawer";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Button } from "@/components/ui/button";
import { MetricBar } from "@/components/ui/metric-bar";
import barStyles from "@/components/placements/report-bar-chart.module.css";
import {useCallback,useEffect,useRef,useState} from "react";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

type UnreadRecipient=string|{id?:string;name:string;rollNumber?:string|null;branchName?:string|null};
type Summary={delivered:number;read:number;unread:UnreadRecipient[];notDelivered:boolean};
export function TpoNoticeReadProgress({id,status="SENT"}:{id:string;status?:"SENT"|"SCHEDULED"|"DRAFT"|"ENDED"}){
 const [data,setData]=useState<Summary|null>(null);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 const [reminder,setReminder]=useState("");
 const pending=useRef(false);
 const [unreadOpen,setUnreadOpen]=useState(false);
 const isSent=status==="SENT";
 const load=useCallback(async()=>{
  if(pending.current)return;
  pending.current=true;setBusy(true);setError("");
  try{
   const result=await apiFetch<Summary>("/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/receipts",{
    cache:"no-store",credentials:"same-origin",timeoutMs:15000,
   });
   setData(result);
  }catch(reason){setError(reason instanceof Error?reason.message:friendlyApiError({network:true}));}
  finally{pending.current=false;setBusy(false);}
 },[id]);
 useEffect(()=>{
  // Each sent notice shows its current persisted read/recipient counts without
  // first requiring an extra disclosure click. Failures leave a retry control.
  if (!isSent) return;
  void load();
 },[isSent,load]);
 async function remind(){
  if(pending.current||!isSent||!data?.unread.length||data.read>=data.delivered)return;
  pending.current=true;setBusy(true);setError("");setReminder("");
  try{
   const reply=await apiFetch<{reminded:number}>("/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/remind",{
    method:"POST",credentials:"same-origin",timeoutMs:15000,
    headers:{"Content-Type":"application/json"},body:"{}",
   });
   const count=Number.isFinite(reply.reminded)?reply.reminded:0;
   setReminder("Reminded "+count+" student"+(count===1?"":"s"));
  }catch(reason){
   setError(reason instanceof FriendlyFetchError&&reason.status===429?
    "Reminders can be sent once per hour. Please try again later.":
    reason instanceof Error?reason.message:friendlyApiError({network:true}));
  }finally{pending.current=false;setBusy(false);}
 }
 return <section className="mt-3 min-w-0 border-t border-border pt-3">
  {!isSent?<p className="text-xs text-muted-foreground">{status==="SCHEDULED"?"Read tracking starts after sending.":status==="ENDED"?"This notice has ended.":"Read tracking starts when this notice is sent."}</p>:null}
  <Button variant="ghost" type="button" className="min-h-11 min-[768px]:min-h-9 text-sm underline"
   disabled={busy||!isSent} onClick={()=>void load()}>{busy?"Loading…":data?"Refresh read status":"Retry read status"}</Button>
  {data?<div className="mt-2 min-w-0 space-y-2 text-sm">
   <p>{data.notDelivered?"Awaiting notification delivery":data.read+" of "+data.delivered+" read · "+Math.round(data.read/Math.max(1,data.delivered)*100)+"%"}</p>
   {data.delivered>0?<MetricBar role="progressbar" label="Notices read" maximum={data.delivered} value={data.read} unit="people" className={barStyles["track"]+" w-full"}/>:null}
   {isSent&&data.delivered>data.read&&data.unread.length?<Button variant="secondary" type="button" disabled={busy}
    className="min-h-11 min-[768px]:min-h-9"
    onClick={()=>void remind()}>{busy?"Sending…":"Remind them"}</Button>:null}
   {reminder?<InlineNotice tone="success" message={reminder}/>:null}
   {isSent&&!data.notDelivered&&data.delivered>data.read&&data.unread.length>0?
    <section aria-label="Unread announcement recipients preview" className="mt-3 min-w-0 overflow-hidden rounded-lg border border-border">
     <h3 className="bg-surface-secondary px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
      Who has not read this notice
     </h3>
     <ul className="divide-y divide-border">
      {data.unread.slice(0,6).map((recipient,index)=>{
       const name=typeof recipient==="string"?recipient:recipient.name;
       const branch=typeof recipient==="string"?null:recipient.branchName;
       const roll=typeof recipient==="string"?null:recipient.rollNumber;
       const key=typeof recipient==="string"?index:recipient.id??index;
       return <li key={key} className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
        <span className="min-w-0 break-words font-semibold text-foreground">{name}</span>
        {branch||roll?<span className="break-words text-xs text-body">{[branch,roll].filter(Boolean).join(" · ")}</span>:null}
       </li>;
      })}
     </ul>
     {data.delivered-data.read>Math.min(6,data.unread.length)?
      <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
       Previewing {Math.min(6,data.unread.length)} of {data.delivered-data.read} not-yet-read recipients.
       Open the full list for all currently available names.
      </p>:null}
    </section>:null}

   {isSent&&data.delivered>data.read?<Button variant="ghost" type="button"
    className="min-h-11 text-link underline md:min-h-9" onClick={()=>setUnreadOpen(true)}>Who hasn&apos;t read ({data.delivered-data.read})</Button>:null}
   <Drawer open={unreadOpen} onOpenChange={setUnreadOpen} title="Who hasn't read"
     className="md:!w-[min(420px,100vw)] md:!max-w-[420px]"
     description={data.delivered-data.read+" students have not read this notice."}>
    <p className="mb-3 text-xs text-muted-foreground">You can remind students who have not read this notice once per hour.</p>
    {busy?<p role="status" className="mb-3 text-sm">Loading unread recipients…</p>:null}
    {error?<div role="alert" className="mb-3 text-sm text-error">{error} <Button type="button" variant="secondary" onClick={()=>void load()}>Retry</Button></div>:null}
    {data.unread.length===0?<p className="text-sm text-body">Everyone has read it</p>:
     <ul className="divide-y divide-border">{data.unread.slice(0,500).map((recipient,index)=>{
       const name=typeof recipient==="string"?recipient:recipient.name;
       const roll=typeof recipient==="string"?null:recipient.rollNumber;
       const branch=typeof recipient==="string"?null:recipient.branchName;
       const key=typeof recipient==="string"?index:recipient.id??index;
       return <li key={key} className="min-w-0 py-3 text-sm">
         <p className="break-words font-semibold">{name}</p>
         {roll||branch?<p className="mt-1 break-words text-xs text-muted-foreground">
           {[roll,branch].filter(Boolean).join(" · ")}
         </p>:null}
       </li>;
     })}</ul>}
    {data.delivered-data.read>data.unread.length?
     <p className="mt-3 text-xs text-muted-foreground">Showing the first {data.unread.length} of {data.delivered-data.read} unread recipients. The remaining names are not available in this view.</p>:null}
    {data.unread.length>=500?<p className="mt-2 text-xs text-muted-foreground">Showing the first 500.</p>:null}
   </Drawer>
  </div>:null}
  {error?<InlineNotice tone="error" message={error}/>:null}
 </section>;
}
