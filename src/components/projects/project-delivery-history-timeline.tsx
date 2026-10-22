"use client";
import {useEffect,useState} from "react";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";
type EventRow={id:string;action:string;label:string;occurredAt:string;
 revisionCount:number|null;actorName:string;actorRole:string|null;
 notes:string|null;feedback:string|null;attachmentCount:number};
export function ProjectDeliveryHistoryTimeline({projectId}:{projectId:string}){
 const [events,setEvents]=useState<EventRow[]>([]);
 const [hasMore,setHasMore]=useState(false),[loading,setLoading]=useState(true);
 const [error,setError]=useState(""),[retry,setRetry]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError("");
  void fetch("/api/projects/"+encodeURIComponent(projectId)+"/delivery/history?limit=100",{
   credentials:"same-origin",cache:"no-store",signal:controller.signal,
  }).then(async response=>{
   if(!response.ok)throw new Error(response.status===403?"Access denied":
     "Delivery history could not be loaded");
   return response.json() as Promise<{items:EventRow[];hasMore:boolean}>;
  }).then(data=>{
   if(controller.signal.aborted)return;
   if(!Array.isArray(data.items))throw new Error("Invalid delivery history response");
   setEvents(data.items);setHasMore(data.hasMore);
  }).catch(cause=>{
   if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:
    "Delivery history is unavailable");
  }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[projectId,retry]);
 const format=(iso:string)=>{
  const date=new Date(iso);
  return Number.isFinite(date.getTime())?
    new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
      timeZone:"Asia/Kolkata"}).format(date)+" IST":"Date unavailable";
 };
 return <section aria-label="Delivery history"
   className="mt-4 space-y-3 rounded-[var(--lms-control-radius)] border border-border bg-surface p-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h3 className="text-base font-semibold">Delivery history</h3>
   <Button type="button" size="sm" variant="secondary" disabled={loading}
    onClick={()=>setRetry(n=>n+1)}>Refresh history</Button>
  </div>
  {loading?<p role="status" className="text-sm text-body">Loading delivery history…</p>:null}
  {error?<div role="alert" className="space-y-2 text-sm text-error">
   <p>{error}</p><Button type="button" size="sm" variant="secondary"
    onClick={()=>setRetry(n=>n+1)}>Retry</Button></div>:null}
  {!loading&&!error&&!events.length?<p className="text-sm text-body">
   No delivery history has been recorded yet.</p>:null}
  {events.length?<ol className="divide-y divide-border">
   {events.map(item=><li key={item.id} className="min-w-0 py-3">
    <div className="flex flex-wrap items-center gap-2">
     <StatusBadge tone={item.action==="SUBMITTED"?"success":
       /REVIEW|REOPEN|CHANGES/i.test(item.action)?"warning":"neutral"}>
      {item.label}</StatusBadge>
     <span className="text-xs text-body">{format(item.occurredAt)}</span>
    </div>
    <p className="mt-1 break-words text-sm font-semibold">
     {item.actorName||"Project member"}
     {item.actorRole?" · "+item.actorRole:""}
     {item.revisionCount!==null?" · Revision "+item.revisionCount:""}
    </p>
    {item.notes?<p className="mt-1 whitespace-pre-wrap text-sm">{item.notes}</p>:null}
    {item.feedback?<p className="mt-1 whitespace-pre-wrap text-sm">
     Feedback: {item.feedback}</p>:null}
    <p className="mt-1 text-xs text-body">
     {item.attachmentCount} evidence attachment{item.attachmentCount===1?"":"s"}
    </p>
   </li>)}
  </ol>:null}
  {hasMore?<p role="status" className="text-xs text-body">
   Additional events exist outside the latest 100 loaded entries.</p>:null}
  <p className="text-xs text-body">
   File and external evidence links remain behind their separate authorized access controls.
   Historic URLs and contact information are not exposed in this timeline.
  </p>
 </section>;
}
