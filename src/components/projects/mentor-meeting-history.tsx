"use client";
import { Button } from "@/components/ui/button";
import {formatProjectIstDateTime} from "@/modules/projects/project-date-time-format-model";
import {useEffect,useState} from "react";

export type MentorMeetingHistoryItem={
 id:string;title:string;status:string;startsAt:string;
};
const PREVIEW=6;
function when(value:string){
 const parsed=new Date(value);
 return Number.isFinite(parsed.getTime())?formatProjectIstDateTime(parsed):"Date unavailable";
}
/** A preview of completed/cancelled meeting appointments, not their edit history. */
export function MentorMeetingHistory({meetings,projectId}:{meetings:readonly MentorMeetingHistoryItem[];projectId?:string}){
 const [expanded,setExpanded]=useState(false);
 const visible=expanded?meetings:meetings.slice(0,PREVIEW);
 return <section className="mt-3 space-y-2 text-sm" aria-label="Meeting history">
  <h4 className="font-semibold">Past meetings ({meetings.length})</h4>
  {meetings.length===0?<p className="text-muted-foreground">No past meetings yet.</p>:
    <ul className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
      {visible.map(item=><li key={item.id} className="py-[var(--lms-space-3)]">
        <span className="font-medium">{item.title}</span>
        <span className="block text-xs text-muted-foreground">{when(item.startsAt)} · {item.status}</span>
      </li>)}
    </ul>}
  {meetings.length>PREVIEW?<Button variant="secondary" type="button"
    aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}
    className="min-h-11 px-3 md:min-h-9">
    {expanded?"Show fewer":"View all "+meetings.length}
  </Button>:null}
  {projectId?<MentorMeetingRevisionHistory projectId={projectId}/>:null}
 </section>;
}
type RevisionRow={
 id:string;meetingId:string|null;meetingKey:string;actionType:string;
 actorName:string;createdAt:string;notes:string|null;changedFields:string[];
 before:Record<string,unknown>|null;after:Record<string,unknown>|null;
};
type RevisionPage={total:number;page:number;pageCount:number;items:RevisionRow[]};

/** Read the real, typed and tenant-scoped edit-event history in 20-row pages.
 * The scheduling list above stays a different concept. Never infer that its
 * six-row preview bounds event history; the API does that with DB pagination. */
export function MentorMeetingRevisionHistory({
 projectId,meetingKey,
}:{projectId:string;meetingKey?:string}){
 const [page,setPage]=useState(1);
 const [state,setState]=useState<RevisionPage|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  const query=new URLSearchParams({page:String(page)});
  if(meetingKey)query.set("meetingKey",meetingKey);
  setLoading(true);setError("");
  void fetch("/api/projects/"+encodeURIComponent(projectId)+
    "/mentor-meeting-history?"+query.toString(),{
     cache:"no-store",signal:controller.signal,
    }).then(async response=>{
     if(!response.ok)throw new Error("Meeting revisions are unavailable for this project.");
     return response.json() as Promise<RevisionPage>;
    }).then(result=>{
     if(controller.signal.aborted)return;
     if(!Number.isSafeInteger(result.total)||!Array.isArray(result.items))
      throw new Error("Meeting revisions returned an invalid response.");
     setState(result);
    }).catch(cause=>{
     if(controller.signal.aborted)return;
     setError(cause instanceof Error?cause.message:"Could not load meeting edit history.");
     setState(null);
    }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[projectId,meetingKey,page,reload]);
 return <section aria-label="Meeting edit history" className="min-w-0 space-y-2 border-t border-border pt-3 text-sm">
  <h4 className="font-semibold">Meeting edit history</h4>
  <p className="text-xs text-muted-foreground">Changes to a meeting (not a list of past meetings). Revision data is visible only to authorized mentors in this project.</p>
  {loading?<p role="status">Loading meeting revisions…</p>:null}
  {error?<div role="alert" className="space-y-2">
   <p className="text-error">{error}</p>
   <Button type="button" variant="secondary" onClick={()=>setReload(v=>v+1)}>Retry revisions</Button>
  </div>:null}
  {!loading&&!error&&state?.items.length===0?<p className="text-muted-foreground">No meeting edits have been recorded yet.</p>:null}
  {!loading&&!error&&state&&state.items.length>0?<ul className="divide-y divide-border border-y border-border">
   {state.items.map(item=><li key={item.id} className="min-w-0 space-y-1 py-3">
    <p className="break-words font-medium">{item.meetingId?"Meeting":"Deleted meeting"} · {item.meetingKey}</p>
    <p className="text-xs text-muted-foreground">{item.actionType} · {item.actorName} · {when(item.createdAt)}</p>
    {item.changedFields.length?<p className="break-words text-xs">Changed: {item.changedFields.join(", ")}</p>:null}
    {item.notes?<p className="whitespace-pre-wrap break-words text-xs">{item.notes}</p>:null}
    {(item.before||item.after)?<details className="text-xs">
     <summary className="cursor-pointer font-semibold text-link">Review before / after changes</summary>
     <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
      <div className="min-w-0"><strong>Before</strong><pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(item.before??{},null,2)}</pre></div>
      <div className="min-w-0"><strong>After</strong><pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(item.after??{},null,2)}</pre></div>
     </div>
    </details>:null}
   </li>)}
  </ul>:null}
  {state&&!loading&&!error?<div className="flex flex-wrap items-center gap-2 text-xs">
   <span>Page {state.page} of {state.pageCount} · {state.total} recorded revisions</span>
   <Button type="button" variant="secondary" disabled={state.page<=1}
    onClick={()=>setPage(n=>Math.max(1,n-1))}>Previous</Button>
   <Button type="button" variant="secondary" disabled={state.page>=state.pageCount}
    onClick={()=>setPage(n=>n+1)}>Next</Button>
  </div>:null}
 </section>;
}

