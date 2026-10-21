"use client";
import { Drawer } from "@/components/ui/drawer";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Button } from "@/components/ui/button";
import { MetricBar } from "@/components/ui/metric-bar";
import barStyles from "@/components/placements/report-bar-chart.module.css";
import {useEffect,useRef,useState} from "react";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

type Summary={delivered:number;read:number;unread:string[];notDelivered:boolean};
export function TpoNoticeReadProgress({id,status="SENT"}:{id:string;status?:"SENT"|"SCHEDULED"|"DRAFT"|"ENDED"}){
 const [data,setData]=useState<Summary|null>(null);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 const [reminder,setReminder]=useState("");
 const pending=useRef(false);
 const [unreadOpen,setUnreadOpen]=useState(false);
 const isSent=status==="SENT";
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
 useEffect(()=>{
  // Each sent notice shows its current persisted read/recipient counts without
  // first requiring an extra disclosure click. Failures leave a retry control.
  if (!isSent) return;
  void load();
  // An announcement ID is stable for the mounted card.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[id,isSent]);
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
   {data.delivered>0?<MetricBar role="progressbar" label="Notices read" maximum={data.delivered} value={data.read} unit="people" className={barStyles.track+" w-full"}/>:null}
   {isSent&&data.delivered>data.read&&data.unread.length?<Button variant="secondary" type="button" disabled={busy}
    className="min-h-11 min-[768px]:min-h-9"
    onClick={()=>void remind()}>{busy?"Sending…":"Remind them"}</Button>:null}
   {reminder?<InlineNotice tone="success" message={reminder}/>:null}
   {isSent&&data.delivered>data.read?<Button variant="ghost" type="button"
    className="min-h-11 text-link underline md:min-h-9" onClick={()=>setUnreadOpen(true)}>Who hasn&apos;t read ({data.delivered-data.read})</Button>:null}
   <Drawer open={unreadOpen} onOpenChange={setUnreadOpen} title="Who hasn't read"
     description={data.delivered-data.read+" students have not read this notice."}>
    {data.unread.length===0?<p className="text-sm text-body">Everyone has read it</p>:
     <ul className="divide-y divide-border">{data.unread.map((name,index)=>
       <li key={index} className="break-words py-3 text-sm">{name}</li>)}</ul>}
    {data.delivered-data.read>data.unread.length?
     <p className="mt-3 text-xs text-muted-foreground">Showing the first {data.unread.length} of {data.delivered-data.read} unread recipients. The remaining names are not available in this view.</p>:null}
    {data.unread.length===500?<p className="mt-2 text-xs text-muted-foreground">Showing the first 500.</p>:null}
   </Drawer>
  </div>:null}
  {error?<InlineNotice tone="error" message={error}/>:null}
 </section>;
}
